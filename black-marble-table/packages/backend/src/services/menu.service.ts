import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { resolve, join } from 'path';
import { MenuRepository } from '../repositories/menu.repository.js';
import { NotFoundError, ConflictError, ValidationError } from '../errors/index.js';
import type { Category, MenuItem } from '../db/schema.js';
import type { CreateCategoryDto, UpdateCategoryDto, CreateMenuDto, UpdateMenuDto } from '../types/index.js';

const UPLOADS_BASE_DIR = resolve(process.cwd(), 'uploads');

export class MenuService {
  private repository: MenuRepository;

  constructor(repository?: MenuRepository) {
    this.repository = repository || new MenuRepository();
  }

  // ============================================================
  // Category Methods
  // ============================================================

  async getCategories(storeId: string): Promise<Category[]> {
    return this.repository.findCategoriesByStore(storeId);
  }

  async createCategory(storeId: string, data: CreateCategoryDto): Promise<Category> {
    this.validateCategoryName(data.name);

    const existing = await this.repository.findCategoryByName(storeId, data.name);
    if (existing) {
      throw new ConflictError('이미 존재하는 카테고리명입니다', 'CATEGORY_NAME_DUPLICATE');
    }

    const maxOrder = await this.repository.getMaxCategoryOrder(storeId);
    const now = new Date().toISOString();

    return this.repository.createCategory({
      storeId,
      name: data.name,
      displayOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateCategory(storeId: string, categoryId: number, data: UpdateCategoryDto): Promise<Category> {
    this.validateCategoryName(data.name);

    const category = await this.repository.findCategoryById(categoryId);
    if (!category || category.storeId !== storeId) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다', 'CATEGORY_NOT_FOUND');
    }

    const existing = await this.repository.findCategoryByName(storeId, data.name);
    if (existing && existing.id !== categoryId) {
      throw new ConflictError('이미 존재하는 카테고리명입니다', 'CATEGORY_NAME_DUPLICATE');
    }

    return this.repository.updateCategory(categoryId, {
      name: data.name,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteCategory(storeId: string, categoryId: number): Promise<void> {
    const category = await this.repository.findCategoryById(categoryId);
    if (!category || category.storeId !== storeId) {
      throw new NotFoundError('카테고리를 찾을 수 없습니다', 'CATEGORY_NOT_FOUND');
    }

    const menuCount = await this.repository.countMenusByCategory(categoryId);
    if (menuCount > 0) {
      throw new ConflictError(
        '해당 카테고리에 메뉴가 존재하여 삭제할 수 없습니다. 메뉴를 먼저 이동하거나 삭제해 주세요.',
        'CATEGORY_HAS_MENUS'
      );
    }

    await this.repository.deleteCategory(categoryId);
  }

  async reorderCategories(storeId: string, categoryIds: number[]): Promise<void> {
    if (!categoryIds || categoryIds.length === 0) {
      throw new ValidationError('순서 변경할 항목이 없습니다');
    }

    const storeCategories = await this.repository.findCategoriesByStore(storeId);
    const storeCategoryIds = new Set(storeCategories.map((c) => c.id));

    for (const id of categoryIds) {
      if (!storeCategoryIds.has(id)) {
        throw new ValidationError('유효하지 않은 카테고리가 포함되어 있습니다');
      }
    }

    const orders = categoryIds.map((id, index) => ({ id, displayOrder: index }));
    await this.repository.updateCategoryOrders(orders);
  }

  // ============================================================
  // MenuItem Methods
  // ============================================================

  async getMenusByStore(storeId: string, categoryId?: number): Promise<MenuItem[]> {
    return this.repository.findMenusByStore(storeId, categoryId);
  }

  async getMenuById(storeId: string, menuId: number): Promise<MenuItem> {
    const menu = await this.repository.findMenuById(menuId);
    if (!menu || menu.storeId !== storeId) {
      throw new NotFoundError('메뉴를 찾을 수 없습니다', 'MENU_NOT_FOUND');
    }
    return menu;
  }

  async createMenu(
    storeId: string,
    data: CreateMenuDto,
    imageBuffer: Buffer,
    mimetype: string
  ): Promise<MenuItem> {
    this.validateMenuData(data);

    const category = await this.repository.findCategoryById(data.categoryId);
    if (!category || category.storeId !== storeId) {
      throw new ValidationError('유효하지 않은 카테고리입니다');
    }

    // 이미지 저장
    const imageUrl = await this.saveImage(storeId, imageBuffer, mimetype);

    try {
      const maxOrder = await this.repository.getMaxMenuOrder(storeId, data.categoryId);
      const now = new Date().toISOString();

      return await this.repository.createMenu({
        storeId,
        categoryId: data.categoryId,
        name: data.name,
        price: data.price,
        description: data.description || null,
        imageUrl,
        displayOrder: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      // DB 저장 실패 시 이미지 파일 롤백
      await this.deleteImageFile(imageUrl);
      throw error;
    }
  }

  async updateMenu(
    storeId: string,
    menuId: number,
    data: UpdateMenuDto,
    imageBuffer?: Buffer,
    mimetype?: string
  ): Promise<MenuItem> {
    this.validateMenuData(data);

    const menu = await this.repository.findMenuById(menuId);
    if (!menu || menu.storeId !== storeId) {
      throw new NotFoundError('메뉴를 찾을 수 없습니다', 'MENU_NOT_FOUND');
    }

    const category = await this.repository.findCategoryById(data.categoryId);
    if (!category || category.storeId !== storeId) {
      throw new ValidationError('유효하지 않은 카테고리입니다');
    }

    let imageUrl = menu.imageUrl;

    if (imageBuffer && mimetype) {
      imageUrl = await this.saveImage(storeId, imageBuffer, mimetype);
      // 기존 이미지 삭제 (soft failure)
      await this.deleteImageFile(menu.imageUrl);
    }

    return this.repository.updateMenu(menuId, {
      categoryId: data.categoryId,
      name: data.name,
      price: data.price,
      description: data.description || null,
      imageUrl,
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteMenu(storeId: string, menuId: number): Promise<void> {
    const menu = await this.repository.findMenuById(menuId);
    if (!menu || menu.storeId !== storeId) {
      throw new NotFoundError('메뉴를 찾을 수 없습니다', 'MENU_NOT_FOUND');
    }

    await this.repository.deleteMenu(menuId);

    // 이미지 파일 삭제 (soft failure)
    await this.deleteImageFile(menu.imageUrl);
  }

  async reorderMenus(storeId: string, menuIds: number[]): Promise<void> {
    if (!menuIds || menuIds.length === 0) {
      throw new ValidationError('순서 변경할 항목이 없습니다');
    }

    const menus = await this.repository.findMenusByIds(menuIds);
    for (const menu of menus) {
      if (menu.storeId !== storeId) {
        throw new ValidationError('유효하지 않은 메뉴가 포함되어 있습니다');
      }
    }

    if (menus.length !== menuIds.length) {
      throw new ValidationError('유효하지 않은 메뉴가 포함되어 있습니다');
    }

    const orders = menuIds.map((id, index) => ({ id, displayOrder: index }));
    await this.repository.updateMenuOrders(orders);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private validateCategoryName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('카테고리명은 필수입니다');
    }
    if (name.length > 50) {
      throw new ValidationError('카테고리명은 50자 이내여야 합니다');
    }
  }

  private validateMenuData(data: CreateMenuDto | UpdateMenuDto): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('메뉴명은 필수입니다');
    }
    if (data.name.length > 100) {
      throw new ValidationError('메뉴명은 100자 이내여야 합니다');
    }
    if (data.price === undefined || data.price === null || data.price < 0) {
      throw new ValidationError('가격은 0 이상이어야 합니다');
    }
    if (data.price > 10_000_000) {
      throw new ValidationError('가격이 허용 범위를 초과합니다');
    }
    if (!Number.isInteger(data.price)) {
      throw new ValidationError('가격은 정수여야 합니다');
    }
    if (data.description && data.description.length > 500) {
      throw new ValidationError('설명은 500자 이내여야 합니다');
    }
    if (!data.categoryId) {
      throw new ValidationError('카테고리는 필수입니다');
    }
  }

  private async saveImage(storeId: string, buffer: Buffer, mimetype: string): Promise<string> {
    const ext = mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const dir = join(UPLOADS_BASE_DIR, storeId, 'menus');

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    return `/uploads/${storeId}/menus/${filename}`;
  }

  private async deleteImageFile(imageUrl: string): Promise<void> {
    try {
      const filePath = join(UPLOADS_BASE_DIR, '..', imageUrl);
      await unlink(resolve(filePath));
    } catch (error) {
      // Soft failure: 파일 삭제 실패 시 로그만 남김
      console.warn(`이미지 파일 삭제 실패: ${imageUrl}`, error);
    }
  }
}
