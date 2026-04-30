import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MenuRepository } from '../../src/repositories/menu.repository.js';

// Mock drizzle db
vi.mock('../../src/db/index.js', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
  };
  return { db: mockDb };
});

describe('MenuRepository', () => {
  let repository: MenuRepository;

  beforeEach(() => {
    repository = new MenuRepository();
    vi.clearAllMocks();
  });

  describe('findCategoriesByStore', () => {
    it('매장 ID로 카테고리 목록을 조회한다', async () => {
      const { db } = await import('../../src/db/index.js');
      const mockCategories = [
        { id: 1, storeId: 'black-marble', name: 'Appetizers', displayOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        { id: 2, storeId: 'black-marble', name: 'Steaks', displayOrder: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ];
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockCategories),
          }),
        }),
      });

      const result = await repository.findCategoriesByStore('black-marble');
      expect(result).toEqual(mockCategories);
    });
  });

  describe('findCategoryById', () => {
    it('카테고리 ID로 단일 카테고리를 조회한다', async () => {
      const { db } = await import('../../src/db/index.js');
      const mockCategory = { id: 1, storeId: 'black-marble', name: 'Appetizers', displayOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockCategory]),
          }),
        }),
      });

      const result = await repository.findCategoryById(1);
      expect(result).toEqual(mockCategory);
    });

    it('존재하지 않는 카테고리는 undefined를 반환한다', async () => {
      const { db } = await import('../../src/db/index.js');
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findCategoryById(999);
      expect(result).toBeUndefined();
    });
  });

  describe('createCategory', () => {
    it('새 카테고리를 생성하고 반환한다', async () => {
      const { db } = await import('../../src/db/index.js');
      const newCategory = { id: 1, storeId: 'black-marble', name: 'Desserts', displayOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newCategory]),
        }),
      });

      const result = await repository.createCategory({
        storeId: 'black-marble',
        name: 'Desserts',
        displayOrder: 0,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      });
      expect(result).toEqual(newCategory);
    });
  });

  describe('countMenusByCategory', () => {
    it('카테고리에 속한 메뉴 수를 반환한다', async () => {
      const { db } = await import('../../src/db/index.js');
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const result = await repository.countMenusByCategory(1);
      expect(result).toBe(5);
    });
  });

  describe('findMenusByStore', () => {
    it('매장 ID로 전체 메뉴를 조회한다', async () => {
      const { db } = await import('../../src/db/index.js');
      const mockMenus = [
        { id: 1, storeId: 'black-marble', categoryId: 1, name: 'Shrimp Cocktail', price: 38000, description: 'desc', imageUrl: '/uploads/img.png', displayOrder: 0, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ];
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockMenus),
          }),
        }),
      });

      const result = await repository.findMenusByStore('black-marble');
      expect(result).toEqual(mockMenus);
    });
  });

  describe('deleteMenu', () => {
    it('메뉴를 삭제한다', async () => {
      const { db } = await import('../../src/db/index.js');
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await expect(repository.deleteMenu(1)).resolves.toBeUndefined();
    });
  });
});
