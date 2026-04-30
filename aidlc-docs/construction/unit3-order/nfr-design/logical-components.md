# Logical Components - Unit 3: Order Domain

## 개요
Unit 3의 논리적 컴포넌트 상세 설계. NFR Design Patterns에서 정의한 패턴을 적용한 구체적인 컴포넌트 구조.

---

## 1. SSEManager 컴포넌트

### 책임
- SSE 클라이언트 연결 풀 관리 (관리자/테이블)
- 이벤트 브로드캐스트
- Heartbeat 전송 및 비활성 연결 정리

### 인터페이스

```typescript
class SSEManager {
  // 연결 풀
  private adminClients: Map<number, Set<Response>>;     // storeId → Set<Response>
  private tableClients: Map<string, Response>;           // "storeId:tableId" → Response
  private heartbeatInterval: NodeJS.Timeout | null;

  // 클라이언트 관리
  addAdminClient(storeId: number, res: Response): void;
  removeAdminClient(storeId: number, res: Response): void;
  addTableClient(storeId: number, tableId: number, res: Response): void;
  removeTableClient(storeId: number, tableId: number): void;

  // 이벤트 브로드캐스트
  broadcastToAdmin(storeId: number, event: string, data: unknown): void;
  broadcastToTable(storeId: number, tableId: number, event: string, data: unknown): void;

  // Heartbeat
  startHeartbeat(): void;
  stopHeartbeat(): void;

  // 통계 (디버깅용)
  getConnectionCount(): { admin: number; table: number };
}
```

### 동작 상세

**addAdminClient**:
1. storeId 키로 Set 조회 (없으면 새 Set 생성)
2. Response 객체를 Set에 추가
3. `req.on('close')` 이벤트에 removeAdminClient 등록

**addTableClient**:
1. `"storeId:tableId"` 키로 기존 연결 확인
2. 기존 연결이 있으면 교체 (이전 연결은 end() 호출)
3. 새 Response 객체 저장
4. `req.on('close')` 이벤트에 removeTableClient 등록

**broadcastToAdmin**:
1. storeId로 admin 클라이언트 Set 조회
2. 각 클라이언트에 sendSSEEvent 호출
3. 전송 실패 시 해당 클라이언트 Set에서 제거

**heartbeat** (전역 단일 타이머):
1. 30초 간격 setInterval
2. 모든 admin + table 클라이언트에 `:heartbeat\n\n` 전송
3. 전송 실패 시 즉시 해당 클라이언트 제거

---

## 2. SSEService 컴포넌트

### 책임
- SSEManager를 래핑하여 비즈니스 이벤트 전송 인터페이스 제공
- 이벤트 타입별 페이로드 구성

### 인터페이스

```typescript
class SSEService {
  constructor(private sseManager: SSEManager) {}

  // 관리자 이벤트
  notifyNewOrder(storeId: number, order: OrderWithItems): void;
  notifyOrderUpdated(storeId: number, order: OrderWithItems): void;
  notifyOrderDeleted(storeId: number, orderId: number, tableId: number): void;
  notifyTableCompleted(storeId: number, tableId: number, sessionId: number): void;

  // 테이블 이벤트
  notifyTableOrderStatusChanged(storeId: number, tableId: number, order: OrderWithItems): void;
  notifyTableOrderDeleted(storeId: number, tableId: number, orderId: number): void;

  // SSE 연결 관리 (Controller에서 호출)
  addAdminClient(storeId: number, res: Response): void;
  removeAdminClient(storeId: number, res: Response): void;
  addTableClient(storeId: number, tableId: number, res: Response): void;
  removeTableClient(storeId: number, tableId: number): void;

  // Lifecycle
  startHeartbeat(): void;
  stopHeartbeat(): void;
}
```

### 이벤트 매핑

| 메서드 | SSE 이벤트 | 대상 | 페이로드 |
|---|---|---|---|
| notifyNewOrder | `order:new` | Admin | `{ order, items }` |
| notifyOrderUpdated | `order:updated` | Admin | `{ order, items }` |
| notifyOrderDeleted | `order:deleted` | Admin | `{ orderId, tableId }` |
| notifyTableCompleted | `table:completed` | Admin | `{ tableId, sessionId }` |
| notifyTableOrderStatusChanged | `order:statusChanged` | Table | `{ order, items }` |
| notifyTableOrderDeleted | `order:deleted` | Table | `{ orderId }` |

---

## 3. OrderService 컴포넌트

