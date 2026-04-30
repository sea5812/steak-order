import { apiClient } from './api-client';
import type { Order, OrderCreateRequest, OrderCreateResponse, OrderStatusUpdateRequest } from '../types';

export const orderApi = {
  async createOrder(storeId: string, data: OrderCreateRequest): Promise<OrderCreateResponse> {
    const backendData = {
      items: data.items.map((i) => ({ menu_item_id: i.menuId, quantity: i.quantity })),
    };
    const raw = await apiClient.post<{
      order: { id: number; store_id: number; table_id: number; session_id: number; total_amount: number; status: string; ordered_at: string };
      items: Array<{ id: number; order_id: number; menu_item_id: number; menu_name: string; quantity: number; unit_price: number }>;
    }>(`/stores/${storeId}/orders`, backendData, 'table');
    return {
      order: {
        id: raw.order.id,
        storeId: String(raw.order.store_id),
        tableId: raw.order.table_id,
        tableNumber: 0,
        sessionId: String(raw.order.session_id),
        status: raw.order.status as Order['status'],
        totalAmount: raw.order.total_amount,
        items: raw.items.map((i) => ({
          id: i.id,
          menuId: i.menu_item_id,
          menuName: i.menu_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          subtotal: i.unit_price * i.quantity,
        })),
        createdAt: raw.order.ordered_at,
      },
    };
  },

  async getOrdersByTable(storeId: string, tableId: number): Promise<Order[]> {
    const raw = await apiClient.get<Array<{
      order: { id: number; store_id: number; table_id: number; session_id: number; total_amount: number; status: string; ordered_at: string };
      items: Array<{ id: number; order_id: number; menu_item_id: number; menu_name: string; quantity: number; unit_price: number }>;
    }>>(`/stores/${storeId}/tables/${tableId}/orders`, 'table');
    return raw.map((r) => ({
      id: r.order.id,
      storeId: String(r.order.store_id),
      tableId: r.order.table_id,
      tableNumber: 0,
      sessionId: String(r.order.session_id),
      status: r.order.status as Order['status'],
      totalAmount: r.order.total_amount,
      items: r.items.map((i) => ({
        id: i.id,
        menuId: i.menu_item_id,
        menuName: i.menu_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.unit_price * i.quantity,
      })),
      createdAt: r.order.ordered_at,
    }));
  },

  async getOrdersByStore(storeId: string): Promise<Order[]> {
    const raw = await apiClient.get<Array<{
      order: { id: number; store_id: number; table_id: number; session_id: number; total_amount: number; status: string; ordered_at: string };
      items: Array<{ id: number; order_id: number; menu_item_id: number; menu_name: string; quantity: number; unit_price: number }>;
    }>>(`/stores/${storeId}/orders`);
    return raw.map((r) => ({
      id: r.order.id,
      storeId: String(r.order.store_id),
      tableId: r.order.table_id,
      tableNumber: 0,
      sessionId: String(r.order.session_id),
      status: r.order.status as Order['status'],
      totalAmount: r.order.total_amount,
      items: r.items.map((i) => ({
        id: i.id,
        menuId: i.menu_item_id,
        menuName: i.menu_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.unit_price * i.quantity,
      })),
      createdAt: r.order.ordered_at,
    }));
  },

  async updateOrderStatus(storeId: string, orderId: number, data: OrderStatusUpdateRequest): Promise<Order> {
    const raw = await apiClient.put<{
      order: { id: number; store_id: number; table_id: number; session_id: number; total_amount: number; status: string; ordered_at: string };
      items: Array<{ id: number; order_id: number; menu_item_id: number; menu_name: string; quantity: number; unit_price: number }>;
    }>(`/stores/${storeId}/orders/${orderId}/status`, data);
    return {
      id: raw.order.id,
      storeId: String(raw.order.store_id),
      tableId: raw.order.table_id,
      tableNumber: 0,
      sessionId: String(raw.order.session_id),
      status: raw.order.status as Order['status'],
      totalAmount: raw.order.total_amount,
      items: raw.items.map((i) => ({
        id: i.id,
        menuId: i.menu_item_id,
        menuName: i.menu_name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.unit_price * i.quantity,
      })),
      createdAt: raw.order.ordered_at,
    };
  },

  deleteOrder(storeId: string, orderId: number): Promise<void> {
    return apiClient.delete<void>(`/stores/${storeId}/orders/${orderId}`);
  },
};
