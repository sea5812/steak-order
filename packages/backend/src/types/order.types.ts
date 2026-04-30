// Unit 3: Order Domain - Type Definitions

// ============================================================
// Order Status
// ============================================================

export type OrderStatus = 'pending' | 'preparing' | 'completed';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'preparing', 'completed'];

// ============================================================
// Input Types
// ============================================================

export interface CreateOrderItemInput {
  menu_item_id: number;
  quantity: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface CreateTableInput {
  table_number: number;
  password: string;
}

export interface UpdateTableInput {
  table_number?: number;
  password?: string;
}

// ============================================================
// Entity Types (mirrors Drizzle schema from Unit 1)
// ============================================================

export interface Order {
  order_id: number;
  order_number: string;
  store_id: number;
  table_id: number;
  session_id: number;
  total_amount: number;
  status: OrderStatus;
  ordered_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface TableSession {
  session_id: number;
  table_id: number;
  store_id: number;
  status: 'active' | 'completed';
  started_at: string;
  ended_at: string | null;
}

export interface TableInfo {
  table_id: number;
  store_id: number;
  table_number: number;
  password_hash: string;
}

export interface OrderHistory {
  history_id: number;
  original_order_id: number;
  order_number: string;
  store_id: number;
  table_id: number;
  session_id: number;
  total_amount: number;
  status: string;
  ordered_at: string;
  completed_at: string;
  items_json: string;
}

export interface MenuItem {
  menu_item_id: number;
  store_id: number;
  category_id: number;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

// ============================================================
// Composite / Response Types
// ============================================================

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

export interface CompleteResult {
  message: string;
  historyCount: number;
}

export interface TableWithSession {
  table: TableInfo;
  activeSession: TableSession | null;
  totalAmount: number;
  orderCount: number;
}

export interface ParsedOrderItem {
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderHistoryItem {
  history: OrderHistory;
  items: ParsedOrderItem[];
}

// ============================================================
// New Record Types (for INSERT)
// ============================================================

export interface NewOrder {
  order_number: string;
  store_id: number;
  table_id: number;
  session_id: number;
  total_amount: number;
  status: OrderStatus;
  ordered_at: string;
  updated_at: string;
}

export interface NewOrderItem {
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface NewTableSession {
  table_id: number;
  store_id: number;
  status: 'active';
  started_at: string;
}

export interface NewTableInfo {
  store_id: number;
  table_number: number;
  password_hash: string;
}

export interface NewOrderHistory {
  original_order_id: number;
  order_number: string;
  store_id: number;
  table_id: number;
  session_id: number;
  total_amount: number;
  status: string;
  ordered_at: string;
  completed_at: string;
  items_json: string;
}