### 책임
- 주문 생성/조회/상태변경/삭제 비즈니스 로직
- 트랜잭션 관리 (withRetry 적용)
- SSE 이벤트 트리거

### 인터페이스

```typescript
class OrderService {
  constructor(
    private db: BetterSQLite3Database,
    private orderRepository: OrderRepository,
    private menuRepository: MenuRepository,
    private tableService: TableService,
    private sseService: SSEService
  ) {}

  createOrder(storeId: number, tableId: number, sessionId: number, items: CreateOrderItemInput[]): OrderWithItems;
  getOrdersByTable(storeId: number, tableId: number, sessionId: number): OrderWithItems[];
  getOrdersByStore(storeId: number, date?: string): OrderWithItems[];
  updateOrderStatus(storeId: number, orderId: number, status: OrderStatus): OrderWithItems;
  deleteOrder(storeId: number, orderId: number): void;
}
```

### 트랜잭션 경계

| 메서드 | 트랜잭션 | 재시도 | 작업 |
|---|---|---|---|
| createOrder | ✅ | ✅ 2회 | Order INSERT + OrderItem INSERT (bulk) |
| updateOrderStatus | ✅ | ✅ 2회 | Order UPDATE |
| deleteOrder | ✅ | ✅ 2회 | OrderItem DELETE + Order DELETE |
| getOrdersByTable | ❌ | ❌ | SELECT (읽기 전용) |
| getOrdersByStore | ❌ | ❌ | SELECT (읽기 전용) |

---

## 4. TableService 컴포넌트

### 책임
- 테이블 CRUD
- 세션 관리 (시작/조회)
- 이용 완료 처리 (OrderHistory 이동)

### 인터페이스

```typescript
class TableService {
  constructor(
    private db: BetterSQLite3Database,
    private tableRepository: TableRepository,
    private orderRepository: OrderRepository,
    private sseService: SSEService
  ) {}

  createTable(storeId: number, tableNumber: number, password: string): TableInfo;
  updateTable(storeId: number, tableId: number, data: UpdateTableInput): TableInfo;
  getTablesByStore(storeId: number): TableWithSession[];
  getOrCreateSession(storeId: number, tableId: number): TableSession;
  completeTable(storeId: number, tableId: number): CompleteResult;
  getTableHistory(storeId: number, tableId: number, startDate?: string, endDate?: string): OrderHistoryItem[];
}
```

### 트랜잭션 경계

| 메서드 | 트랜잭션 | 재시도 | 작업 |
|---|---|---|---|
| completeTable | ✅ | ✅ 2회 | OrderHistory INSERT + OrderItem DELETE + Order DELETE + Session UPDATE |
| createTable | ✅ | ✅ 2회 | TableInfo INSERT |
| updateTable | ✅ | ✅ 2회 | TableInfo UPDATE |
| getOrCreateSession | ✅ | ✅ 2회 | Session SELECT + 조건부 INSERT |
| getTablesByStore | ❌ | ❌ | SELECT (읽기 전용) |
| getTableHistory | ❌ | ❌ | SELECT (읽기 전용) |

---

## 5. OrderRepository 컴포넌트

### 책임
- Order/OrderItem 테이블 CRUD 쿼리
- OrderHistory 테이블 쿼리

### 인터페이스

```typescript
class OrderRepository {
  constructor(private db: BetterSQLite3Database) {}

  // Order CRUD
  create(data: NewOrder): Order;
  findById(orderId: number, storeId: number): Order | undefined;
  findBySession(storeId: number, sessionId: number): OrderWithItems[];
  findByStoreAndDate(storeId: number, date: string): OrderWithItems[];
  updateStatus(orderId: number, status: OrderStatus, updatedAt: string): Order;
  deleteById(orderId: number): void;

  // OrderItem
  createItems(items: NewOrderItem[]): OrderItem[];
  deleteItemsByOrderId(orderId: number): void;
  findItemsByOrderId(orderId: number): OrderItem[];

  // OrderHistory
  createHistory(data: NewOrderHistory): OrderHistory;
  findHistoryByTable(storeId: number, tableId: number, startDate: string, endDate: string): OrderHistory[];

  // 주문번호 생성
  getLastOrderNumberForDate(storeId: number, datePrefix: string): string | undefined;
}
```

---

## 6. TableRepository 컴포넌트

### 책임
- TableInfo/TableSession 테이블 CRUD 쿼리

### 인터페이스

