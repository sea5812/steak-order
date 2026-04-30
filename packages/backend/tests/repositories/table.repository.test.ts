import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { TableRepository } from '../../src/repositories/table.repository.js';

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
      ended_at TEXT,
      FOREIGN KEY (table_id) REFERENCES table_info(table_id)
    );
  `);
  return db;
}

describe('TableRepository', () => {
  let db: Database.Database;
  let repo: TableRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new TableRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('TableInfo', () => {
    it('should create and find a table', () => {
      const table = repo.create({ store_id: 1, table_number: 5, password_hash: 'hash123' });
      expect(table.table_id).toBeDefined();
      expect(table.table_number).toBe(5);

      const found = repo.findById(table.table_id);
      expect(found).toBeDefined();
      expect(found!.table_number).toBe(5);
    });

    it('should find table by store and number', () => {
      repo.create({ store_id: 1, table_number: 5, password_hash: 'hash123' });
      const found = repo.findByTableNumber(1, 5);
      expect(found).toBeDefined();
      expect(found!.table_number).toBe(5);
    });

    it('should find all tables by store', () => {
      repo.create({ store_id: 1, table_number: 1, password_hash: 'hash1' });
      repo.create({ store_id: 1, table_number: 2, password_hash: 'hash2' });
      repo.create({ store_id: 2, table_number: 1, password_hash: 'hash3' });

      const tables = repo.findByStoreId(1);
      expect(tables).toHaveLength(2);
      expect(tables[0].table_number).toBe(1);
      expect(tables[1].table_number).toBe(2);
    });

    it('should update table', () => {
      const table = repo.create({ store_id: 1, table_number: 5, password_hash: 'hash123' });
      const updated = repo.update(table.table_id, { table_number: 10 });
      expect(updated!.table_number).toBe(10);
    });
  });

  describe('TableSession', () => {
    it('should create and find active session', () => {
      const table = repo.create({ store_id: 1, table_number: 5, password_hash: 'hash123' });
      const session = repo.createSession({
        table_id: table.table_id,
        store_id: 1,
        status: 'active',
        started_at: '2026-04-30T12:00:00Z',
      });

      expect(session.session_id).toBeDefined();
      expect(session.status).toBe('active');

      const found = repo.findActiveSession(table.table_id);
      expect(found).toBeDefined();
      expect(found!.session_id).toBe(session.session_id);
    });

    it('should complete session', () => {
      const table = repo.create({ store_id: 1, table_number: 5, password_hash: 'hash123' });
      const session = repo.createSession({
        table_id: table.table_id,
        store_id: 1,
        status: 'active',
        started_at: '2026-04-30T12:00:00Z',
      });

      repo.completeSession(session.session_id, '2026-04-30T14:00:00Z');

      const active = repo.findActiveSession(table.table_id);
      expect(active).toBeUndefined();
    });

    it('should find active sessions by store', () => {
      const t1 = repo.create({ store_id: 1, table_number: 1, password_hash: 'h1' });
      const t2 = repo.create({ store_id: 1, table_number: 2, password_hash: 'h2' });
      repo.createSession({ table_id: t1.table_id, store_id: 1, status: 'active', started_at: '2026-04-30T12:00:00Z' });
      repo.createSession({ table_id: t2.table_id, store_id: 1, status: 'active', started_at: '2026-04-30T12:00:00Z' });

      const sessions = repo.findActiveSessionByStore(1);
      expect(sessions).toHaveLength(2);
    });
  });
});
