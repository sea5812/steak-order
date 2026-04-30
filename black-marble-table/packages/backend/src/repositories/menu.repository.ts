import { eq, and, asc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories, menuItems } from '../db/schema.js';
import type { Category, InsertCategory, MenuItem, InsertMenuItem } from '../db/schema.js';

export class MenuRepository {
  // ============================================================
  // Category Methods
  // ============================================================

  async findCategoriesByStore(storeId: string): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(eq(categories.storeId, storeId))
      .orderBy(asc(categories.displayOrder));
  }

  async findCategoryById(categoryId: number): Promise<Category | undefined> {
    const results = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    return results[0];
  }

  async findCategoryByName(storeId: string, name: string): Promise<Category | undefined> {
    const results = await db
      .select()
      .from(categories)
      .where(and(eq(categories.storeId, storeId), eq(categories.name, name)))
      .limit(1);
    return results[0];
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const results = await db.insert(categories).values(data).returning();
    return results[0];
  }

  async updateCategory(categoryId: number, data: Partial<InsertCategory>): Promise<Category> {
    const results = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, categoryId))
      .returning();
    return results[0];
  }

  async deleteCategory(categoryId: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, categoryId));
  }

  async getMaxCategoryOrder(storeId: string): Promise<number> {
    const result = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${categories.displayOrder}), -1)` })
      .from(categories)
      .where(eq(categories.storeId, storeId));
    return result[0]?.maxOrder ?? -1;
  }

  async updateCategoryOrders(orders: { id: number; displayOrder: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const order of orders) {
        await tx
          .update(categories)
          .set({ displayOrder: order.displayOrder, updatedAt: new Date().toISOString() })
          .where(eq(categories.id, order.id));
      }
    });
  }

  // ============================================================
  // MenuItem Methods
  // ============================================================

  async findMenusByStore(storeId: string, categoryId?: number): Promise<MenuItem[]> {
    if (categoryId !== undefined) {
      return db
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.storeId, storeId), eq(menuItems.categoryId, categoryId)))
        .orderBy(asc(menuItems.displayOrder));
    }
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.storeId, storeId))
      .orderBy(asc(menuItems.displayOrder));
  }

  async findMenuById(menuId: number): Promise<MenuItem | undefined> {
    const results = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, menuId))
      .limit(1);
    return results[0];
  }

  async findMenusByIds(menuIds: number[]): Promise<MenuItem[]> {
    if (menuIds.length === 0) return [];
    const results = await db.select().from(menuItems);
    return results.filter((item) => menuIds.includes(item.id));
  }

  async createMenu(data: InsertMenuItem): Promise<MenuItem> {
    const results = await db.insert(menuItems).values(data).returning();
    return results[0];
  }

  async updateMenu(menuId: number, data: Partial<InsertMenuItem>): Promise<MenuItem> {
    const results = await db
      .update(menuItems)
      .set(data)
      .where(eq(menuItems.id, menuId))
      .returning();
    return results[0];
  }

  async deleteMenu(menuId: number): Promise<void> {
    await db.delete(menuItems).where(eq(menuItems.id, menuId));
  }

  async countMenusByCategory(categoryId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(menuItems)
      .where(eq(menuItems.categoryId, categoryId));
    return result[0]?.count ?? 0;
  }

  async getMaxMenuOrder(storeId: string, categoryId: number): Promise<number> {
    const result = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${menuItems.displayOrder}), -1)` })
      .from(menuItems)
      .where(and(eq(menuItems.storeId, storeId), eq(menuItems.categoryId, categoryId)));
    return result[0]?.maxOrder ?? -1;
  }

  async updateMenuOrders(orders: { id: number; displayOrder: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const order of orders) {
        await tx
          .update(menuItems)
          .set({ displayOrder: order.displayOrder, updatedAt: new Date().toISOString() })
          .where(eq(menuItems.id, order.id));
      }
    });
  }
}
