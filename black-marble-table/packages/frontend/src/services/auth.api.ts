import { apiClient } from './api-client';
import type { AdminLoginRequest, AdminLoginResponse, TableLoginRequest, TableLoginResponse } from '../types';

export const authApi = {
  adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse> {
    return apiClient.post<AdminLoginResponse>('/admin/login', data);
  },

  tableLogin(data: TableLoginRequest): Promise<TableLoginResponse> {
    return apiClient.post<TableLoginResponse>('/table/login', data);
  },
};
