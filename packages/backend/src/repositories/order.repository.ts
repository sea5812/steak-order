// OrderRepository - Data access layer for Order, OrderItem, OrderHistory

import type Database from 'better-sqlite3';
import type {
  Order,
  OrderItem,
  OrderWithItems,
  NewOrder,
  NewOrderItem,
  OrderHistory,
  NewOrderHistory,
} from '../types/order.types.js';

export class OrderRepository {
  constructor(private db: Database.Database) {}

  // ============================================================
  // Order CRUD
  // ============================================================

  create(data: NewOrder): Order {
    const stmt = this.db.prepare(`
      INSERT INTO orders (order_number, store_id, table_id, session_id, total_amount, status, ordered_at, updated_at)
      VALUES (@order_number, @store_id, @table_id, @session_id, @total_amount, @status, @ordered_at, @updated_at)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(orderId: number): Order | undefined {
    const stmt = this.db.prepare(`SELECT * FROM orders WHERE order_id = ?`);
    return stmt.get(orderId) as Order | undefined;
  }

  findByIdAndStore(orderId: number, storeId: number): Order | undefined {
    const stmt = this.db.prepare(`SELECT * FROM orders WHERE order_id = ? AND store_id = ?`);
    return stmt.get(orderId, storeId) as Order | undefined;
  }

  findBySession(storeId: number, sessionId: number): Order[] {
    const stmt = this.db.prepare(`
      SELECT * FROM orders
      WHERE store_id = ? AND session_id = ?
      ORDER BY ordered_at ASC
    `);
    return stmt.all(storeId, sessionId) as Order[];
  }

  findByStoreAndDate(storeId: number, datePrefix: string): Order[] {
    const stmt = this.db.prepare(`
      SELECT * FROM orders
      WHERE store_id = ? AND ordered_at LIKE ?
      ORDER BY ordered_at DESC
    `);
    return stmt.all(storeId, `${datePrefix}%`) as Order[];
  }

  findBySessionIds(storeId: number, sessionIds: number[]): Order[] {
    if (sessionIds.length === 0) return [];
    const placeholders = sessionIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT * FROM orders
      WHERE store_id = ? AND session_id IN (${placeholders})
      ORDER BY ordered_at ASC
    `);
    return stmt.all(storeId, ...sessionIds) as Order[];
  }

  updateStatus(orderId: number, status: string, updatedAt: string): Order | undefined {
    const stmt = this.db.prepare(`
      UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?
    `);
    stmt.run(status, updatedAt, orderId);
    return this.findById(orderId);
  }

  deleteById(orderId: number): void {
    this.db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(orderId);
    this.db.prepare(`DELETE FROM orders WHERE order_id = ?`).run(orderId);
  }

  deleteBySessionId(sessionId: number): void {
    const orders = this.db.prepare(`SELECT order_id FROM orders WHERE session_id = ?`).all(sessionId) as { order_id: number }[];
    for (const order of orders) {
      this.db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(order.order_id);
    }
    this.db.prepare(`DELETE FROM orders WHERE session_id = ?`).run(sessionId);
  }

  // ============================================================
  // OrderItem
  // ============================================================

  createItems(items: NewOrderItem[]): OrderItem[] {
    const stmt = this.db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, menu_name, quantity, unit_price, subtotal)
      VALUES (@order_id, @menu_item_id, @menu_name, @quantity, @unit_price, @subtotal)
    `);
    const results: OrderItem[] = [];
    for (const item of items) {
      const result = stmt.run(item);
      const inserted = this.db.prepare(`SELECT * FROM order_items WHERE order_item_id = ?`)
        .get(result.lastInsertRowid as number) as OrderItem;
      results.push(inserted);
    }
    return results;
  }

  findItemsByOrderId(orderId: number): OrderItem[] {
    const stmt = this.db.prepare(`SELECT * FROM order_items WHERE order_id = ?`);
    return stmt.all(orderId) as OrderItem[];
  }

  findItemsByOrderIds(orderIds: number[]): OrderItem[] {
    if (orderIds.length === 0) return [];
    const placeholders = orderIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`);
    return stmt.all(...orderIds) as OrderItem[];
  }

  // ============================================================
  // OrderHistory
  // ============================================================

  createHistory(data: NewOrderHistory): OrderHistory {
    const stmt = this.db.prepare(`
      INSERT INTO order_history (original_order_id, order_number, store_id, table_id, session_id, total_amount, status, ordered_at, completed_at, items_json)
      VALUES (@original_order_id, @order_number, @store_id, @table_id, @session_id, @total_amount, @status, @ordered_at, @completed_at, @items_json)
    `);
    const result = stmt.run(data);
    return this.db.prepare(`SELECT * FROM order_history WHERE history_id = ?`)
      .get(result.lastInsertRowid as number) as OrderHistory;
  }

  findHistoryByTable(
    storeId: number,
    tableId: number,
    startDate: string,
    endDate: string
  ): OrderHistory[] {
    const stmt = this.db.prepare(`
      SELECT * FROM order_history
      WHERE store_id = ? AND table_id = ? AND completed_at >= ? AND completed_at <= ?
      ORDER BY completed_at DESC
    `);
    return stmt.all(storeId, tableId, startDate, endDate) as OrderHistory[];
  }

  // ============================================================
  // Order Number
  // ============================================================

  getLastOrderNumberForDate(storeId: number, datePrefix: string): string | undefined {
    const stmt = this.db.prepare(`
      SELECT order_number FROM orders
      WHERE store_id = ? AND order_number LIKE ?
      ORDER BY order_number DESC
      LIMIT 1
    `);
    const row = stmt.get(storeId, `${datePrefix}-%`) as { order_number: string } | undefined;
    return row?.order_number;
  }

  // ============================================================
  // Helpers
  // ============================================================

  getOrderWithItems(orderId: number): OrderWithItems | undefined {
    const order = this.findById(orderId);
    if (!order) return undefined;
    const items = this.findItemsByOrderId(orderId);
    return { order, items };
  }

  getOrdersWithItems(orders: Order[]): OrderWithItems[] {
    const orderIds = orders.map((o) => o.order_id);
    const allItems = this.findItemsByOrderIds(orderIds);
    const itemsByOrderId = new Map<number, OrderItem[]>();
    for (const item of allItems) {
      if (!itemsByOrderId.has(item.order_id)) {
        itemsByOrderId.set(item.order_id, []);
      }
      itemsByOrderId.get(item.order_id)!.push(item);
    }
    return orders.map((order) => ({
      order,
      items: itemsByOrderId.get(order.order_id) || [],
    }));
  }
}
