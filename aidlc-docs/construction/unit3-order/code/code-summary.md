# Code Summary - Unit 3: Order Domain

## 생성된 파일 목록

### 소스 코드 (18개)

| # | 파일 | 설명 |
|---|---|---|
| 1 | `src/types/order.types.ts` | Unit 3 타입 정의 (엔티티, 입력, 응답 타입) |
| 2 | `src/errors/app-error.ts` | AppError 커스텀 에러 클래스 |
| 3 | `src/utils/retry.ts` | withRetry 트랜잭션 재시도 유틸리티 |
| 4 | `src/utils/validators.ts` | 입력 검증 헬퍼 함수 |
| 5 | `src/utils/order-number.ts` | 주문번호 생성 (YYYYMMDD-NNN) |
| 6 | `src/sse/sse-manager.ts` | SSE 연결 풀 관리 (heartbeat, 브로드캐스트) |
| 7 | `src/services/sse.service.ts` | SSE 비즈니스 이벤트 래퍼 |
| 8 | `src/controllers/sse.controller.ts` | SSE 스트림 엔드포인트 (관리자/테이블) |
| 9 | `src/routes/sse.routes.ts` | SSE 라우트 정의 |
| 10 | `src/repositories/order.repository.ts` | Order/OrderItem/OrderHistory CRUD |
| 11 | `src/repositories/table.repository.ts` | TableInfo/TableSession CRUD |
| 12 | `src/services/order.service.ts` | 주문 비즈니스 로직 (생성/조회/상태변경/삭제) |
| 13 | `src/services/table.service.ts` | 테이블/세션 비즈니스 로직 (CRUD/이용완료) |
| 14 | `src/controllers/order.controller.ts` | 주문 HTTP 핸들러 (5 endpoints) |
| 15 | `src/controllers/table.controller.ts` | 테이블 HTTP 핸들러 (5 endpoints) |
| 16 | `src/routes/order.routes.ts` | 주문 라우트 정의 |
| 17 | `src/routes/table.routes.ts` | 테이블 라우트 정의 |
| 18 | `src/routes/index.ts` | Unit 3 라우트 통합 등록 |

### 테스트 (11개)

| # | 파일 | 테스트 대상 |
|---|---|---|
| 1 | `tests/utils/retry.test.ts` | withRetry (성공, BUSY 재시도, 비-BUSY 즉시 throw) |
| 2 | `tests/utils/validators.test.ts` | 검증 헬퍼 (정수, enum, 날짜, 문자열) |
| 3 | `tests/utils/order-number.test.ts` | 주문번호 생성 (순번, 일별 리셋, 패딩) |
| 4 | `tests/sse/sse-manager.test.ts` | SSEManager (연결 관리, 브로드캐스트, heartbeat) |
| 5 | `tests/services/sse.service.test.ts` | SSEService (이벤트 위임, 연결 관리 위임) |
| 6 | `tests/repositories/order.repository.test.ts` | OrderRepository (CRUD, 인메모리 SQLite) |
| 7 | `tests/repositories/table.repository.test.ts` | TableRepository (CRUD, 인메모리 SQLite) |
| 8 | `tests/services/order.service.test.ts` | OrderService (생성, 상태변경, 삭제, 조회) |
| 9 | `tests/services/table.service.test.ts` | TableService (CRUD, 세션, 이용완료) |
| 10 | `tests/controllers/order.controller.test.ts` | OrderController (입력 검증, 라우팅) |
| 11 | `tests/controllers/table.controller.test.ts` | TableController (입력 검증, 라우팅) |

---

## API 엔드포인트 (12개)

| Method | Endpoint | Auth | 설명 | Story |
|---|---|---|---|---|
| POST | `/api/stores/:storeId/orders` | Table | 주문 생성 | US-C04 |
| GET | `/api/stores/:storeId/orders` | Admin | 매장 주문 조회 | US-A03 |
| PUT | `/api/stores/:storeId/orders/:id/status` | Admin | 주문 상태 변경 | US-A03 |
| DELETE | `/api/stores/:storeId/orders/:id` | Admin | 주문 삭제 | US-A04 |
| GET | `/api/stores/:storeId/tables/:tableId/orders` | Table | 테이블 세션 주문 조회 | US-C05 |
| GET | `/api/stores/:storeId/tables` | Admin | 테이블 목록 조회 | US-A04 |
| POST | `/api/stores/:storeId/tables` | Admin | 테이블 생성 | US-A04 |
| PUT | `/api/stores/:storeId/tables/:id` | Admin | 테이블 수정 | US-A04 |
| POST | `/api/stores/:storeId/tables/:id/complete` | Admin | 이용 완료 | US-A04 |
| GET | `/api/stores/:storeId/tables/:id/history` | Admin | 과거 주문 내역 | US-A04 |
| GET | `/api/stores/:storeId/sse/admin` | Admin | 관리자 SSE 스트림 | US-A03 |
| GET | `/api/stores/:storeId/sse/table/:tableId` | Table | 테이블 SSE 스트림 | US-C05 |

---

## Story 구현 매핑

| Story | 상태 | 구현 내용 |
|---|---|---|
| US-C04 (주문 생성) | ✅ | OrderService.createOrder, OrderController.create |
| US-C05 (주문 내역 + SSE) | ✅ | OrderService.getOrdersByTable, SSEController.tableStream |
| US-A03 (실시간 모니터링) | ✅ | OrderService.getOrdersByStore/updateOrderStatus, SSEController.adminStream |
| US-A04 (테이블 관리) | ✅ | TableService (전체), OrderService.deleteOrder |

---

## 설계 패턴 적용

| 패턴 | 적용 |
|---|---|
| 생성자 주입 | Service ← Repository/Service, Controller ← Service |
| 트랜잭션 재시도 | withRetry (최대 2회, 100ms 간격) |
| AppError + 글로벌 핸들러 | 13개 에러 코드 정의 |
| 수동 입력 검증 | Controller if/throw + 검증 헬퍼 |
| SSE 전역 heartbeat | 30초 간격, 실패 시 즉시 제거 |
| Repository 패턴 | better-sqlite3 직접 사용 |
