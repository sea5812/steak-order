// TableRepository - Aligned with Unit 1 schema

import type Database from 'better-sqlite3';
import type { TableInfo, TableSession, NewTableSession } from '../types/order.types.js';

export class TableRepository {
  constructor(private db: Database.Database) {}

  // === Table CRUD ===

  create(storeId: number, tableNumber: number, passwordHash: string): TableInfo {
    const stmt = this.db.prepare(`INSERT INTO tables (store_id, table_number, password_hash) VALUES (?, ?, ?)`);
    const result = stmt.run(storeId, tableNumber, passwordHash);
    return this.findById(result.lastInsertRowid as number)!;
  }

  findById(tableId: number): TableInfo | undefined {
    return this.db.prepare(`SELECT * FROM tables WHERE id = ?`).get(tableId) as TableInfo | undefined;
  }

  findByIdAndStore(tableId: number, storeId: number): TableInfo | undefined {
    return this.db.prepare(`SELECT * FROM tables WHERE id = ? AND store_id = ?`).get(tableId, storeId) as TableInfo | undefined;
  }

  findByStoreId(storeId: number): TableInfo[] {
    return this.db.prepare(`SELECT * FROM tables WHERE store_id = ? ORDER BY table_number ASC`).all(storeId) as TableInfo[];
  }

  findByStoreAndNumber(storeId: number, tableNumber: number): TableInfo | undefined {
    return this.db.prepare(`SELECT * FROM tables WHERE store_id = ? AND table_number = ?`).get(storeId, tableNumber) as TableInfo | undefined;
  }

  update(tableId: number, data: { table_number?: number; password_hash?: string }): TableInfo | undefined {
    const sets: string[] = [];
    const values: unknown[] = [];
    if (data.table_number !== undefined) { sets.push('table_number = ?'); values.push(data.table_number); }
    if (data.password_hash !== undefined) { sets.push('password_hash = ?'); values.push(data.password_hash); }
    if (sets.length === 0) return this.findById(tableId);
    values.push(tableId);
    this.db.prepare(`UPDATE tables SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(tableId);
  }

  // === Table Sessions ===

  createSession(data: NewTableSession): TableSession {
    const stmt = this.db.prepare(`INSERT INTO table_sessions (table_id, store_id, started_at) VALUES (@table_id, @store_id, @started_at)`);
    const result = stmt.run(data);
    return this.db.prepare(`SELECT * FROM table_sessions WHERE id = ?`).get(result.lastInsertRowid as number) as TableSession;
  }

  findActiveSession(tableId: number): TableSession | undefined {
    return this.db.prepare(`SELECT * FROM table_sessions WHERE table_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1`).get(tableId) as TableSession | undefined;
  }

  findActiveSessionsByStore(storeId: number): TableSession[] {
    return this.db.prepare(`SELECT * FROM table_sessions WHERE store_id = ? AND ended_at IS NULL`).all(storeId) as TableSession[];
  }

  endSession(sessionId: number, endedAt: string): void {
    this.db.prepare(`UPDATE table_sessions SET ended_at = ? WHERE id = ?`).run(endedAt, sessionId);
  }
}
