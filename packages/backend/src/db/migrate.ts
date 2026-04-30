import { sql } from 'drizzle-orm';
import { db } from './index.js';
import * as schema from './schema.js';

export function runMigrations() {
  db.run(sql`CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS admins_store_username_idx ON admins(store_id, username)`);

  db.run(sql`CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    table_number INTEGER NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS tables_store_number_idx ON tables(store_id, table_number)`);

  db.run(sql`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS table_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL REFERENCES tables(id),
    store_id INTEGER NOT NULL REFERENCES stores(id),
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    table_id INTEGER NOT NULL REFERENCES tables(id),
    session_id INTEGER NOT NULL REFERENCES table_sessions(id),
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    ordered_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
    menu_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    table_id INTEGER NOT NULL REFERENCES tables(id),
    session_id INTEGER NOT NULL,
    order_data TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  console.log('✅ Migrations complete');
}
