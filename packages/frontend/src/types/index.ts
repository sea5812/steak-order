// === 인증 ===

export interface AdminLoginRequest {
  storeId: string;
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: number;
    username: string;
    storeId: string;
  };
}

export interface TableLoginRequest {
  storeId: string;
  tableNumber: number;
  password: string;
}

export interface TableLoginResponse {
  token: string;
  table: {
    id: number;
    storeId: string;
    tableNumber: number;
    sessionId: string;
  };
}

// === 메뉴 ===

export interface Category {
  id: number;
  storeId: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  storeId: string;
  categoryId: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface MenuReorderRequest {
  menuOrders: Array<{ menuId: number; sortOrder: number }>;
}

// === 주문 ===

export type OrderStatus = 'pending' | 'preparing' | 'completed';

export interface OrderItem {
  id: number;
  menuId: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  storeId: string;
  tableId: number;
  tableNumber: number;
  sessionId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderCreateRequest {
  tableId: number;
  sessionId: string;
  items: Array<{
    menuId: number;
    quantity: number;
  }>;
}

export interface OrderCreateResponse {
  order: Order;
}

export interface OrderStatusUpdateRequest {
  status: OrderStatus;
}

// === 주문 목록 (장바구니 - 클라이언트 전용) ===

export interface OrderListItem {
  menuId: number;
  menuName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// === 테이블 ===

export interface Table {
  id: number;
  storeId: string;
  tableNumber: number;
  currentSessionId: string | null;
  isActive: boolean;
}

export interface TableCreateRequest {
  tableNumber: number;
  password: string;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  storeId: string;
  tableId: number;
  tableNumber: number;
  sessionId: string;
  totalAmount: number;
  items: OrderItem[];
  orderedAt: string;
  completedAt: string;
}

// === 관리자 ===

export interface AdminAccount {
  id: number;
  username: string;
  storeId: string;
  createdAt: string;
}

export interface AdminCreateRequest {
  username: string;
  password: string;
}

// === SSE ===

export type SSEEventType =
  | 'order:new'
  | 'order:updated'
  | 'order:deleted'
  | 'table:completed'
  | 'order:statusChanged';

// === 공통 ===

export interface ApiError {
  message: string;
  statusCode: number;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
