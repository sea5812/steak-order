import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuService } from '../../src/services/menu.service.js';
import { MenuRepository } from '../../src/repositories/menu.repository.js';
import { NotFoundError, ConflictError, ValidationError } from '../../src/errors/index.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

describe('MenuService', () => {
  let service: MenuService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findCategoriesByStore: vi.fn(),
      findCategoryById: vi.fn(),
      findCategoryByName: vi.fn(),
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      getMaxCategoryOrder: vi.fn(),
      updateCategoryOrders: vi.fn(),
      findMenusByStore: vi.fn(),
      findMenuById: vi.fn(),
      findMenusByIds: vi.fn(),
      createMenu: vi.fn(),
      updateMenu: vi.fn(),
      deleteMenu: vi.fn(),
      countMenusByCategory: vi.fn(),
      getMaxMenuOrder: vi.fn(),
      updateMenuOrders: vi.fn(),
    };
    service = new MenuService(mockRepository as unknown as MenuRepository);
  });

  // ============================================================
  // Category Tests
  // ============================================================

  describe('getCategories', () => {
    it('매장의 카테고리 목록을 반환한다', async () => {
      const mockCategories = [
        { id: 1, storeId: 'black-marble', name: 'Appetizers', displayOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ];
      mockRepository.findCategoriesByStore.mockResolvedValue(mockCategories);

      const result = await service.getCategories('black-marble');
      expect(result).toEqual(mockCategories);
      expect(mockRepository.findCategoriesByStore).toHaveBeenCalledWith('black-marble');
    });
  });

  describe('createCategory', () => {
    it('새 카테고리를 생성한다', async () => {
      mockRepository.findCategoryByName.mockResolvedValue(undefined);
      mockRepository.getMaxCategoryOrder.mockResolvedValue(2);
      mockRepository.createCategory.mockResolvedValue({
        id: 3, storeId: 'black-marble', name: 'Desserts', displayOrder: 3, createdAt: '2026-01-01', updatedAt: '2026-01-01',
      });

      const result = await service.createCategory('black-marble', { name: 'Desserts' });
      expect(result.name).toBe('Desserts');
      expect(result.displayOrder).toBe(3);
    });

    it('빈 카테고리명은 ValidationError를 발생시킨다', async () => {
      await expect(service.createCategory('black-marble', { name: '' }))
        .rejects.toThrow(ValidationError);
    });

    it('50자 초과 카테고리명은 ValidationError를 발생시킨다', async () => {
      const longName = 'a'.repeat(51);
      await expect(service.createCategory('black-marble', { name: longName }))
        .rejects.toThrow(ValidationError);
    });

    it('중복 카테고리명은 ConflictError를 발생시킨다', async () => {
      mockRepository.findCategoryByName.mockResolvedValue({ id: 1, name: 'Appetizers' });

      await expect(service.createCategory('black-marble', { name: 'Appetizers' }))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('updateCategory', () => {
    it('카테고리명을 수정한다', async () => {
      mockRepository.findCategoryById.mockResolvedValue({ id: 1, storeId: 'black-marble', name: 'Old Name' });
      mockRepository.findCategoryByName.mockResolvedValue(undefined);
      mockRepository.updateCategory.mockResolvedValue({ id: 1, storeId: 'black-marble', name: 'New Name' });

      const result = await service.updateCategory('black-marble', 1, { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('존재하지 않는 카테고리는 NotFoundError를 발생시킨다', async () => {
      mockRepository.findCategoryById.mockResolvedValue(undefined);

      await expect(service.updateCategory('black-marble', 999, { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });

    it('다른 매장의 카테고리는 NotFoundError를 발생시킨다', async () => {
      mockRepository.findCategoryById.mockResolvedValue({ id: 1, storeId: 'other-store', name: 'Test' });

      await expect(service.updateCategory('black-marble', 1, { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteCategory', () => {
    it('메뉴가 없는 카테고리를 삭제한다', async () => {
      mockRepository.findCategoryById.mockResolvedValue({ id: 1, storeId: 'black-marble', name: 'Empty' });
      mockRepository.countMenusByCategory.mockResolvedValue(0);
      mockRepository.deleteCategory.mockResolvedValue(undefined);

      await expect(service.deleteCategory('black-marble', 1)).resolves.toBeUndefined();
    });

    it('메뉴가 있는 카테고리는 ConflictError를 발생시킨다', async () => {
      mockRepository.findCategoryById.mockResolvedValue({ id: 1, storeId: 'black-marble', name: 'HasMenus' });
      mockRepository.countMenusByCategory.mockResolvedValue(3);

      await expect(service.deleteCategory('black-marble', 1))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('reorderCategories', () => {
    it('카테고리 순서를 변경한다', async () => {
      mockRepository.findCategoriesByStore.mockResolvedValue([
        { id: 1, storeId: 'black-marble' },
        { id: 2, storeId: 'black-marble' },
        { id: 3, storeId: 'black-marble' },
      ]);
      mockRepository.updateCategoryOrders.mockResolvedValue(undefined);

      await expect(service.reorderCategories('black-marble', [3, 1, 2])).resolves.toBeUndefined();
      expect(mockRepository.updateCategoryOrders).toHaveBeenCalledWith([
        { id: 3, displayOrder: 0 },
        { id: 1, displayOrder: 1 },
        { id: 2, displayOrder: 2 },
      ]);
    });

    it('빈 배열은 ValidationError를 발생시킨다', async () => {
      await expect(service.reorderCategories('black-marble', []))
        .rejects.toThrow(ValidationError);
    });

    it('다른 매장의 카테고리 ID가 포함되면 ValidationError를 발생시킨다', async () => {
      mockRepository.findCategoriesByStore.mockResolvedValue([
        { id: 1, storeId: 'black-marble' },
      ]);

      await expect(service.reorderCategories('black-marble', [1, 999]))
        .rejects.toThrow(ValidationError);
    });
  });

  // ============================================================
  // MenuItem Tests
  // ============================================================

  describe('getMenusByStore', () => {
    it('매장의 전체 메뉴를 반환한다', async () => {
      const mockMenus = [{ id: 1, name: 'Steak', price: 89000 }];
      mockRepository.findMenusByStore.mockResolvedValue(mockMenus);

      const result = await service.getMenusByStore('black-marble');
      expect(result).toEqual(mockMenus);
    });

    it('카테고리 ID로 필터링한다', async () => {
      mockRepository.findMenusByStore.mockResolvedValue([]);

      await service.getMenusByStore('black-marble', 1);
      expect(mockRepository.findMenusByStore).toHaveBeenCalledWith('black-marble', 1);
    });
  });

  describe('getMenuById', () => {
    it('메뉴 상세를 반환한다', async () => {
      const mockMenu = { id: 1, storeId: 'black-marble', name: 'Steak', price: 89000 };
      mockRepository.findMenuById.mockResolvedValue(mockMenu);

      const result = await service.getMenuById('black-marble', 1);
      expect(result).toEqual(mockMenu);
    });

    it('존재하지 않는 메뉴는 NotFoundError를 발생시킨다', async () => {
      mockRepository.findMenuById.mockResolvedValue(undefined);

      await expect(service.getMenuById('black-marble', 999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('createMenu', () => {
    it('새 메뉴를 생성한다', async () => {
      mockRepository.findCategoryById.mockResolvedValue({ id: 1, storeId: 'black-marble' });
      mockRepository.getMaxMenuOrder.mockResolvedValue(2);
      mockRepository.createMenu.mockResolvedValue({
        id: 1, storeId: 'black-marble', categoryId: 1, name: 'New Steak', price: 100000,
        description: 'Delicious', imageUrl: '/uploads/black-marble/menus/test.jpg', displayOrder: 3,
      });

      const result = await service.createMenu(
        'black-marble',
        { name: 'New Steak', price: 100000, description: 'Delicious', categoryId: 1 },
        Buffer.from('fake-image'),
        'image/jpeg'
      );
      expect(result.name).toBe('New Steak');
    });

    it('유효하지 않은 카테고리는 ValidationError를 발생시킨다', async () => {
      mockRepository.findCategoryById.mockResolvedValue(undefined);

      await expect(service.createMenu(
        'black-marble',
        { name: 'Test', price: 10000, categoryId: 999 },
        Buffer.from('fake'),
        'image/jpeg'
      )).rejects.toThrow(ValidationError);
    });

    it('음수 가격은 ValidationError를 발생시킨다', async () => {
      await expect(service.createMenu(
        'black-marble',
        { name: 'Test', price: -1000, categoryId: 1 },
        Buffer.from('fake'),
        'image/jpeg'
      )).rejects.toThrow(ValidationError);
    });

    it('빈 메뉴명은 ValidationError를 발생시킨다', async () => {
      await expect(service.createMenu(
        'black-marble',
        { name: '', price: 10000, categoryId: 1 },
        Buffer.from('fake'),
        'image/jpeg'
      )).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteMenu', () => {
    it('메뉴를 삭제하고 이미지 파일도 삭제한다', async () => {
      mockRepository.findMenuById.mockResolvedValue({
        id: 1, storeId: 'black-marble', imageUrl: '/uploads/black-marble/menus/test.jpg',
      });
      mockRepository.deleteMenu.mockResolvedValue(undefined);

      await expect(service.deleteMenu('black-marble', 1)).resolves.toBeUndefined();
      expect(mockRepository.deleteMenu).toHaveBeenCalledWith(1);
    });

    it('존재하지 않는 메뉴는 NotFoundError를 발생시킨다', async () => {
      mockRepository.findMenuById.mockResolvedValue(undefined);

      await expect(service.deleteMenu('black-marble', 999))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('reorderMenus', () => {
    it('메뉴 순서를 변경한다', async () => {
      mockRepository.findMenusByIds.mockResolvedValue([
        { id: 1, storeId: 'black-marble' },
        { id: 2, storeId: 'black-marble' },
      ]);
      mockRepository.updateMenuOrders.mockResolvedValue(undefined);

      await expect(service.reorderMenus('black-marble', [2, 1])).resolves.toBeUndefined();
      expect(mockRepository.updateMenuOrders).toHaveBeenCalledWith([
        { id: 2, displayOrder: 0 },
        { id: 1, displayOrder: 1 },
      ]);
    });

    it('빈 배열은 ValidationError를 발생시킨다', async () => {
      await expect(service.reorderMenus('black-marble', []))
        .rejects.toThrow(ValidationError);
    });
  });
});
