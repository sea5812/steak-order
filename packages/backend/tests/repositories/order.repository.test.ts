import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { OrderRepository } from '../../src/repositories/order.repository.js';

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
      subtotal INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id)
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
  `);
  return db;
}

describe('OrderRepository', () => {
  let db: Database.Database;
  let repo: OrderRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new OrderRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('Order CRUD', () => {
    it('should create and find an order', () => {
      const order = repo.create({
        order_number: '20260430-001',
        store_id: 1,
        table_id: 5,
        session_id: 10,
        total_amount: 50000,
        status: 'pending',
        ordered_at: '2026-04-30T12:00:00Z',
        updated_at: '2026-04-30T12:00:00Z',
      });

      expect(order.order_id).toBeDefined();
      expect(order.order_number).toBe('20260430-001');
      expect(order.total_amount).toBe(50000);

      const found = repo.findById(order.order_id);
      expect(found).toBeDefined();
      expect(found!.order_number).toBe('20260430-001');
    });

    it('should find orders by session', () => {
      repo.create({ order_number: '20260430-001', store_id: 1, table_id: 5, session_id: 10, total_amount: 10000, status: 'pending', ordered_at: '2026-04-30T12:00:00Z', updated_at: '2026-04-30T12:00:00Z' });
      repo.create({ order_number: '20260430-002', store_id: 1, table_id: 5, session_id: 10, total_amount: 20000, status: 'pending', ordered_at: '2026-04-30T12:01:00Z', updated_at: '2026-04-30T12:01:00Z' });
      repo.create({ order_number: '20260430-003', store_id: 1, table_id: 6, session_id: 11, total_amount: 30000, status: 'pending', ordered_at: '2026-04-30T12:02:00Z', updated_at: '2026-04-30T12:02:00Z' });

      const orders = repo.findBySession(1, 10);
      expect(orders).toHaveLength(2);
    });

    it('should update order status', () => {
      const order = repo.create({ order_number: '20260430-001', store_id: 1, table_id: 5, session_id: 10, total_amount: 10000, status: 'pending', ordered_at: '2026-04-30T12:00:00Z', updated_at: '2026-04-30T12:00:00Z' });

      const updated = repo.updateStatus(order.order_id, 'preparing', '2026-04-30T12:05:00Z');
      expect(updated!.status).toBe('preparing');
    });

    it('should delete order and its items', () => {
      const order = repo.create({ order_number: '20260430-001', store_id: 1, table_id: 5, session_id: 10, total_amount: 10000, status: 'pending', ordered_at: '2026-04-30T12:00:00Z', updated_at: '2026-04-30T12:00:00Z' });
      repo.createItems([{ order_id: order.order_id, menu_item_id: 1, menu_name: 'Test', quantity: 2, unit_price: 5000, subtotal: 10000 }]);

      repo.deleteById(order.order_id);

      expect(repo.findById(order.order_id)).toBeUndefined();
      expect(repo.findItemsByOrderId(order.order_id)).toHaveLength(0);
    });
  });

  describe('OrderItem', () => {
    it('should create and find order items', () => {
      const order = repo.create({ order_number: '20260430-001', store_id: 1, table_id: 5, session_id: 10, total_amount: 15000, status: 'pending', ordered_at: '2026-04-30T12:00:00Z', updated_at: '2026-04-30T12:00:00Z' });

      const items = repo.createItems([
        { order_id: order.order_id, menu_item_id: 1, menu_name: 'Steak', quantity: 1, unit_price: 10000, subtotal: 10000 },
        { order_id: order.order_id, menu_item_id: 2, menu_name: 'Salad', quantity: 1, unit_price: 5000, subtotal: 5000 },
      ]);

      expect(items).toHaveLength(2);
      expect(items[0].menu_name).toBe('Steak');

      const found = repo.findItemsByOrderId(order.order_id);
      expect(found).toHaveLength(2);
    });
  });

  describe('OrderHistory', () => {
    it('should create and find order history', () => {
      const history = repo.createHistory({
        original_order_id: 1,
        order_number: '20260430-001',
        store_id: 1,
        table_id: 5,
        session_id: 10,
        total_amount: 50000,
        status: 'completed',
        ordered_at: '2026-04-30T12:00:00Z',
        completed_at: '2026-04-30T14:00:00Z',
        items_json: JSON.stringify([{ menu_name: 'Steak', quantity: 1, unit_price: 50000, subtotal: 50000 }]),
      });

      expect(history.history_id).toBeDefined();

      const found = repo.findHistoryByTable(1, 5, '2026-04-30T00:00:00Z', '2026-04-30T23:59:59Z');
      expect(found).toHaveLength(1);
      expect(found[0].order_number).toBe('20260430-001');
    });
  });

  describe('Order Number', () => {
    it('should get last order number for date', () => {
      repo.create({ order_number: '20260430-001', store_id: 1, table_id: 5, session_id: 10, total_amount: 10000, status: 'pending', ordered_at: '2026-04-30T12:00:00Z', updated_at: '2026-04-30T12:00:00Z' });
      repo.create({ order_number: '20260430-003', store_id: 1, table_id: 5, session_id: 10, total_amount: 20000, status: 'pending', ordered_at: '2026-04-30T12:01:00Z', updated_at: '2026-04-30T12:01:00Z' });

      const last = repo.getLastOrderNumberForDate(1, '20260430');
      expect(last).toBe('20260430-003');
    });

    it('should return undefined when no orders for date', () => {
      const last = repo.getLastOrderNumberForDate(1, '20260430');
      expect(last).toBeUndefined();
    });
  });
});
