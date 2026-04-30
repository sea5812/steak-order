import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createMenuRouter } from '../../src/controllers/menu.controller.js';
import { MenuService } from '../../src/services/menu.service.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import { NotFoundError, ConflictError, ValidationError } from '../../src/errors/index.js';

// Helper: 테스트용 인증 토큰 생성
function createToken(payload: object): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function createApp(mockService: any) {
  const app = express();
  app.use(express.json());
  app.use('/api/stores/:storeId', createMenuRouter(mockService as unknown as MenuService));
  app.use(errorHandler);
  return app;
}

describe('MenuController', () => {
  let mockService: any;
  let app: any;
  const adminToken = createToken({ storeId: 'black-marble', role: 'admin', adminId: 1 });
  const tableToken = createToken({ storeId: 'black-marble', role: 'table', tableId: 1 });

  beforeEach(() => {
    mockService = {
      getCategories: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      reorderCategories: vi.fn(),
      getMenusByStore: vi.fn(),
      getMenuById: vi.fn(),
      createMenu: vi.fn(),
      updateMenu: vi.fn(),
      deleteMenu: vi.fn(),
      reorderMenus: vi.fn(),
    };
    app = createApp(mockService);
  });

  // ============================================================
  // Category Endpoints
  // ============================================================

  describe('GET /api/stores/:storeId/categories', () => {
    it('카테고리 목록을 반환한다 (200)', async () => {
      const mockCategories = [{ id: 1, name: 'Appetizers', displayOrder: 0 }];
      mockService.getCategories.mockResolvedValue(mockCategories);

      const res = await request(app)
        .get('/api/stores/black-marble/categories')
        .set('Authorization', `Bearer ${tableToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories).toEqual(mockCategories);
    });

    it('인증 없이 접근하면 401을 반환한다', async () => {
      const res = await request(app)
        .get('/api/stores/black-marble/categories');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/stores/:storeId/categories', () => {
    it('새 카테고리를 생성한다 (201)', async () => {
      const newCategory = { id: 1, name: 'Desserts', displayOrder: 0 };
      mockService.createCategory.mockResolvedValue(newCategory);

      const res = await request(app)
        .post('/api/stores/black-marble/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Desserts' });

      expect(res.status).toBe(201);
      expect(res.body.data.category.name).toBe('Desserts');
    });

    it('Table 역할은 403을 반환한다', async () => {
      const res = await request(app)
        .post('/api/stores/black-marble/categories')
        .set('Authorization', `Bearer ${tableToken}`)
        .send({ name: 'Desserts' });

      expect(res.status).toBe(403);
    });

    it('중복 카테고리명은 409를 반환한다', async () => {
      mockService.createCategory.mockRejectedValue(
        new ConflictError('이미 존재하는 카테고리명입니다', 'CATEGORY_NAME_DUPLICATE')
      );

      const res = await request(app)
        .post('/api/stores/black-marble/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Appetizers' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CATEGORY_NAME_DUPLICATE');
    });
  });

  describe('DELETE /api/stores/:storeId/categories/:id', () => {
    it('카테고리를 삭제한다 (204)', async () => {
      mockService.deleteCategory.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/stores/black-marble/categories/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it('메뉴가 있는 카테고리 삭제 시 409를 반환한다', async () => {
      mockService.deleteCategory.mockRejectedValue(
        new ConflictError('해당 카테고리에 메뉴가 존재하여 삭제할 수 없습니다', 'CATEGORY_HAS_MENUS')
      );

      const res = await request(app)
        .delete('/api/stores/black-marble/categories/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CATEGORY_HAS_MENUS');
    });
  });

  // ============================================================
  // Menu Endpoints
  // ============================================================

  describe('GET /api/stores/:storeId/menus', () => {
    it('메뉴 목록을 반환한다 (200)', async () => {
      const mockMenus = [{ id: 1, name: 'Steak', price: 89000 }];
      mockService.getMenusByStore.mockResolvedValue(mockMenus);

      const res = await request(app)
        .get('/api/stores/black-marble/menus')
        .set('Authorization', `Bearer ${tableToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.menus).toEqual(mockMenus);
    });

    it('categoryId 쿼리 파라미터로 필터링한다', async () => {
      mockService.getMenusByStore.mockResolvedValue([]);

      await request(app)
        .get('/api/stores/black-marble/menus?categoryId=1')
        .set('Authorization', `Bearer ${tableToken}`);

      expect(mockService.getMenusByStore).toHaveBeenCalledWith('black-marble', 1);
    });
  });

  describe('GET /api/stores/:storeId/menus/:id', () => {
    it('메뉴 상세를 반환한다 (200)', async () => {
      const mockMenu = { id: 1, name: 'Steak', price: 89000 };
      mockService.getMenuById.mockResolvedValue(mockMenu);

      const res = await request(app)
        .get('/api/stores/black-marble/menus/1')
        .set('Authorization', `Bearer ${tableToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.menu).toEqual(mockMenu);
    });

    it('존재하지 않는 메뉴는 404를 반환한다', async () => {
      mockService.getMenuById.mockRejectedValue(
        new NotFoundError('메뉴를 찾을 수 없습니다', 'MENU_NOT_FOUND')
      );

      const res = await request(app)
        .get('/api/stores/black-marble/menus/999')
        .set('Authorization', `Bearer ${tableToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MENU_NOT_FOUND');
    });
  });

  describe('POST /api/stores/:storeId/menus', () => {
    it('이미지와 함께 메뉴를 생성한다 (201)', async () => {
      const newMenu = { id: 1, name: 'New Steak', price: 100000, imageUrl: '/uploads/test.jpg' };
      mockService.createMenu.mockResolvedValue(newMenu);

      const res = await request(app)
        .post('/api/stores/black-marble/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'New Steak')
        .field('price', '100000')
        .field('description', 'Delicious')
        .field('categoryId', '1')
        .attach('image', Buffer.from('fake-image-data'), { filename: 'steak.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.data.menu.name).toBe('New Steak');
    });

    it('이미지 없이 메뉴 생성 시 400을 반환한다', async () => {
      const res = await request(app)
        .post('/api/stores/black-marble/menus')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'New Steak')
        .field('price', '100000')
        .field('categoryId', '1');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('IMAGE_REQUIRED');
    });
  });

  describe('DELETE /api/stores/:storeId/menus/:id', () => {
    it('메뉴를 삭제한다 (204)', async () => {
      mockService.deleteMenu.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/stores/black-marble/menus/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });

  describe('PUT /api/stores/:storeId/menus/reorder', () => {
    it('메뉴 순서를 변경한다 (204)', async () => {
      mockService.reorderMenus.mockResolvedValue(undefined);

      const res = await request(app)
        .put('/api/stores/black-marble/menus/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ menuIds: [3, 1, 2] });

      expect(res.status).toBe(204);
    });
  });
});
