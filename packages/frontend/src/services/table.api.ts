import { apiClient } from './api-client';
import type { Table, TableCreateRequest, OrderHistory } from '../types';

export const tableApi = {
  async getTables(storeId: string): Promise<Table[]> {
    // Backend returns TableWithSession[], extract and map table data
    const raw = await apiClient.get<Array<{
      table: { id: number; store_id: number; table_number: number; created_at: string };
      activeSession: unknown;
      totalAmount: number;
      orderCount: number;
    }>>(`/stores/${storeId}/tables`);
    return raw.map((item) => ({
      id: item.table.id,
      storeId: String(item.table.store_id),
      tableNumber: item.table.table_number,
      currentSessionId: null,
      isActive: true,
    }));
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
