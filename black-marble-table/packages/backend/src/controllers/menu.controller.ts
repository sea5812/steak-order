import { Router } from 'express';
import multer from 'multer';
import { MenuService } from '../services/menu.service.js';
import { authMiddleware, tableOrAdminAuthMiddleware, adminOnly } from '../middleware/auth.js';
import { ValidationError } from '../errors/index.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type { Response, NextFunction } from 'express';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new ValidationError('이미지는 JPEG 또는 PNG 형식만 허용됩니다', 'IMAGE_INVALID_FORMAT') as any, false);
    }
  },
});

export function createMenuRouter(menuService?: MenuService): Router {
  const router = Router({ mergeParams: true });
  const service = menuService || new MenuService();

  // ============================================================
  // Category Endpoints
  // ============================================================

  // GET /api/stores/:storeId/categories
  router.get(
    '/categories',
    tableOrAdminAuthMiddleware,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId } = req.params;
        const categories = await service.getCategories(storeId);
        res.json({ success: true, data: { categories } });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/stores/:storeId/categories
  router.post(
    '/categories',
    authMiddleware,
    adminOnly,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId } = req.params;
        const { name } = req.body;
        const category = await service.createCategory(storeId, { name });
        res.status(201).json({ success: true, data: { category } });
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/stores/:storeId/categories/:id
  router.put(
    '/categories/:id',
    authMiddleware,
    adminOnly,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId, id } = req.params;
        const { name } = req.body;
        const category = await service.updateCategory(storeId, Number(id), { name });
        res.json({ success: true, data: { category } });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/stores/:storeId/categories/:id
  router.delete(
    '/categories/:id',
    authMiddleware,
    adminOnly,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId, id } = req.params;
        await service.deleteCategory(storeId, Number(id));
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/stores/:storeId/categories/reorder
  router.put(
    '/categories/reorder',
    authMiddleware,
    adminOnly,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId } = req.params;
        const { categoryIds } = req.body;
        await service.reorderCategories(storeId, categoryIds);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================================
  // Menu Endpoints
  // ============================================================

  // GET /api/stores/:storeId/menus
  router.get(
    '/menus',
    tableOrAdminAuthMiddleware,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId } = req.params;
        const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
        const menus = await service.getMenusByStore(storeId, categoryId);
        res.json({ success: true, data: { menus } });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/stores/:storeId/menus/:id
  router.get(
    '/menus/:id',
    tableOrAdminAuthMiddleware,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId, id } = req.params;
        const menu = await service.getMenuById(storeId, Number(id));
        res.json({ success: true, data: { menu } });
      } catch (error) {
        next(error);
      }
    }
  );

  // POST /api/stores/:storeId/menus
  router.post(
    '/menus',
    authMiddleware,
    adminOnly,
    upload.single('image'),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId } = req.params;
        const { name, price, description, categoryId } = req.body;

        if (!req.file) {
          throw new ValidationError('메뉴 이미지는 필수입니다', 'IMAGE_REQUIRED');
        }

        const menu = await service.createMenu(
          storeId,
          { name, price: Number(price), description, categoryId: Number(categoryId) },
          req.file.buffer,
          req.file.mimetype
        );
        res.status(201).json({ success: true, data: { menu } });
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/stores/:storeId/menus/:id
  router.put(
    '/menus/:id',
    authMiddleware,
    adminOnly,
    upload.single('image'),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId, id } = req.params;
        const { name, price, description, categoryId } = req.body;

        const menu = await service.updateMenu(
          storeId,
          Number(id),
          { name, price: Number(price), description, categoryId: Number(categoryId) },
          req.file?.buffer,
          req.file?.mimetype
        );
        res.json({ success: true, data: { menu } });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/stores/:storeId/menus/:id
  router.delete(
    '/menus/:id',
    authMiddleware,
    adminOnly,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId, id } = req.params;
        await service.deleteMenu(storeId, Number(id));
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  // PUT /api/stores/:storeId/menus/reorder
  router.put(
    '/menus/reorder',
    authMiddleware,
    adminOnly,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { storeId } = req.params;
        const { menuIds } = req.body;
        await service.reorderMenus(storeId, menuIds);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
