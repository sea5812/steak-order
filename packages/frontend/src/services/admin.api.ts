import { apiClient } from './api-client';
import type { AdminAccount, AdminCreateRequest } from '../types';

export const adminApi = {
  async getAccounts(storeId: string): Promise<AdminAccount[]> {
    const res = await apiClient.get<{ data: AdminAccount[] }>(`/stores/${storeId}/admins`);
    return res.data;
  },

  async createAccount(storeId: string, data: AdminCreateRequest): Promise<AdminAccount> {
    const res = await apiClient.post<{ data: AdminAccount }>(`/stores/${storeId}/admins`, data);
    return res.data;
  },
};
