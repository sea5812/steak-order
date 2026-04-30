import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { OrderService } from '../../src/services/order.service.js';
import { OrderRepository } from '../../src/repositories/order.repository.js';
import { SSEService } from '../../src/services/sse.service.js';
import { AppError } from '../../src/errors/app-error.js';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      store_id INTEGER NOT NULL,
      table_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      ordered_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE order_items (
      order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      menu_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL
    );
    CREATE TABLE order_history (
      history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_order_id INTEGER NOT NULL,
      order_number TEXT NOT NULL,
      store_id INTEGER NOT NULL,
      table_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      total_amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      ordered_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      items_json TEXT NOT NULL
    );
    CREATE TABLE menu_items (
      menu_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed menu items
  db.exec(`
    INSERT INTO menu_items (menu_item_id, store_id, category_id, name, price, display_order) VALUES
    (1, 1, 1, '포터하우스', 198000, 1),
    (2, 1, 1, '프라임 립아이', 109000, 2),
    (3, 1, 2, '울프강 샐러드', 32000, 1);
  `);

  return db;
}

describe('OrderService', () => {
  let db: Database.Database;
  let orderRepo: OrderRepository;
  let sseService: SSEService;
  let orderService: OrderService;

  beforeEach(() => {
    db = createTestDb();
    orderRepo = new OrderRepository(db);
    sseService = {
      notifyNewOrder: vi.fn(),
      notifyOrderUpdated: vi.fn(),
      notifyOrderDeleted: vi.fn(),
      notifyTableOrderStatusChanged: vi.fn(),
      notifyTableOrderDeleted: vi.fn(),
    } as any;
    orderService = new OrderService(db, orderRepo, sseService);
  });

  describe('createOrder', () => {
    it('should create order with server-validated prices', () => {
      const result = orderService.createOrder(1, 5, 10, [
        { menu_item_id: 1, quantity: 1 },
        { menu_item_id: 3, quantity: 2 },
      ]);

      expect(result.order.status).toBe('pending');
      expect(result.order.total_amount).toBe(198000 + 32000 * 2); // 262000
      expect(result.items).toHaveLength(2);
      expect(result.items[0].unit_price).toBe(198000);
      expect(result.items[0].menu_name).toBe('포터하우스');
      expect(sseService.notifyNewOrder).toHaveBeenCalled();
    });

    it('should throw for invalid menu item', () => {
      expect(() => {
        orderService.createOrder(1, 5, 10, [{ menu_item_id: 999, quantity: 1 }]);
      }).toThrow(AppError);
    });

    it('should generate sequential order numbers', () => {
      const r1 = orderService.createOrder(1, 5, 10, [{ menu_item_id: 1, quantity: 1 }]);
      const r2 = orderService.createOrder(1, 5, 10, [{ menu_item_id: 2, quantity: 1 }]);

      expect(r1.order.order_number).toMatch(/^\d{8}-001$/);
      expect(r2.order.order_number).toMatch(/^\d{8}-002$/);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and notify SSE', () => {
      const created = orderService.createOrder(1, 5, 10, [{ menu_item_id: 1, quantity: 1 }]);
      const result = orderService.updateOrderStatus(1, created.order.order_id, 'preparing');

      expect(result.order.status).toBe('preparing');
      expect(sseService.notifyOrderUpdated).toHaveBeenCalled();
      expect(sseService.notifyTableOrderStatusChanged).toHaveBeenCalled();
    });

    it('should be idempotent for same status', () => {
      const created = orderService.createOrder(1, 5, 10, [{ menu_item_id: 1, quantity: 1 }]);
      const result = orderService.updateOrderStatus(1, created.order.order_id, 'pending');

      expect(result.order.status).toBe('pending');
      // SSE should NOT be called for same status
      expect(sseService.notifyOrderUpdated).not.toHaveBeenCalled();
    });

    it('should throw for non-existent order', () => {
      expect(() => {
        orderService.updateOrderStatus(1, 999, 'preparing');
      }).toThrow(AppError);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order and notify SSE', () => {
      const created = orderService.createOrder(1, 5, 10, [{ menu_item_id: 1, quantity: 1 }]);
      orderService.deleteOrder(1, created.order.order_id);

      expect(orderRepo.findById(created.order.order_id)).toBeUndefined();
      expect(sseService.notifyOrderDeleted).toHaveBeenCalled();
      expect(sseService.notifyTableOrderDeleted).toHaveBeenCalled();
    });

    it('should throw for non-existent order', () => {
      expect(() => {
        orderService.deleteOrder(1, 999);
      }).toThrow(AppError);
    });
  });

  describe('getOrdersByTable', () => {
    it('should return orders for session', () => {
      orderService.createOrder(1, 5, 10, [{ menu_item_id: 1, quantity: 1 }]);
      orderService.createOrder(1, 5, 10, [{ menu_item_id: 2, quantity: 1 }]);

      const result = orderService.getOrdersByTable(1, 10);
      expect(result).toHaveLength(2);
    });
  });
});
