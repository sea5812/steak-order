// OrderRepository - Aligned with Unit 1 schema

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

  // === Order CRUD ===

  create(data: NewOrder): Order {
    const stmt = this.db.prepare(`
      INSERT INTO orders (store_id, table_id, session_id, total_amount, status, ordered_at)
      VALUES (@store_id, @table_id, @session_id, @total_amount, @status, @ordered_at)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(orderId: number): Order | undefined {
    return this.db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as Order | undefined;
  }

  findByIdAndStore(orderId: number, storeId: number): Order | undefined {
    return this.db.prepare(`SELECT * FROM orders WHERE id = ? AND store_id = ?`).get(orderId, storeId) as Order | undefined;
  }

  findBySession(storeId: number, sessionId: number): Order[] {
    return this.db.prepare(`SELECT * FROM orders WHERE store_id = ? AND session_id = ? ORDER BY ordered_at ASC`).all(storeId, sessionId) as Order[];
  }

  findByStoreAndDate(storeId: number, datePrefix: string): Order[] {
    return this.db.prepare(`SELECT * FROM orders WHERE store_id = ? AND ordered_at LIKE ? ORDER BY ordered_at DESC`).all(storeId, `${datePrefix}%`) as Order[];
  }

  findByStore(storeId: number): Order[] {
    return this.db.prepare(`SELECT * FROM orders WHERE store_id = ? ORDER BY ordered_at DESC`).all(storeId) as Order[];
  }

  findBySessionIds(storeId: number, sessionIds: number[]): Order[] {
    if (sessionIds.length === 0) return [];
    const placeholders = sessionIds.map(() => '?').join(',');
    return this.db.prepare(`SELECT * FROM orders WHERE store_id = ? AND session_id IN (${placeholders}) ORDER BY ordered_at ASC`).all(storeId, ...sessionIds) as Order[];
  }

  updateStatus(orderId: number, status: string): Order | undefined {
    this.db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, orderId);
    return this.findById(orderId);
  }

  deleteById(orderId: number): void {
    this.db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(orderId);
    this.db.prepare(`DELETE FROM orders WHERE id = ?`).run(orderId);
  }

  deleteBySessionId(sessionId: number): void {
    const orders = this.db.prepare(`SELECT id FROM orders WHERE session_id = ?`).all(sessionId) as { id: number }[];
    for (const order of orders) {
      this.db.prepare(`DELETE FROM order_items WHERE order_id = ?`).run(order.id);
    }
    this.db.prepare(`DELETE FROM orders WHERE session_id = ?`).run(sessionId);
  }

  // === OrderItem ===

  createItems(items: NewOrderItem[]): OrderItem[] {
    const stmt = this.db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, menu_name, quantity, unit_price)
      VALUES (@order_id, @menu_item_id, @menu_name, @quantity, @unit_price)
    `);
    const results: OrderItem[] = [];
    for (const item of items) {
      const result = stmt.run(item);
      const inserted = this.db.prepare(`SELECT * FROM order_items WHERE id = ?`).get(result.lastInsertRowid as number) as OrderItem;
      results.push(inserted);
    }
    return results;
  }

  findItemsByOrderId(orderId: number): OrderItem[] {
    return this.db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(orderId) as OrderItem[];
  }

  findItemsByOrderIds(orderIds: number[]): OrderItem[] {
    if (orderIds.length === 0) return [];
    const placeholders = orderIds.map(() => '?').join(',');
    return this.db.prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`).all(...orderIds) as OrderItem[];
  }

  // === OrderHistory ===

  createHistory(data: NewOrderHistory): OrderHistory {
    const stmt = this.db.prepare(`
      INSERT INTO order_history (store_id, table_id, session_id, order_data, completed_at)
      VALUES (@store_id, @table_id, @session_id, @order_data, @completed_at)
    `);
    const result = stmt.run(data);
    return this.db.prepare(`SELECT * FROM order_history WHERE id = ?`).get(result.lastInsertRowid as number) as OrderHistory;
  }

  findHistoryByTable(storeId: number, tableId: number, startDate?: string, endDate?: string): OrderHistory[] {
    if (startDate && endDate) {
      return this.db.prepare(`SELECT * FROM order_history WHERE store_id = ? AND table_id = ? AND completed_at >= ? AND completed_at <= ? ORDER BY completed_at DESC`).all(storeId, tableId, startDate, endDate) as OrderHistory[];
    }
    return this.db.prepare(`SELECT * FROM order_history WHERE store_id = ? AND table_id = ? ORDER BY completed_at DESC`).all(storeId, tableId) as OrderHistory[];
  }

  // === Helpers ===

  getOrderWithItems(orderId: number): OrderWithItems | undefined {
    const order = this.findById(orderId);
    if (!order) return undefined;
    const items = this.findItemsByOrderId(orderId);
    return { order, items };
  }

  getOrdersWithItems(orders: Order[]): OrderWithItems[] {
    const orderIds = orders.map((o) => o.id);
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
      items: itemsByOrderId.get(order.id) || [],
    }));
  }
}
