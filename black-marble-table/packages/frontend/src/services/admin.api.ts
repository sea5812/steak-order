import { apiClient } from './api-client';
import type { AdminAccount, AdminCreateRequest } from '../types';

export const adminApi = {
  getAccounts(): Promise<AdminAccount[]> {
    return apiClient.get<AdminAccount[]>('/admin/accounts');
  },

  createAccount(data: AdminCreateRequest): Promise<AdminAccount> {
    return apiClient.post<AdminAccount>('/admin/accounts', data);
  },
};
