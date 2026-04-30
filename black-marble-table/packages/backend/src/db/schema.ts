import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================================
// Category 테이블
// ============================================================
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: text('store_id').notNull(),
  name: text('name').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================
// MenuItem 테이블
// ============================================================
export const menuItems = sqliteTable('menu_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  storeId: text('store_id').notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description'),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// ============================================================
// Type Inference Helpers
// ============================================================
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;
