# Business Rules - Unit 3: Order Domain

## 개요
Unit 3의 비즈니스 규칙, 검증 로직, 제약조건을 정의한다.

---

## 1. 주문 생성 규칙 (Order Creation Rules)

### BR-O01: 주문 항목 검증
- 주문 항목(items) 배열은 비어있을 수 없다
- 각 항목의 `menu_item_id`는 유효한 MenuItem을 참조해야 한다
- 각 항목의 `quantity`는 1 이상의 정수여야 한다

### BR-O02: 가격 서버 검증
- 클라이언트가 전송한 가격은 무시한다
- 서버에서 MenuItem 테이블의 현재 가격을 조회하여 `unit_price`로 사용한다
- `subtotal` = `quantity` × `unit_price` (서버 계산)
- `total_amount` = 모든 항목의 `subtotal` 합계 (서버 계산)

### BR-O03: 세션 필수
- 주문 생성 시 해당 테이블에 활성 세션(status='active')이 존재해야 한다
- 활성 세션이 없으면 주문 생성 거부 (403)

### BR-O04: 메뉴 스냅샷
- 주문 시점의 메뉴명(`menu_name`)과 단가(`unit_price`)를 OrderItem에 스냅샷으로 저장한다
- 이후 메뉴가 수정/삭제되어도 기존 주문 기록은 변경되지 않는다

### BR-O05: 주문 번호 생성
- 형식: `YYYYMMDD-NNN` (날짜-순번)
- 순번은 매장(store_id) 기준으로 일별 리셋
- 001부터 시작, 순차 증가
- 동시성: SQLite 단일 쓰기 특성으로 순서 보장

### BR-O06: 주문 초기 상태
- 새로 생성된 주문의 상태는 항상 'pending' (대기중)

### BR-O07: SSE 알림
- 주문 생성 성공 시 관리자 SSE 스트림에 'order:new' 이벤트 전송
- 페이로드: Order 전체 데이터 + OrderItems 배열

---

## 2. 주문 상태 전이 규칙 (Order Status Transition Rules)

### BR-S01: 유효한 상태 값
- 허용 상태: `pending` (대기중), `preparing` (준비중), `completed` (완료)
- 이외의 값은 거부 (400)

### BR-S02: 자유 전이
- 모든 방향의 상태 전이를 허용한다
- pending ↔ preparing ↔ completed (양방향)
- pending ↔ completed (직접 전이도 허용)

### BR-S03: 동일 상태 변경
- 현재 상태와 동일한 상태로 변경 요청 시 무시한다 (200 OK, 변경 없음)
- idempotent 동작

### BR-S04: 매장 소유권 확인
- 관리자는 자신의 매장(store_id) 주문만 상태 변경 가능
- 다른 매장의 주문 상태 변경 시도 시 404 반환

### BR-S05: SSE 알림
- 상태 변경 성공 시:
  - 관리자 SSE: 'order:updated' 이벤트 (Order 전체 데이터)
  - 해당 테이블 SSE: 'order:statusChanged' 이벤트 (Order 전체 데이터)

---

## 3. 주문 삭제 규칙 (Order Deletion Rules)

### BR-D01: 관리자 전용
- 주문 삭제는 관리자만 수행 가능

### BR-D02: 물리적 삭제
- Order와 관련 OrderItem을 물리적으로 삭제한다 (hard delete)
- 삭제된 데이터는 복구 불가

### BR-D03: 매장 소유권 확인
- 관리자는 자신의 매장(store_id) 주문만 삭제 가능

### BR-D04: CASCADE 삭제
- Order 삭제 시 관련 OrderItem도 함께 삭제

### BR-D05: SSE 알림
- 삭제 성공 시:
  - 관리자 SSE: 'order:deleted' 이벤트 ({ orderId, tableId })
  - 해당 테이블 SSE: 'order:deleted' 이벤트 ({ orderId })

---

## 4. 테이블 세션 규칙 (Table Session Rules)

### BR-T01: 세션 시작 시점
- 테이블 태블릿 로그인 성공 시 자동으로 세션 시작
- 기존 활성 세션이 있으면 새로 생성하지 않고 기존 세션 유지

### BR-T02: 단일 활성 세션
- 테이블당 활성 세션(status='active')은 최대 1개
- 새 세션 생성 전 기존 활성 세션 존재 여부 확인 필수

### BR-T03: 세션 상태
- 세션 상태: `active` (활성) / `completed` (완료)
- active → completed 전이만 허용 (역방향 불가)

### BR-T04: 세션과 주문 연결
- 모든 주문은 반드시 하나의 세션에 속한다
- 세션 ID를 통해 현재 세션의 주문만 필터링

