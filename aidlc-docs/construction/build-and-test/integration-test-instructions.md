# Integration Test Instructions - Unit 3: Order Domain

## Purpose
Unit 3 내부 컴포넌트 간 통합 및 Unit 1(Foundation), Unit 2(Menu)와의 연동을 테스트한다.

---

## Test Scenarios

### Scenario 1: 주문 생성 E2E 흐름 (Unit 3 + Unit 1 + Unit 2)
- **Description**: 테이블 인증 → 세션 생성 → 메뉴 가격 검증 → 주문 생성 → SSE 알림
- **Setup**: 
  - Unit 1: DB 스키마 + 시드 데이터 + 인증 미들웨어 실행
  - Unit 2: 메뉴 데이터 존재
  - Unit 3: 서버 실행
- **Test Steps**:
  1. `POST /api/table/login` — 테이블 로그인 (JWT 획득)
  2. `GET /api/stores/1/sse/table/1` — SSE 연결
  3. `POST /api/stores/1/orders` — 주문 생성 (items 포함)
  4. 응답 확인: 201, order_number, total_amount (서버 가격 기준)
  5. SSE 이벤트 확인: 관리자 스트림에 `order:new` 수신
- **Expected Results**: 주문 생성 성공, 서버 가격으로 total_amount 계산, SSE 이벤트 전달

### Scenario 2: 주문 상태 변경 + SSE 양방향 알림
- **Description**: 관리자가 주문 상태 변경 → 관리자 SSE + 테이블 SSE 동시 알림
- **Setup**: Scenario 1 완료 후
- **Test Steps**:
  1. `POST /api/admin/login` — 관리자 로그인
  2. `GET /api/stores/1/sse/admin` — 관리자 SSE 연결
  3. `PUT /api/stores/1/orders/:id/status` — 상태 변경 (pending → preparing)
  4. 관리자 SSE: `order:updated` 이벤트 확인
  5. 테이블 SSE: `order:statusChanged` 이벤트 확인
- **Expected Results**: 양방향 SSE 이벤트 2초 이내 전달

### Scenario 3: 이용 완료 트랜잭션
- **Description**: 이용 완료 → OrderHistory 이동 → 원본 삭제 → 세션 종료
- **Setup**: 테이블에 주문 2~3건 존재
- **Test Steps**:
  1. `POST /api/stores/1/tables/:id/complete` — 이용 완료
  2. `GET /api/stores/1/tables/:id/history` — 과거 내역 확인
  3. `GET /api/stores/1/tables/:tableId/orders` — 현재 주문 비어있음 확인
  4. 관리자 SSE: `table:completed` 이벤트 확인
- **Expected Results**: 주문 이력 보존, 현재 주문 초기화, 세션 종료

### Scenario 4: SSE 연결 안정성
- **Description**: SSE 연결/해제/재연결 시나리오
- **Test Steps**:
  1. SSE 연결 수립
  2. 30초 대기 → heartbeat 수신 확인
  3. 클라이언트 연결 종료
  4. 서버 연결 풀에서 제거 확인
  5. 재연결 → 새 연결 수립 확인

---

## Setup Integration Test Environment

### 1. Start Server

```bash
cd packages/backend
npm run dev
# 또는
npx ts-node src/index.ts
```

### 2. Seed Test Data

```bash
# Unit 1의 시드 스크립트 실행
npx ts-node src/db/seed.ts
```

### 3. Manual Integration Test (curl)

```bash
# 1. 관리자 로그인
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"store_id":"black-marble","username":"admin","password":"admin1234"}'

# 2. 테이블 로그인
curl -X POST http://localhost:3000/api/table/login \
  -H "Content-Type: application/json" \
  -d '{"store_id":"black-marble","table_number":1,"password":"table1"}'

# 3. 주문 생성 (TABLE_JWT 사용)
curl -X POST http://localhost:3000/api/stores/1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TABLE_JWT" \
  -d '{"items":[{"menu_item_id":10,"quantity":1},{"menu_item_id":3,"quantity":2}]}'

# 4. 주문 조회 (관리자)
curl http://localhost:3000/api/stores/1/orders \
  -H "Authorization: Bearer ADMIN_JWT"

# 5. SSE 스트림 (관리자)
curl -N http://localhost:3000/api/stores/1/sse/admin \
  -H "Authorization: Bearer ADMIN_JWT"

# 6. 이용 완료
curl -X POST http://localhost:3000/api/stores/1/tables/1/complete \
  -H "Authorization: Bearer ADMIN_JWT"
```

---

## Cleanup

```bash
# 테스트 DB 삭제 (SQLite 파일)
rm -f packages/backend/sqlite.db
```
