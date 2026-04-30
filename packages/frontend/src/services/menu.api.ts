import { apiClient } from './api-client';
import type { Category, MenuItem, MenuReorderRequest } from '../types';

export const menuApi = {
  getCategories(storeId: string): Promise<Category[]> {
    const tokenType = localStorage.getItem('adminToken') ? 'admin' as const : 'table' as const;
    return apiClient.get<Category[]>(`/stores/${storeId}/categories`, tokenType);
  },

  createCategory(storeId: string, data: { name: string }): Promise<Category> {
    return apiClient.post<Category>(`/stores/${storeId}/categories`, data);
  },

  updateCategory(storeId: string, id: number, data: { name: string }): Promise<Category> {
    return apiClient.put<Category>(`/stores/${storeId}/categories/${id}`, data);
  },

  deleteCategory(storeId: string, id: number): Promise<void> {
    return apiClient.delete<void>(`/stores/${storeId}/categories/${id}`);
  },

  getMenus(storeId: string): Promise<MenuItem[]> {
    const tokenType = localStorage.getItem('adminToken') ? 'admin' as const : 'table' as const;
    return apiClient.get<MenuItem[]>(`/stores/${storeId}/menus`, tokenType);
  },

  getMenu(storeId: string, id: number): Promise<MenuItem> {
    const tokenType = localStorage.getItem('adminToken') ? 'admin' as const : 'table' as const;
    return apiClient.get<MenuItem>(`/stores/${storeId}/menus/${id}`, tokenType);
  },

  createMenu(storeId: string, formData: FormData): Promise<MenuItem> {
    return apiClient.upload<MenuItem>(`/stores/${storeId}/menus`, formData);
  },

  updateMenu(storeId: string, id: number, formData: FormData): Promise<MenuItem> {
    return apiClient.uploadPut<MenuItem>(`/stores/${storeId}/menus/${id}`, formData);
  },

  deleteMenu(storeId: string, id: number): Promise<void> {
    return apiClient.delete<void>(`/stores/${storeId}/menus/${id}`);
  },

  reorderMenus(storeId: string, data: MenuReorderRequest): Promise<void> {
    return apiClient.put<void>(`/stores/${storeId}/menus/reorder`, data);
  },
};