---

## 5. 이용 완료 규칙 (Session Completion Rules)

### BR-C01: 관리자 전용
- 이용 완료 처리는 관리자만 수행 가능

### BR-C02: 활성 세션 필수
- 이용 완료 처리 시 해당 테이블에 활성 세션이 존재해야 한다
- 활성 세션이 없으면 400 반환

### BR-C03: 데이터 이동 (트랜잭션)
- 현재 세션의 모든 Order → OrderHistory로 복사
  - OrderItem 배열을 JSON 직렬화하여 `items_json`에 저장
  - `completed_at`에 현재 시각 설정
- 원본 OrderItem 삭제
- 원본 Order 삭제
- TableSession.status = 'completed', ended_at = 현재 시각
- 위 모든 작업은 단일 트랜잭션 내에서 수행

### BR-C04: 세션 리셋
- 이용 완료 후 해당 테이블은 세션 없는 상태
- 다음 태블릿 로그인 시 새 세션 자동 생성 (BR-T01)

### BR-C05: SSE 알림
- 이용 완료 성공 시 관리자 SSE: 'table:completed' 이벤트

---

## 6. SSE 연결 관리 규칙 (SSE Connection Rules)

### BR-SSE01: 연결 인증
- 관리자 SSE: Admin JWT 토큰 필수
- 테이블 SSE: Table JWT 토큰 필수

### BR-SSE02: 연결 풀 관리
- 관리자: 매장별 다중 연결 허용 (Set)
- 테이블: 테이블당 1개 연결 (새 연결 시 기존 연결 교체)

### BR-SSE03: Heartbeat
- 30초 간격으로 heartbeat 전송 (`:heartbeat\n\n`)
- 연결 유지 및 프록시 타임아웃 방지

### BR-SSE04: 연결 종료 처리
- 클라이언트 연결 종료(close 이벤트) 시 풀에서 제거
- 리소스 누수 방지

### BR-SSE05: 재연결
- EventSource 기본 자동 재연결 동작 활용
- 서버 측 Last-Event-ID 처리 없음
- 클라이언트가 필요 시 API로 최신 데이터 조회

### BR-SSE06: 이벤트 페이로드
- 변경된 엔티티의 전체 데이터를 전송 (delta 아님)
- 클라이언트 로직 단순화 우선

---

## 7. 과거 주문 내역 규칙 (Order History Rules)

### BR-H01: 보존 기간
- 과거 주문 내역은 90일간 보존
- 90일 이전 데이터는 조회 시 필터링으로 제외
- 정기 삭제 배치는 MVP 범위 외 (향후 구현)

### BR-H02: 조회 필터
- 기본: 최근 90일 이내 데이터
- startDate/endDate 파라미터로 범위 지정 가능 (90일 이내)
- completed_at 시간 역순 정렬

### BR-H03: 데이터 구조
- items_json: OrderItem 배열의 JSON 직렬화
  - 각 항목: { menu_name, quantity, unit_price, subtotal }
- 조회 시 items_json을 파싱하여 items 배열로 반환

---

## 8. 관리자 대시보드 조회 규칙 (Admin Dashboard Rules)

### BR-AD01: 기본 필터
- 기본 조회 범위: 오늘 날짜의 모든 주문 (이용 완료 포함)
- date 파라미터로 특정 날짜 조회 가능

### BR-AD02: 테이블별 집계
- 각 테이블의 현재 활성 세션 주문 총액 계산
- 활성 세션이 없는 테이블은 총액 0

### BR-AD03: 정렬
- 주문: ordered_at 시간순 (최신 먼저)
- 테이블: table_number 오름차순

---

## 9. 입력 검증 규칙 요약 (Validation Rules Summary)

| API | 필드 | 규칙 |
|---|---|---|
| POST /orders | items | 배열, 비어있지 않음 |
| POST /orders | items[].menu_item_id | 정수, 유효한 MenuItem 참조 |
| POST /orders | items[].quantity | 정수, >= 1 |
| PUT /orders/:id/status | status | 'pending' / 'preparing' / 'completed' |
| POST /tables | table_number | 정수, >= 1, 매장 내 고유 |
| POST /tables | password | 문자열, 최소 4자 |
| PUT /tables/:id | table_number | (변경 시) 정수, >= 1, 매장 내 고유 |
| GET /tables/:id/history | startDate | (선택) ISO 날짜 형식 |
| GET /tables/:id/history | endDate | (선택) ISO 날짜 형식 |
| GET /orders | date | (선택) ISO 날짜 형식, 기본=오늘 |
