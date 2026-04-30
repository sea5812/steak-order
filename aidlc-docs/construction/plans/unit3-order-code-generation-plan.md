# Code Generation Plan - Unit 3: Order Domain

## Unit Context

### 기본 정보
- **Unit**: Unit 3 - Order Domain
- **담당**: 팀원 C (Order & Realtime Lead)
- **프로젝트 타입**: Greenfield, 모놀리식 모노레포
- **코드 위치**: `packages/backend/src/` (워크스페이스 루트 기준)
- **테스트 위치**: `packages/backend/tests/`

### 관련 스토리
- **US-C04**: 주문 생성 (고객)
- **US-C05**: 주문 내역 조회 + SSE 실시간 상태 업데이트 (고객)
- **US-A03**: 실시간 주문 모니터링 + 상태 변경 (관리자)
- **US-A04**: 테이블 관리 + 주문 삭제 + 이용 완료 (관리자)

### 의존성
- **Unit 1 (Foundation)**: DB 스키마, 인증 미들웨어, 에러 핸들러, Express 서버, 타입 정의
- **Unit 2 (Menu)**: MenuRepository (가격 검증 시 참조)

### 설계 산출물 참조
- `aidlc-docs/construction/unit3-order/functional-design/` — 비즈니스 로직, 규칙, 엔티티
- `aidlc-docs/construction/unit3-order/nfr-requirements/` — NFR 요구사항, 기술 결정
- `aidlc-docs/construction/unit3-order/nfr-design/` — 설계 패턴, 논리 컴포넌트

---

## Code Generation Steps

### Step 1: 유틸리티 및 타입 정의
- [x] `packages/backend/src/types/order.types.ts` — Unit 3 타입 정의 (OrderStatus, CreateOrderItemInput, OrderWithItems, CompleteResult, TableWithSession, OrderHistoryItem 등)
- [x] `packages/backend/src/errors/app-error.ts` — AppError 클래스 (statusCode, code, message)
- [x] `packages/backend/src/utils/retry.ts` — withRetry 트랜잭션 재시도 유틸리티
- [x] `packages/backend/src/utils/validators.ts` — 입력 검증 헬퍼 (validatePositiveInteger, validateEnum, validateDateString)
- [x] `packages/backend/src/utils/order-number.ts` — 주문번호 생성 (YYYYMMDD-NNN)
- **Stories**: 공통 인프라 (모든 스토리 지원)

### Step 2: SSE 컴포넌트
- [x] `packages/backend/src/sse/sse-manager.ts` — SSEManager 클래스 (연결 풀, heartbeat, 브로드캐스트)
- [x] `packages/backend/src/services/sse.service.ts` — SSEService 클래스 (비즈니스 이벤트 래퍼)
- [x] `packages/backend/src/controllers/sse.controller.ts` — SSEController (관리자/테이블 SSE 스트림)
- [x] `packages/backend/src/routes/sse.routes.ts` — SSE 라우트 정의
- **Stories**: US-C05 (테이블 SSE), US-A03 (관리자 SSE)

### Step 3: Repository 레이어
- [x] `packages/backend/src/repositories/order.repository.ts` — OrderRepository (Order/OrderItem/OrderHistory CRUD)
- [x] `packages/backend/src/repositories/table.repository.ts` — TableRepository (TableInfo/TableSession CRUD)
- **Stories**: US-C04, US-C05, US-A03, US-A04

### Step 4: Service 레이어
- [x] `packages/backend/src/services/order.service.ts` — OrderService (주문 생성/조회/상태변경/삭제)
- [x] `packages/backend/src/services/table.service.ts` — TableService (테이블 CRUD, 세션 관리, 이용 완료)
- **Stories**: US-C04, US-C05, US-A03, US-A04

### Step 5: Controller 레이어
- [x] `packages/backend/src/controllers/order.controller.ts` — OrderController (5 endpoints)
- [x] `packages/backend/src/controllers/table.controller.ts` — TableController (5 endpoints)
- [x] `packages/backend/src/routes/order.routes.ts` — 주문 라우트 정의
- [x] `packages/backend/src/routes/table.routes.ts` — 테이블 라우트 정의
- **Stories**: US-C04, US-C05, US-A03, US-A04

### Step 6: 라우트 통합
- [x] `packages/backend/src/routes/index.ts` — Unit 3 라우트 통합 (order, table, sse 라우트 등록)
- **Stories**: 전체 통합

