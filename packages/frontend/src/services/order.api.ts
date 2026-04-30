import { apiClient } from './api-client';
import type { Order, OrderCreateRequest, OrderCreateResponse, OrderStatusUpdateRequest } from '../types';

export const orderApi = {
  createOrder(storeId: string, data: OrderCreateRequest): Promise<OrderCreateResponse> {
    return apiClient.post<OrderCreateResponse>(`/stores/${storeId}/orders`, data, 'table');
  },

  getOrdersByTable(storeId: string, tableId: number): Promise<Order[]> {
    return apiClient.get<Order[]>(`/stores/${storeId}/tables/${tableId}/orders`, 'table');
  },

  getOrdersByStore(storeId: string): Promise<Order[]> {
    return apiClient.get<Order[]>(`/stores/${storeId}/orders`);
  },

  updateOrderStatus(storeId: string, orderId: number, data: OrderStatusUpdateRequest): Promise<Order> {
    return apiClient.put<Order>(`/stores/${storeId}/orders/${orderId}/status`, data);
  },

  deleteOrder(storeId: string, orderId: number): Promise<void> {
    return apiClient.delete<void>(`/stores/${storeId}/orders/${orderId}`);
  },
};
