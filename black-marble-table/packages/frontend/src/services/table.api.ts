import { apiClient } from './api-client';
import type { Table, TableCreateRequest, OrderHistory } from '../types';

export const tableApi = {
  getTables(storeId: string): Promise<Table[]> {
    return apiClient.get<Table[]>(`/stores/${storeId}/tables`);
  },

  createTable(storeId: string, data: TableCreateRequest): Promise<Table> {
    return apiClient.post<Table>(`/stores/${storeId}/tables`, data);
  },

  updateTable(storeId: string, id: number, data: Partial<TableCreateRequest>): Promise<Table> {
    return apiClient.put<Table>(`/stores/${storeId}/tables/${id}`, data);
  },

  completeTable(storeId: string, id: number): Promise<void> {
    return apiClient.post<void>(`/stores/${storeId}/tables/${id}/complete`);
  },

  getTableHistory(storeId: string, id: number, dateFilter?: string): Promise<OrderHistory[]> {
    const query = dateFilter ? `?date=${dateFilter}` : '';
    return apiClient.get<OrderHistory[]>(`/stores/${storeId}/tables/${id}/history${query}`);
  },
};
