# NFR Design Patterns - Unit 3: Order Domain

## 개요
Unit 3의 NFR 요구사항을 충족하기 위한 설계 패턴을 정의한다.

---

## 1. 의존성 주입 패턴 (Constructor Injection)

### 패턴
각 Service 클래스가 생성자에서 의존하는 Repository/Service를 받는다.

### 구조

```typescript
// OrderService — 생성자 주입
class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private menuRepository: MenuRepository,
    private tableService: TableService,
    private sseService: SSEService
  ) {}

  createOrder(storeId: number, tableId: number, items: CreateOrderItemInput[]): Order { ... }
}

// TableService — 생성자 주입
class TableService {
  constructor(
    private tableRepository: TableRepository,
    private orderRepository: OrderRepository,
    private sseService: SSEService
  ) {}

  completeTable(storeId: number, tableId: number): CompleteResult { ... }
}

// SSEService — 의존성 없음 (인메모리 관리)
class SSEService {
  constructor() {}
}
```

### 조립 (Composition Root)

```typescript
// src/index.ts 또는 src/container.ts
const db = drizzle(new Database('sqlite.db'));

// Repositories
const orderRepository = new OrderRepository(db);
const tableRepository = new TableRepository(db);
const menuRepository = new MenuRepository(db);

// Services
const sseService = new SSEService();
const tableService = new TableService(tableRepository, orderRepository, sseService);
const orderService = new OrderService(orderRepository, menuRepository, tableService, sseService);

// Controllers
const orderController = new OrderController(orderService);
const tableController = new TableController(tableService);
const sseController = new SSEController(sseService);
```

### 테스트 시 Mock 주입

```typescript
// 테스트에서 mock 주입
const mockOrderRepo = { create: vi.fn(), findById: vi.fn(), ... };
const mockMenuRepo = { findByIds: vi.fn(), ... };
const mockTableService = { getOrCreateSession: vi.fn(), ... };
const mockSSEService = { broadcastToAdmin: vi.fn(), ... };

const orderService = new OrderService(mockOrderRepo, mockMenuRepo, mockTableService, mockSSEService);
```

---

## 2. 트랜잭션 재시도 패턴 (Retry with Backoff)

### 패턴
SQLite BUSY 에러 발생 시 고정 간격으로 재시도한다.

### 구현

```typescript
// src/utils/retry.ts
function withRetry<T>(fn: () => T, maxRetries: number = 2, delayMs: number = 100): T {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error;
      if (isSQLiteBusyError(error)) {
        // 동기식 대기 (better-sqlite3는 동기식)
        const start = Date.now();
        while (Date.now() - start < delayMs) { /* busy wait */ }
        continue;
      }
      throw error; // 재시도 불가능한 에러는 즉시 throw
    }
  }
  throw new Error('Unreachable');
}

function isSQLiteBusyError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('SQLITE_BUSY');
}
```

### 적용 대상
| 작업 | 재시도 | 근거 |
|---|---|---|
| 주문 생성 (Order + OrderItem INSERT) | ✅ 최대 2회 | 쓰기 트랜잭션 |
| 이용 완료 (History 복사 + 삭제) | ✅ 최대 2회 | 복합 쓰기 트랜잭션 |
| 주문 삭제 (Order + OrderItem DELETE) | ✅ 최대 2회 | 쓰기 트랜잭션 |
| 주문 상태 변경 (UPDATE) | ✅ 최대 2회 | 쓰기 트랜잭션 |
| 조회 (SELECT) | ❌ | 읽기 전용, BUSY 발생 안 함 |

---

## 3. 에러 처리 패턴 (Custom Error + Global Handler)

### AppError 클래스

```typescript
// src/errors/app-error.ts
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 사용 예시
throw new AppError(400, 'INVALID_ORDER_ITEMS', '주문 항목이 없습니다');
throw new AppError(404, 'ORDER_NOT_FOUND', '주문을 찾을 수 없습니다');
throw new AppError(403, 'NO_ACTIVE_SESSION', '활성 세션이 없습니다');
```

### 에러 코드 정의

| 코드 | HTTP | 설명 |
|---|---|---|
| `INVALID_ORDER_ITEMS` | 400 | 주문 항목 검증 실패 |
| `INVALID_MENU_ITEM` | 400 | 유효하지 않은 메뉴 ID |
| `INVALID_QUANTITY` | 400 | 수량 검증 실패 |
| `INVALID_STATUS` | 400 | 유효하지 않은 주문 상태 |
| `INVALID_TABLE_NUMBER` | 400 | 테이블 번호 검증 실패 |
| `INVALID_PASSWORD` | 400 | 비밀번호 검증 실패 |
| `INVALID_DATE_FORMAT` | 400 | 날짜 형식 검증 실패 |
| `NO_ACTIVE_SESSION` | 403 | 활성 세션 없음 |
| `ORDER_NOT_FOUND` | 404 | 주문 없음 |
| `TABLE_NOT_FOUND` | 404 | 테이블 없음 |
| `TABLE_NUMBER_DUPLICATE` | 409 | 테이블 번호 중복 |
| `SESSION_ALREADY_COMPLETED` | 400 | 이미 이용 완료된 세션 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 글로벌 에러 핸들러 연동 (Unit 1 제공)

