import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/db/schema.js';
import bcrypt from 'bcryptjs';

export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  // Create tables
  sqlite.exec(`
    CREATE TABLE stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX admins_store_username_idx ON admins(store_id, username);
    CREATE TABLE tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      table_number INTEGER NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX tables_store_number_idx ON tables(store_id, table_number);
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT,
      image_url TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE table_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL REFERENCES tables(id),
      store_id INTEGER NOT NULL REFERENCES stores(id),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT
    );
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      table_id INTEGER NOT NULL REFERENCES tables(id),
      session_id INTEGER NOT NULL REFERENCES table_sessions(id),
      total_amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      ordered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      menu_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL
    );
    CREATE TABLE order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      table_id INTEGER NOT NULL REFERENCES tables(id),
      session_id INTEGER NOT NULL,
      order_data TEXT NOT NULL,
      completed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const testDb = drizzle(sqlite, { schema });
  return { db: testDb, sqlite };
}

export async function seedTestData(db: ReturnType<typeof createTestDb>['db']) {
  const hash = bcrypt.hashSync('password123', 10);
  const tableHash = bcrypt.hashSync('table1', 10);

  db.insert(schema.stores).values({
    slug: 'test-store',
    name: 'Test Store',
    address: 'Test Address',
  }).run();

  db.insert(schema.admins).values({
    storeId: 1,
    username: 'testadmin',
    passwordHash: hash,
  }).run();

  db.insert(schema.tables).values({
    storeId: 1,
    tableNumber: 1,
    passwordHash: tableHash,
  }).run();
}
