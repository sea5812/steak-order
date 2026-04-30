// Unit 3: Order Domain - Type Definitions
// Aligned with Unit 1 schema (packages/backend/src/db/schema.ts)

export type OrderStatus = 'pending' | 'preparing' | 'completed';
export const ORDER_STATUSES: OrderStatus[] = ['pending', 'preparing', 'completed'];

// === Input Types ===

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

// === Entity Types (matches actual DB columns) ===

export interface Order {
  id: number;
  store_id: number;
  table_id: number;
  session_id: number;
  total_amount: number;
  status: OrderStatus;
  ordered_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
}

export interface TableSession {
  id: number;
  table_id: number;
  store_id: number;
  started_at: string;
  ended_at: string | null;
}

export interface TableInfo {
  id: number;
  store_id: number;
  table_number: number;
  password_hash: string;
  created_at: string;
}

export interface OrderHistory {
  id: number;
  store_id: number;
  table_id: number;
  session_id: number;
  order_data: string; // JSON string
  completed_at: string;
}

export interface MenuItem {
  id: number;
  store_id: number;
  category_id: number;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  display_order: number;
}

// === Composite Types ===

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

// === New Record Types (for INSERT) ===

export interface NewOrder {
  store_id: number;
  table_id: number;
  session_id: number;
  total_amount: number;
  status: OrderStatus;
  ordered_at: string;
}

export interface NewOrderItem {
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
}

export interface NewTableSession {
  table_id: number;
  store_id: number;
  started_at: string;
}

export interface NewTableInfo {
  store_id: number;
  table_number: number;
  password_hash: string;
}

export interface NewOrderHistory {
  store_id: number;
  table_id: number;
  session_id: number;
  order_data: string; // JSON
  completed_at: string;
}
