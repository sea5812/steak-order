// TableRepository - Data access layer for TableInfo and TableSession

import type Database from 'better-sqlite3';
import type {
  TableInfo,
  TableSession,
  NewTableInfo,
  NewTableSession,
} from '../types/order.types.js';

export class TableRepository {
  constructor(private db: Database.Database) {}

  // ============================================================
  // TableInfo
  // ============================================================

  create(data: NewTableInfo): TableInfo {
    const stmt = this.db.prepare(`
      INSERT INTO table_info (store_id, table_number, password_hash)
      VALUES (@store_id, @table_number, @password_hash)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(tableId: number): TableInfo | undefined {
    const stmt = this.db.prepare(`SELECT * FROM table_info WHERE table_id = ?`);
    return stmt.get(tableId) as TableInfo | undefined;
  }

  findByIdAndStore(tableId: number, storeId: number): TableInfo | undefined {
    const stmt = this.db.prepare(`SELECT * FROM table_info WHERE table_id = ? AND store_id = ?`);
    return stmt.get(tableId, storeId) as TableInfo | undefined;
  }

  findByStoreId(storeId: number): TableInfo[] {
    const stmt = this.db.prepare(`SELECT * FROM table_info WHERE store_id = ? ORDER BY table_number ASC`);
    return stmt.all(storeId) as TableInfo[];
  }

  findByTableNumber(storeId: number, tableNumber: number): TableInfo | undefined {
    const stmt = this.db.prepare(`SELECT * FROM table_info WHERE store_id = ? AND table_number = ?`);
    return stmt.get(storeId, tableNumber) as TableInfo | undefined;
  }

  update(tableId: number, data: Partial<Pick<TableInfo, 'table_number' | 'password_hash'>>): TableInfo | undefined {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.table_number !== undefined) {
      fields.push('table_number = ?');
      values.push(data.table_number);
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }

    if (fields.length === 0) return this.findById(tableId);

    values.push(tableId);
    const stmt = this.db.prepare(`UPDATE table_info SET ${fields.join(', ')} WHERE table_id = ?`);
    stmt.run(...values);
    return this.findById(tableId);
  }

  // ============================================================
  // TableSession
  // ============================================================

  findActiveSession(tableId: number): TableSession | undefined {
    const stmt = this.db.prepare(`SELECT * FROM table_sessions WHERE table_id = ? AND status = 'active'`);
    return stmt.get(tableId) as TableSession | undefined;
  }

  findActiveSessionByStore(storeId: number): TableSession[] {
    const stmt = this.db.prepare(`SELECT * FROM table_sessions WHERE store_id = ? AND status = 'active'`);
    return stmt.all(storeId) as TableSession[];
  }

  createSession(data: NewTableSession): TableSession {
    const stmt = this.db.prepare(`
      INSERT INTO table_sessions (table_id, store_id, status, started_at)
      VALUES (@table_id, @store_id, @status, @started_at)
    `);
    const result = stmt.run(data);
    return this.db.prepare(`SELECT * FROM table_sessions WHERE session_id = ?`)
      .get(result.lastInsertRowid as number) as TableSession;
  }

  completeSession(sessionId: number, endedAt: string): void {
    const stmt = this.db.prepare(`
      UPDATE table_sessions SET status = 'completed', ended_at = ? WHERE session_id = ?
    `);
    stmt.run(endedAt, sessionId);
  }
}
