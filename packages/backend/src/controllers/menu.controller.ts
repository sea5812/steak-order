import { Router } from 'express';
import type { Request, Response } from 'express';
import { adminAuth, verifyStoreAccess } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { sqlite } from '../db/index.js';

const router = Router();

// GET /api/stores/:storeId/categories
router.get(
  '/stores/:storeId/categories',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = Number(req.params.storeId);
    const categories = sqlite
      .prepare('SELECT * FROM categories WHERE store_id = ? ORDER BY display_order ASC')
      .all(storeId);
    const mapped = (categories as Record<string, unknown>[]).map((c) => ({
      id: c.id,
      storeId: c.store_id,
      name: c.name,
      sortOrder: c.display_order,
    }));
    res.json(mapped);
  }),
);

// POST /api/stores/:storeId/categories
router.post(
  '/stores/:storeId/categories',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: '카테고리명을 입력해주세요.' });
    const maxOrder = sqlite
      .prepare('SELECT MAX(display_order) as max_order FROM categories WHERE store_id = ?')
      .get(storeId) as { max_order: number | null };
    const displayOrder = (maxOrder?.max_order ?? 0) + 1;
    const result = sqlite
      .prepare('INSERT INTO categories (store_id, name, display_order) VALUES (?, ?, ?)')
      .run(storeId, name, displayOrder);
    const category = sqlite.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  }),
);

// GET /api/stores/:storeId/menus
router.get(
  '/stores/:storeId/menus',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = Number(req.params.storeId);
    const menus = sqlite
      .prepare('SELECT * FROM menu_items WHERE store_id = ? ORDER BY display_order ASC')
      .all(storeId);
    // Map column names to match frontend types
    const mapped = (menus as Record<string, unknown>[]).map((m) => ({
      id: m.id,
      storeId: m.store_id,
      categoryId: m.category_id,
      name: m.name,
      price: m.price,
      description: m.description,
      imageUrl: m.image_url,
      sortOrder: m.display_order,
    }));
    res.json(mapped);
  }),
);

// GET /api/stores/:storeId/menus/:id
router.get(
  '/stores/:storeId/menus/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const storeId = Number(req.params.storeId);
    const id = Number(req.params.id);
    const menu = sqlite
      .prepare('SELECT * FROM menu_items WHERE id = ? AND store_id = ?')
      .get(id, storeId) as Record<string, unknown> | undefined;
    if (!menu) return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
    res.json({
      id: menu.id,
      storeId: menu.store_id,
      categoryId: menu.category_id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.image_url,
      sortOrder: menu.display_order,
    });
  }),
);

// POST /api/stores/:storeId/menus
router.post(
  '/stores/:storeId/menus',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const { name, price, description, categoryId } = req.body;
    if (!name || price === undefined || !categoryId) {
      return res.status(400).json({ message: '메뉴명, 가격, 카테고리는 필수입니다.' });
    }
    const maxOrder = sqlite
      .prepare('SELECT MAX(display_order) as max_order FROM menu_items WHERE store_id = ?')
      .get(storeId) as { max_order: number | null };
    const displayOrder = (maxOrder?.max_order ?? 0) + 1;
    const result = sqlite
      .prepare('INSERT INTO menu_items (store_id, category_id, name, price, description, image_url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(storeId, categoryId, name, Number(price), description || null, null, displayOrder);
    const menu = sqlite.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
    res.status(201).json({
      id: menu.id,
      storeId: menu.store_id,
      categoryId: menu.category_id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.image_url,
      sortOrder: menu.display_order,
    });
  }),
);

// PUT /api/stores/:storeId/menus/:id
router.put(
  '/stores/:storeId/menus/:id',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const id = Number(req.params.id);
    const existing = sqlite.prepare('SELECT * FROM menu_items WHERE id = ? AND store_id = ?').get(id, storeId);
    if (!existing) return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });

    const { name, price, description, categoryId } = req.body;
    const sets: string[] = [];
    const values: unknown[] = [];
    if (name !== undefined) { sets.push('name = ?'); values.push(name); }
    if (price !== undefined) { sets.push('price = ?'); values.push(Number(price)); }
    if (description !== undefined) { sets.push('description = ?'); values.push(description || null); }
    if (categoryId !== undefined) { sets.push('category_id = ?'); values.push(categoryId); }
    if (sets.length > 0) {
      values.push(id);
      sqlite.prepare(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    }
    const menu = sqlite.prepare('SELECT * FROM menu_items WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({
      id: menu.id,
      storeId: menu.store_id,
      categoryId: menu.category_id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.image_url,
      sortOrder: menu.display_order,
    });
  }),
);

// DELETE /api/stores/:storeId/menus/:id
router.delete(
  '/stores/:storeId/menus/:id',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const id = Number(req.params.id);
    const existing = sqlite.prepare('SELECT * FROM menu_items WHERE id = ? AND store_id = ?').get(id, storeId);
    if (!existing) return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
    sqlite.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    res.status(204).send();
  }),
);

// PUT /api/stores/:storeId/menus/reorder
router.put(
  '/stores/:storeId/menus/reorder',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { menuOrders } = req.body;
    if (!Array.isArray(menuOrders)) return res.status(400).json({ message: '순서 정보가 필요합니다.' });
    const stmt = sqlite.prepare('UPDATE menu_items SET display_order = ? WHERE id = ?');
    for (const item of menuOrders) {
      stmt.run(item.sortOrder, item.menuId);
    }
    res.json({ message: '순서가 변경되었습니다.' });
  }),
);

export const menuController = router;