```typescript
// Unit 1의 errorHandler가 AppError를 처리
// Controller에서는 throw만 하면 됨
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  } else {
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' }
    });
  }
});
```

---

## 4. 입력 검증 패턴 (Manual Validation)

### 패턴
Controller에서 직접 if/throw 패턴으로 검증한다. 외부 라이브러리 없음.

### 구현

```typescript
// Controller 내 검증 예시
class OrderController {
  create(req: Request, res: Response, next: NextFunction) {
    try {
      const { items } = req.body;

      // 검증
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'INVALID_ORDER_ITEMS', '주문 항목이 없습니다');
      }

      for (const item of items) {
        if (!item.menu_item_id || typeof item.menu_item_id !== 'number') {
          throw new AppError(400, 'INVALID_MENU_ITEM', '유효하지 않은 메뉴 항목입니다');
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
          throw new AppError(400, 'INVALID_QUANTITY', '수량은 1 이상이어야 합니다');
        }
      }

      const result = this.orderService.createOrder(storeId, tableId, items);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

### 검증 헬퍼 함수

```typescript
// src/utils/validators.ts
function validatePositiveInteger(value: unknown, fieldName: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new AppError(400, `INVALID_${fieldName.toUpperCase()}`, `${fieldName}은(는) 1 이상의 정수여야 합니다`);
  }
  return num;
}

function validateEnum<T extends string>(value: unknown, allowed: T[], fieldName: string): T {
  if (!allowed.includes(value as T)) {
    throw new AppError(400, `INVALID_${fieldName.toUpperCase()}`, `유효하지 않은 ${fieldName}입니다`);
  }
  return value as T;
}

function validateDateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, 'INVALID_DATE_FORMAT', `${fieldName}은(는) YYYY-MM-DD 형식이어야 합니다`);
  }
  return value;
}
```

---

## 5. SSE 이벤트 전송 패턴

### 이벤트 직렬화

```typescript
// SSE 이벤트 전송 형식
function sendSSEEvent(res: Response, event: string, data: unknown): boolean {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false; // 전송 실패 (연결 끊김)
  }
}
```

### Heartbeat 패턴 (전역 단일 타이머)

```typescript
// SSEManager 내부
private heartbeatInterval: NodeJS.Timeout;

startHeartbeat() {
  this.heartbeatInterval = setInterval(() => {
    // 모든 admin 클라이언트에 heartbeat
    for (const [storeId, clients] of this.adminClients) {
      for (const client of clients) {
        try {
          client.write(':heartbeat\n\n');
        } catch {
          clients.delete(client); // 실패 시 즉시 제거
        }
      }
    }
    // 모든 table 클라이언트에 heartbeat
    for (const [key, client] of this.tableClients) {
      try {
        client.write(':heartbeat\n\n');
      } catch {
        this.tableClients.delete(key); // 실패 시 즉시 제거
      }
    }
  }, 30_000); // 30초 간격
}
```

---

## 6. Repository 패턴

### 구조

```typescript
// Repository는 Drizzle ORM db 인스턴스를 생성자로 받음
class OrderRepository {
  constructor(private db: BetterSQLite3Database) {}

  create(data: NewOrder): Order {
    return this.db.insert(orders).values(data).returning().get();
  }

  findById(orderId: number, storeId: number): Order | undefined {
    return this.db.select().from(orders)
      .where(and(eq(orders.orderId, orderId), eq(orders.storeId, storeId)))
      .get();
  }
}
```

### 트랜잭션 사용

```typescript
// Service에서 트랜잭션 사용
class OrderService {
  createOrder(...) {
    return withRetry(() => {
      return this.db.transaction((tx) => {
        // 1. Order INSERT
        const order = tx.insert(orders).values({...}).returning().get();
        // 2. OrderItem INSERT (bulk)
        const orderItems = tx.insert(orderItems).values(itemsData).returning().all();
        return { order, items: orderItems };
      });
    });
  }
}
```

> **Note**: Service가 트랜잭션을 관리하므로, Service도 db 인스턴스에 접근해야 한다. Repository는 단순 쿼리용, 트랜잭션이 필요한 복합 작업은 Service에서 직접 db.transaction() 사용.

---

## 패턴 요약

| 패턴 | 적용 영역 | 복잡도 |
|---|---|---|
| 생성자 주입 | Service ← Repository/Service | Low |
| 트랜잭션 재시도 | 쓰기 트랜잭션 (BUSY 대응) | Low |
| AppError + 글로벌 핸들러 | 전체 에러 처리 | Low |
| 수동 if/throw 검증 | Controller 입력 검증 | Low |
| SSE 전역 heartbeat | SSEManager | Low |
| Repository 패턴 | 데이터 접근 레이어 | Low |
