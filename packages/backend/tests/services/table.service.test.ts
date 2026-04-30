import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { TableService } from '../../src/services/table.service.js';
import { TableRepository } from '../../src/repositories/table.repository.js';
import { OrderRepository } from '../../src/repositories/order.repository.js';
import { SSEService } from '../../src/services/sse.service.js';
import { AppError } from '../../src/errors/app-error.js';

function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE table_info (
      table_id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      table_number INTEGER NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE table_sessions (
      session_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL,
      ended_at TEXT
    );
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
  `);
  return db;
}

describe('TableService', () => {
  let db: Database.Database;
  let tableRepo: TableRepository;
  let orderRepo: OrderRepository;
  let sseService: SSEService;
  let tableService: TableService;

  beforeEach(() => {
    db = createTestDb();
    tableRepo = new TableRepository(db);
    orderRepo = new OrderRepository(db);
    sseService = {
      notifyTableCompleted: vi.fn(),
    } as any;
    tableService = new TableService(db, tableRepo, orderRepo, sseService);
  });

  afterEach(() => {
    db.close();
  });

  describe('createTable', () => {
    it('should create a table', () => {
      const table = tableService.createTable(1, 5, 'hashedpw');
      expect(table.table_number).toBe(5);
      expect(table.store_id).toBe(1);
    });

    it('should throw for duplicate table number', () => {
      tableService.createTable(1, 5, 'hashedpw');
      expect(() => tableService.createTable(1, 5, 'hashedpw2')).toThrow(AppError);
    });
  });

  describe('updateTable', () => {
    it('should update table number', () => {
      const table = tableService.createTable(1, 5, 'hashedpw');
      const updated = tableService.updateTable(1, table.table_id, { table_number: 10 });
      expect(updated.table_number).toBe(10);
    });

    it('should throw for non-existent table', () => {
      expect(() => tableService.updateTable(1, 999, { table_number: 10 })).toThrow(AppError);
    });

    it('should throw for duplicate table number on update', () => {
      tableService.createTable(1, 5, 'h1');
      const t2 = tableService.createTable(1, 10, 'h2');
      expect(() => tableService.updateTable(1, t2.table_id, { table_number: 5 })).toThrow(AppError);
    });
  });

  describe('getOrCreateSession', () => {
    it('should create new session when none exists', () => {
      const table = tableService.createTable(1, 5, 'hashedpw');
      const session = tableService.getOrCreateSession(1, table.table_id);
      expect(session.status).toBe('active');
      expect(session.table_id).toBe(table.table_id);
    });

    it('should return existing active session', () => {
      const table = tableService.createTable(1, 5, 'hashedpw');
      const s1 = tableService.getOrCreateSession(1, table.table_id);
      const s2 = tableService.getOrCreateSession(1, table.table_id);
      expect(s1.session_id).toBe(s2.session_id);
    });
  });

  describe('completeTable', () => {
    it('should move orders to history and complete session', () => {
      const table = tableService.createTable(1, 5, 'hashedpw');
      const session = tableService.getOrCreateSession(1, table.table_id);

      // Create orders
      orderRepo.create({ order_number: '20260430-001', store_id: 1, table_id: table.table_id, session_id: session.session_id, total_amount: 50000, status: 'completed', ordered_at: '2026-04-30T12:00:00Z', updated_at: '2026-04-30T12:00:00Z' });

      const result = tableService.completeTable(1, table.table_id);
      expect(result.message).toBe('이용 완료 처리되었습니다');
      expect(result.historyCount).toBe(1);

      // Session should be completed
      const activeSession = tableRepo.findActiveSession(table.table_id);
      expect(activeSession).toBeUndefined();

      // Orders should be deleted
      const orders = orderRepo.findBySession(1, session.session_id);
      expect(orders).toHaveLength(0);

      // History should exist
      const history = orderRepo.findHistoryByTable(1, table.table_id, '2026-04-30T00:00:00Z', '2026-04-30T23:59:59Z');
      expect(history).toHaveLength(1);

      expect(sseService.notifyTableCompleted).toHaveBeenCalled();
    });

    it('should throw for non-existent table', () => {
      expect(() => tableService.completeTable(1, 999)).toThrow(AppError);
    });

    it('should throw for already completed session', () => {
      const table = tableService.createTable(1, 5, 'hashedpw');
      // No active session
      expect(() => tableService.completeTable(1, table.table_id)).toThrow(AppError);
    });
  });

  describe('getTablesByStore', () => {
    it('should return tables with session info', () => {
      const t1 = tableService.createTable(1, 1, 'h1');
      const t2 = tableService.createTable(1, 2, 'h2');
      tableService.getOrCreateSession(1, t1.table_id);

      const result = tableService.getTablesByStore(1);
      expect(result).toHaveLength(2);
      expect(result[0].activeSession).not.toBeNull();
      expect(result[1].activeSession).toBeNull();
    });
  });
});
