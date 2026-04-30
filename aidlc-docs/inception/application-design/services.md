# 서비스 레이어 설계 - Black Marble Table

---

## 서비스 오케스트레이션 패턴

### 레이어드 아키텍처

```
Controller Layer (HTTP 요청/응답 처리)
        │
        v
Service Layer (비즈니스 로직 오케스트레이션)
        │
        v
Repository Layer (데이터 접근, Drizzle ORM)
        │
        v
Database (SQLite)
```

- **Controller**: HTTP 요청 파싱, 입력 검증, 응답 포맷팅
- **Service**: 비즈니스 로직, 트랜잭션 관리, 서비스 간 조율
- **Repository**: SQL 쿼리 실행, 데이터 매핑

---

## 핵심 서비스 흐름

### 1. 주문 생성 흐름

```
Customer UI                    Backend
    │                            │
    ├─ POST /orders ────────────>│
    │                            ├─ authMiddleware (JWT 검증)
    │                            ├─ OrderController.create()
    │                            │   ├─ 입력 검증
    │                            │   └─ OrderService.createOrder()
    │                            │       ├─ TableService.getOrCreateSession()
    │                            │       ├─ MenuRepository.findByIds() (가격 검증)
    │                            │       ├─ OrderRepository.create() (트랜잭션)
    │                            │       ├─ SSEService.broadcastToAdmin() ──> Admin Dashboard
    │                            │       └─ return Order
    │<── 201 Created ───────────│
    │                            │
```

### 2. 주문 상태 변경 흐름

```
Admin Dashboard                Backend
    │                            │
    ├─ PUT /orders/:id/status ──>│
    │                            ├─ authMiddleware (Admin JWT)
    │                            ├─ OrderController.updateStatus()
    │                            │   └─ OrderService.updateOrderStatus()
    │                            │       ├─ OrderRepository.updateStatus()
    │                            │       ├─ SSEService.broadcastToAdmin() ──> All Admin clients
    │                            │       └─ SSEService.broadcastToTable() ──> Customer tablet
    │<── 200 OK ────────────────│
    │                            │
```

### 3. 테이블 이용 완료 흐름

```
Admin Dashboard                Backend
    │                            │
    ├─ POST /tables/:id/complete>│
    │                            ├─ authMiddleware (Admin JWT)
    │                            ├─ TableController.complete()
    │                            │   └─ TableService.completeTable()
    │                            │       ├─ OrderRepository.moveToHistory() (트랜잭션)
    │                            │       │   ├─ 현재 세션 주문 → OrderHistory 이동
    │                            │       │   └─ 현재 주문 데이터 삭제
    │                            │       ├─ TableRepository.resetSession()
    │                            │       └─ SSEService.broadcastToAdmin()
    │<── 200 OK ────────────────│
    │                            │
```

### 4. SSE 이벤트 흐름

```
SSE Event Types:
├─ Admin SSE Stream (/sse/admin)
│   ├─ "order:new"        → 신규 주문 생성 시
│   ├─ "order:updated"    → 주문 상태 변경 시
│   ├─ "order:deleted"    → 주문 삭제 시
│   └─ "table:completed"  → 테이블 이용 완료 시
│
└─ Table SSE Stream (/sse/table/:tableId)
    └─ "order:statusChanged" → 해당 테이블 주문 상태 변경 시
```

### 5. 인증 흐름

```
Admin Login:
  POST /admin/login → AuthService.adminLogin()
    → AdminRepository.findByUsername()
    → bcrypt.compare(password, hash)
    → checkLoginAttempts()
    → JWT 발급 (16시간 만료, payload: {storeId, adminId, role: 'admin'})

Table Login:
  POST /table/login → AuthService.tableLogin()
    → TableRepository.findByNumber()
    → bcrypt.compare(password, hash)
    → JWT 발급 (16시간 만료, payload: {storeId, tableId, role: 'table'})
```

---

## 서비스 간 의존성

| Service | 의존하는 Service | 의존하는 Repository |
|---|---|---|
| AuthService | - | AdminRepository, TableRepository |
| AdminService | AuthService (해싱) | AdminRepository |
| MenuService | - | MenuRepository |
| OrderService | TableService, SSEService | OrderRepository, MenuRepository |
| TableService | SSEService | TableRepository, OrderRepository |
| SSEService | - | - (인메모리 클라이언트 풀) |
