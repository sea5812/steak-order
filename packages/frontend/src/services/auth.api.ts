import { apiClient } from './api-client';
import type { AdminLoginRequest, AdminLoginResponse, TableLoginRequest, TableLoginResponse } from '../types';

export const authApi = {
  async adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
    const res = await apiClient.post<{ data: AdminLoginResponse }>('/admin/login', {
      storeSlug: data.storeId,
      username: data.username,
      password: data.password,
    });
    return res.data;
  },

  async tableLogin(data: TableLoginRequest): Promise<TableLoginResponse> {
    const res = await apiClient.post<{ data: TableLoginResponse }>('/table/login', {
      storeSlug: data.storeId,
      tableNumber: data.tableNumber,
      password: data.password,
    });
    return res.data;
  },
};