### Step 7: 단위 테스트 — 유틸리티
- [x] `packages/backend/tests/utils/retry.test.ts` — withRetry 테스트
- [x] `packages/backend/tests/utils/validators.test.ts` — 검증 헬퍼 테스트
- [x] `packages/backend/tests/utils/order-number.test.ts` — 주문번호 생성 테스트
- **Stories**: 공통 인프라

### Step 8: 단위 테스트 — SSE
- [x] `packages/backend/tests/sse/sse-manager.test.ts` — SSEManager 테스트 (연결 관리, heartbeat, 브로드캐스트)
- [x] `packages/backend/tests/services/sse.service.test.ts` — SSEService 테스트
- **Stories**: US-C05, US-A03

### Step 9: 단위 테스트 — Repository
- [x] `packages/backend/tests/repositories/order.repository.test.ts` — OrderRepository 테스트 (인메모리 SQLite)
- [x] `packages/backend/tests/repositories/table.repository.test.ts` — TableRepository 테스트 (인메모리 SQLite)
- **Stories**: US-C04, US-C05, US-A03, US-A04

### Step 10: 단위 테스트 — Service
- [x] `packages/backend/tests/services/order.service.test.ts` — OrderService 테스트 (mock 주입)
- [x] `packages/backend/tests/services/table.service.test.ts` — TableService 테스트 (mock 주입)
- **Stories**: US-C04, US-C05, US-A03, US-A04

### Step 11: 단위 테스트 — Controller
- [x] `packages/backend/tests/controllers/order.controller.test.ts` — OrderController 테스트
- [x] `packages/backend/tests/controllers/table.controller.test.ts` — TableController 테스트
- **Stories**: US-C04, US-C05, US-A03, US-A04

### Step 12: 문서화
- [x] `aidlc-docs/construction/unit3-order/code/code-summary.md` — 코드 생성 요약 (파일 목록, 스토리 매핑, API 엔드포인트)

---

## Story Traceability

| Story | 구현 파일 | Step |
|---|---|---|
| US-C04 (주문 생성) | order.service, order.controller, order.repository, order.routes | 3, 4, 5 |
| US-C05 (주문 내역 + SSE) | order.service, order.controller, sse-manager, sse.service, sse.controller | 2, 3, 4, 5 |
| US-A03 (실시간 모니터링) | order.service, order.controller, sse-manager, sse.service, sse.controller | 2, 3, 4, 5 |
| US-A04 (테이블 관리) | table.service, table.controller, table.repository, table.routes | 3, 4, 5 |

---

## 파일 목록 요약

### 소스 코드 (15개)
| # | 파일 | Step |
|---|---|---|
| 1 | types/order.types.ts | 1 |
| 2 | errors/app-error.ts | 1 |
| 3 | utils/retry.ts | 1 |
| 4 | utils/validators.ts | 1 |
| 5 | utils/order-number.ts | 1 |
| 6 | sse/sse-manager.ts | 2 |
| 7 | services/sse.service.ts | 2 |
| 8 | controllers/sse.controller.ts | 2 |
| 9 | routes/sse.routes.ts | 2 |
| 10 | repositories/order.repository.ts | 3 |
| 11 | repositories/table.repository.ts | 3 |
| 12 | services/order.service.ts | 4 |
| 13 | services/table.service.ts | 4 |
| 14 | controllers/order.controller.ts | 5 |
| 15 | controllers/table.controller.ts | 5 |

### 라우트 (3개)
| # | 파일 | Step |
|---|---|---|
| 16 | routes/order.routes.ts | 5 |
| 17 | routes/table.routes.ts | 5 |
| 18 | routes/index.ts | 6 |

### 테스트 (10개)
| # | 파일 | Step |
|---|---|---|
| 19 | tests/utils/retry.test.ts | 7 |
| 20 | tests/utils/validators.test.ts | 7 |
| 21 | tests/utils/order-number.test.ts | 7 |
| 22 | tests/sse/sse-manager.test.ts | 8 |
| 23 | tests/services/sse.service.test.ts | 8 |
| 24 | tests/repositories/order.repository.test.ts | 9 |
| 25 | tests/repositories/table.repository.test.ts | 9 |
| 26 | tests/services/order.service.test.ts | 10 |
| 27 | tests/services/table.service.test.ts | 10 |
| 28 | tests/controllers/order.controller.test.ts | 11 |
| 29 | tests/controllers/table.controller.test.ts | 11 |

### 문서 (1개)
| # | 파일 | Step |
|---|---|---|
| 30 | aidlc-docs/construction/unit3-order/code/code-summary.md | 12 |

**총 30개 파일** (소스 18개 + 테스트 11개 + 문서 1개)
