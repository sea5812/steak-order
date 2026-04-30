import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const stores = sqliteTable('stores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  address: text('address'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('admins_store_username_idx').on(table.storeId, table.username),
]);

export const tables = sqliteTable('tables', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  tableNumber: integer('table_number').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  uniqueIndex('tables_store_number_idx').on(table.storeId, table.tableNumber),
]);

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const tableSessions = sqliteTable('table_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tableId: integer('table_id').notNull().references(() => tables.id),
  storeId: integer('store_id').notNull().references(() => stores.id),
  startedAt: text('started_at').notNull().default(sql`(datetime('now'))`),
  endedAt: text('ended_at'),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  tableId: integer('table_id').notNull().references(() => tables.id),
  sessionId: integer('session_id').notNull().references(() => tableSessions.id),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull().default('pending'),
  orderedAt: text('ordered_at').notNull().default(sql`(datetime('now'))`),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  menuName: text('menu_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
});

export const orderHistory = sqliteTable('order_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: integer('store_id').notNull().references(() => stores.id),
  tableId: integer('table_id').notNull().references(() => tables.id),
  sessionId: integer('session_id').notNull(),
  orderData: text('order_data').notNull(),
  completedAt: text('completed_at').notNull().default(sql`(datetime('now'))`),
});
