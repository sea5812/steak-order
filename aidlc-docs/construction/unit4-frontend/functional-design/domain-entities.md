# Domain Entities - Unit 4: Frontend

## 프론트엔드 타입 정의

> 프론트엔드에서 사용하는 데이터 모델입니다. 백엔드 API 응답을 기반으로 정의됩니다.

---

## 1. 인증 관련

```typescript
// 관리자 로그인 요청
interface AdminLoginRequest {
  storeId: string;
  username: string;
  password: string;
}

// 관리자 로그인 응답
interface AdminLoginResponse {
  token: string;
  admin: {
    id: number;
    username: string;
    storeId: string;
  };
}

// 테이블 로그인 요청
interface TableLoginRequest {
  storeId: string;
  tableNumber: number;
  password: string;
}

// 테이블 로그인 응답
interface TableLoginResponse {
  token: string;
  table: {
    id: number;
    storeId: string;
    tableNumber: number;
    sessionId: string;
  };
}

// 인증 컨텍스트 상태
interface AuthState {
  token: string | null;
  storeId: string | null;
  adminId: number | null;
  username: string | null;
  isAuthenticated: boolean;
}

// 테이블 인증 상태
interface TableAuthState {
  token: string | null;
  storeId: string | null;
  tableId: number | null;
  tableNumber: number | null;
  sessionId: string | null;
  isAuthenticated: boolean;
}
```

---

## 2. 메뉴 관련

```typescript
// 카테고리
interface Category {
  id: number;
  storeId: string;
  name: string;
  sortOrder: number;
}

// 메뉴 항목
interface MenuItem {
  id: number;
  storeId: string;
  categoryId: number;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

// 메뉴 등록/수정 요청
interface MenuCreateRequest {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
  image?: File;        // 이미지 파일 (multipart)
}

interface MenuUpdateRequest {
  name?: string;
  price?: number;
  description?: string;
  categoryId?: number;
  image?: File;
}

// 메뉴 순서 변경 요청
interface MenuReorderRequest {
  menuOrders: Array<{ menuId: number; sortOrder: number }>;
}
```

---

## 3. 주문 관련

```typescript
// 주문 상태
type OrderStatus = 'pending' | 'preparing' | 'completed';

// 주문 항목
interface OrderItem {
  id: number;
  menuId: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// 주문
interface Order {
  id: number;
  storeId: string;
  tableId: number;
  tableNumber: number;
  sessionId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;     // ISO 8601
}

// 주문 생성 요청
interface OrderCreateRequest {
  tableId: number;
  sessionId: string;
  items: Array<{
    menuId: number;
    quantity: number;
  }>;
}

// 주문 생성 응답
interface OrderCreateResponse {
  order: Order;
}

// 주문 상태 변경 요청
interface OrderStatusUpdateRequest {
  status: OrderStatus;
}

// 주문 목록 (장바구니) - 클라이언트 전용
interface OrderListItem {
  menuId: number;
  menuName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
```

---

## 4. 테이블 관련

```typescript
// 테이블
interface Table {
  id: number;
  storeId: string;
  tableNumber: number;
  currentSessionId: string | null;
  isActive: boolean;
}

// 테이블 생성 요청
interface TableCreateRequest {
  tableNumber: number;
  password: string;
}

// 테이블 + 주문 요약 (대시보드용)
interface TableWithOrders {
  table: Table;
  orders: Order[];
  totalAmount: number;
}

// 과거 주문 내역
interface OrderHistory {
  id: number;
  orderId: number;
  storeId: string;
  tableId: number;
  tableNumber: number;
  sessionId: string;
  totalAmount: number;
  items: OrderItem[];
  orderedAt: string;       // ISO 8601
  completedAt: string;     // ISO 8601 (이용 완료 시각)
}
```

---

## 5. 관리자 관련

```typescript
// 관리자 계정
interface AdminAccount {
  id: number;
  username: string;
  storeId: string;
  createdAt: string;
}

// 관리자 계정 생성 요청
interface AdminCreateRequest {
  username: string;
  password: string;
}
```

---

## 6. SSE 이벤트

```typescript
// SSE 이벤트 타입
type SSEEventType =
  | 'order:new'
  | 'order:updated'
  | 'order:deleted'
  | 'table:completed'
  | 'order:statusChanged';

// SSE 이벤트 데이터
interface SSEEvent {
  type: SSEEventType;
  data: Order | { orderId: number } | { tableId: number };
}
```

---

## 7. 공통

```typescript
// API 에러 응답
interface ApiError {
  message: string;
  statusCode: number;
}

// 페이지네이션
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Toast 타입
type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;    // ms, 기본 3000
}
```
