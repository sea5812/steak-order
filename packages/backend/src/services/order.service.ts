// OrderService - Business logic for order management

import type Database from 'better-sqlite3';
import { OrderRepository } from '../repositories/order.repository.js';
import { SSEService } from './sse.service.js';
import { AppError } from '../errors/app-error.js';
import { withRetry } from '../utils/retry.js';
import { generateOrderNumber, getTodayDateString, getNowISO } from '../utils/order-number.js';
import type {
  CreateOrderItemInput,
  OrderWithItems,
  OrderStatus,
  MenuItem,
  NewOrder,
  NewOrderItem,
} from '../types/order.types.js';

export class OrderService {
  constructor(
    private db: Database.Database,
    private orderRepository: OrderRepository,
    private sseService: SSEService
  ) {}

  // ============================================================
  // Create Order (US-C04)
  // ============================================================

  createOrder(
    storeId: number,
    tableId: number,
    sessionId: number,
    items: CreateOrderItemInput[]
  ): OrderWithItems {
    // Validate menu items exist and get server prices
    const menuItemIds = items.map((i) => i.menu_item_id);
    const menuItems = this.getMenuItemsByIds(storeId, menuItemIds);

    const menuMap = new Map<number, MenuItem>();
    for (const mi of menuItems) {
      menuMap.set(mi.menu_item_id, mi);
    }

    // Check all menu items exist
    for (const item of items) {
      if (!menuMap.has(item.menu_item_id)) {
        throw new AppError(400, 'INVALID_MENU_ITEM', `유효하지 않은 메뉴가 포함되어 있습니다 (ID: ${item.menu_item_id})`);
      }
    }

    // Generate order number
    const today = getTodayDateString();
    const lastOrderNumber = this.orderRepository.getLastOrderNumberForDate(storeId, today);
    const orderNumber = generateOrderNumber(lastOrderNumber, today);
    const now = getNowISO();

    // Calculate totals using server prices
    const orderItems: NewOrderItem[] = items.map((item) => {
      const menu = menuMap.get(item.menu_item_id)!;
      const subtotal = item.quantity * menu.price;
      return {
        order_id: 0, // will be set after order creation
        menu_item_id: item.menu_item_id,
        menu_name: menu.name,
        quantity: item.quantity,
        unit_price: menu.price,
        subtotal,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const newOrder: NewOrder = {
      order_number: orderNumber,
      store_id: storeId,
      table_id: tableId,
      session_id: sessionId,
      total_amount: totalAmount,
      status: 'pending',
      ordered_at: now,
      updated_at: now,
    };

    // Transaction with retry
    const result = withRetry(() => {
      return this.db.transaction(() => {
        const order = this.orderRepository.create(newOrder);
        const itemsWithOrderId = orderItems.map((item) => ({
          ...item,
          order_id: order.order_id,
        }));
        const createdItems = this.orderRepository.createItems(itemsWithOrderId);
        return { order, items: createdItems };
      })();
    });

    // SSE notification
    this.sseService.notifyNewOrder(storeId, result);

    return result;
  }

  // ============================================================
  // Get Orders by Table Session (US-C05)
  // ============================================================

  getOrdersByTable(storeId: number, sessionId: number): OrderWithItems[] {
    const orders = this.orderRepository.findBySession(storeId, sessionId);
    return this.orderRepository.getOrdersWithItems(orders);
  }

  // ============================================================
  // Get Orders by Store (US-A03)
  // ============================================================

  getOrdersByStore(storeId: number, date?: string): OrderWithItems[] {
    const datePrefix = date || new Date().toISOString().slice(0, 10);
    const orders = this.orderRepository.findByStoreAndDate(storeId, datePrefix);
    return this.orderRepository.getOrdersWithItems(orders);
  }

  // ============================================================
  // Update Order Status (US-A03)
  // ============================================================

  updateOrderStatus(storeId: number, orderId: number, status: OrderStatus): OrderWithItems {
    const order = this.orderRepository.findByIdAndStore(orderId, storeId);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다');
    }

    // Same status - idempotent, no change
    if (order.status === status) {
      const items = this.orderRepository.findItemsByOrderId(orderId);
      return { order, items };
    }

    const now = getNowISO();
    const result = withRetry(() => {
      const updated = this.orderRepository.updateStatus(orderId, status, now);
      return updated;
    });

    if (!result) {
      throw new AppError(500, 'INTERNAL_ERROR', '주문 상태 변경 중 오류가 발생했습니다');
    }

    const items = this.orderRepository.findItemsByOrderId(orderId);
    const orderWithItems: OrderWithItems = { order: result, items };

    // SSE notifications
    this.sseService.notifyOrderUpdated(storeId, orderWithItems);
    this.sseService.notifyTableOrderStatusChanged(storeId, order.table_id, orderWithItems);

    return orderWithItems;
  }

  // ============================================================
  // Delete Order (US-A04)
  // ============================================================

  deleteOrder(storeId: number, orderId: number): void {
    const order = this.orderRepository.findByIdAndStore(orderId, storeId);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다');
    }

    const tableId = order.table_id;

    withRetry(() => {
      this.orderRepository.deleteById(orderId);
    });

    // SSE notifications
    this.sseService.notifyOrderDeleted(storeId, orderId, tableId);
    this.sseService.notifyTableOrderDeleted(storeId, tableId, orderId);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private getMenuItemsByIds(storeId: number, menuItemIds: number[]): MenuItem[] {
    if (menuItemIds.length === 0) return [];
    const placeholders = menuItemIds.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM menu_items WHERE store_id = ? AND menu_item_id IN (${placeholders})`
    );
    return stmt.all(storeId, ...menuItemIds) as MenuItem[];
  }
}