```typescript
class TableRepository {
  constructor(private db: BetterSQLite3Database) {}

  // TableInfo
  create(data: NewTableInfo): TableInfo;
  findById(tableId: number, storeId: number): TableInfo | undefined;
  findByStoreId(storeId: number): TableInfo[];
  findByTableNumber(storeId: number, tableNumber: number): TableInfo | undefined;
  update(tableId: number, data: Partial<TableInfo>): TableInfo;

  // TableSession
  findActiveSession(tableId: number): TableSession | undefined;
  createSession(data: NewTableSession): TableSession;
  completeSession(sessionId: number, endedAt: string): void;
}
```

---

## 7. Controller 컴포넌트

### OrderController

```typescript
class OrderController {
  constructor(private orderService: OrderService) {}

  create(req: Request, res: Response, next: NextFunction): void;
  getByTable(req: Request, res: Response, next: NextFunction): void;
  getByStore(req: Request, res: Response, next: NextFunction): void;
  updateStatus(req: Request, res: Response, next: NextFunction): void;
  delete(req: Request, res: Response, next: NextFunction): void;
}
```

### TableController

```typescript
class TableController {
  constructor(private tableService: TableService) {}

  create(req: Request, res: Response, next: NextFunction): void;
  update(req: Request, res: Response, next: NextFunction): void;
  getByStore(req: Request, res: Response, next: NextFunction): void;
  complete(req: Request, res: Response, next: NextFunction): void;
  getHistory(req: Request, res: Response, next: NextFunction): void;
}
```

### SSEController

```typescript
class SSEController {
  constructor(private sseService: SSEService) {}

  adminStream(req: Request, res: Response): void;
  tableStream(req: Request, res: Response): void;
}
```

---

## 8. 유틸리티 컴포넌트

### retry.ts
- `withRetry<T>(fn, maxRetries, delayMs): T` — 트랜잭션 재시도
- `isSQLiteBusyError(error): boolean` — BUSY 에러 판별

### validators.ts
- `validatePositiveInteger(value, fieldName): number`
- `validateEnum(value, allowed, fieldName): T`
- `validateDateString(value, fieldName): string`

### order-number.ts
- `generateOrderNumber(storeId, db): string` — YYYYMMDD-NNN 형식 주문번호 생성

---

## 9. 타입 정의

```typescript
// src/types/order.types.ts
type OrderStatus = 'pending' | 'preparing' | 'completed';

interface CreateOrderItemInput {
  menu_item_id: number;
  quantity: number;
}

interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}

interface CompleteResult {
  message: string;
  historyCount: number;
}

interface TableWithSession {
  table: TableInfo;
  activeSession: TableSession | null;
  totalAmount: number;
  orderCount: number;
}

interface OrderHistoryItem {
  history: OrderHistory;
  items: ParsedOrderItem[]; // items_json 파싱 결과
}

interface ParsedOrderItem {
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
```

---

## 10. 컴포넌트 의존성 다이어그램

```
OrderController ──> OrderService ──> OrderRepository
                                 ──> MenuRepository (Unit 2)
                                 ──> TableService
                                 ──> SSEService

TableController ──> TableService ──> TableRepository
                                 ──> OrderRepository
                                 ──> SSEService

SSEController   ──> SSEService   ──> SSEManager

SSEService      ──> SSEManager

Utilities:
  retry.ts          (OrderService, TableService에서 사용)
  validators.ts     (OrderController, TableController에서 사용)
  order-number.ts   (OrderService에서 사용)
```

---

## 11. 파일 구조 (Unit 3 산출물)

```
packages/backend/src/
├── controllers/
│   ├── order.controller.ts      # OrderController
│   ├── table.controller.ts      # TableController
│   └── sse.controller.ts        # SSEController
├── services/
│   ├── order.service.ts         # OrderService
│   ├── table.service.ts         # TableService
│   └── sse.service.ts           # SSEService
├── repositories/
│   ├── order.repository.ts      # OrderRepository
│   └── table.repository.ts      # TableRepository
├── sse/
│   └── sse-manager.ts           # SSEManager
├── utils/
│   ├── retry.ts                 # withRetry 유틸리티
│   ├── validators.ts            # 입력 검증 헬퍼
│   └── order-number.ts          # 주문번호 생성
├── errors/
│   └── app-error.ts             # AppError 클래스 (Unit 1과 공유 가능)
├── types/
│   └── order.types.ts           # Unit 3 타입 정의
└── routes/
    ├── order.routes.ts          # 주문 라우트
    ├── table.routes.ts          # 테이블 라우트
    └── sse.routes.ts            # SSE 라우트
```
