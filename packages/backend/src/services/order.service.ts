// OrderService - Business logic for order management
// Aligned with Unit 1 schema

import type Database from 'better-sqlite3';
import { OrderRepository } from '../repositories/order.repository.js';
import { SSEService } from './sse.service.js';
import { AppError } from '../errors/app-error.js';
import { withRetry } from '../utils/retry.js';
import { getNowISO } from '../utils/order-number.js';
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

  createOrder(
    storeId: number,
    tableId: number,
    sessionId: number,
    items: CreateOrderItemInput[]
  ): OrderWithItems {
    const menuItemIds = items.map((i) => i.menu_item_id);
    const menuItems = this.getMenuItemsByIds(storeId, menuItemIds);

    const menuMap = new Map<number, MenuItem>();
    for (const mi of menuItems) {
      menuMap.set(mi.id, mi);
    }

    for (const item of items) {
      if (!menuMap.has(item.menu_item_id)) {
        throw new AppError(400, 'INVALID_MENU_ITEM', `유효하지 않은 메뉴가 포함되어 있습니다 (ID: ${item.menu_item_id})`);
      }
    }

    const now = getNowISO();

    const orderItems: NewOrderItem[] = items.map((item) => {
      const menu = menuMap.get(item.menu_item_id)!;
      return {
        order_id: 0,
        menu_item_id: item.menu_item_id,
        menu_name: menu.name,
        quantity: item.quantity,
        unit_price: menu.price,
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    const newOrder: NewOrder = {
      store_id: storeId,
      table_id: tableId,
      session_id: sessionId,
      total_amount: totalAmount,
      status: 'pending',
      ordered_at: now,
    };

    const result = withRetry(() => {
      return this.db.transaction(() => {
        const order = this.orderRepository.create(newOrder);
        const itemsWithOrderId = orderItems.map((item) => ({
          ...item,
          order_id: order.id,
        }));
        const createdItems = this.orderRepository.createItems(itemsWithOrderId);
        return { order, items: createdItems };
      })();
    });

    this.sseService.notifyNewOrder(storeId, result);
    return result;
  }

  getOrdersByTable(storeId: number, sessionId: number): OrderWithItems[] {
    const orders = this.orderRepository.findBySession(storeId, sessionId);
    return this.orderRepository.getOrdersWithItems(orders);
  }

  getOrdersByStore(storeId: number, date?: string): OrderWithItems[] {
    if (date) {
      const orders = this.orderRepository.findByStoreAndDate(storeId, date);
      return this.orderRepository.getOrdersWithItems(orders);
    }
    const orders = this.orderRepository.findByStore(storeId);
    return this.orderRepository.getOrdersWithItems(orders);
  }

  updateOrderStatus(storeId: number, orderId: number, status: OrderStatus): OrderWithItems {
    const order = this.orderRepository.findByIdAndStore(orderId, storeId);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다');
    }

    if (order.status === status) {
      const items = this.orderRepository.findItemsByOrderId(orderId);
      return { order, items };
    }

    const result = withRetry(() => {
      return this.orderRepository.updateStatus(orderId, status);
    });

    if (!result) {
      throw new AppError(500, 'INTERNAL_ERROR', '주문 상태 변경 중 오류가 발생했습니다');
    }

    const items = this.orderRepository.findItemsByOrderId(orderId);
    const orderWithItems: OrderWithItems = { order: result, items };

    this.sseService.notifyOrderUpdated(storeId, orderWithItems);
    this.sseService.notifyTableOrderStatusChanged(storeId, order.table_id, orderWithItems);

    return orderWithItems;
  }

  deleteOrder(storeId: number, orderId: number): void {
    const order = this.orderRepository.findByIdAndStore(orderId, storeId);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다');
    }

    const tableId = order.table_id;

    withRetry(() => {
      this.orderRepository.deleteById(orderId);
    });

    this.sseService.notifyOrderDeleted(storeId, orderId, tableId);
    this.sseService.notifyTableOrderDeleted(storeId, tableId, orderId);
  }

  private getMenuItemsByIds(storeId: number, menuItemIds: number[]): MenuItem[] {
    if (menuItemIds.length === 0) return [];
    const placeholders = menuItemIds.map(() => '?').join(',');
    return this.db.prepare(
      `SELECT * FROM menu_items WHERE store_id = ? AND id IN (${placeholders})`
    ).all(storeId, ...menuItemIds) as MenuItem[];
  }
}
