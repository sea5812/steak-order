# Domain Entities - Unit 3: Order Domain

## 개요
Unit 3에서 관리하는 도메인 엔티티 정의. Unit 1(Foundation)에서 생성한 DB 스키마를 기반으로 하되, Unit 3의 비즈니스 로직 관점에서 엔티티 관계와 제약조건을 상세 정의한다.

> **Note**: 실제 Drizzle 스키마는 Unit 1에서 정의됨. 이 문서는 Unit 3의 비즈니스 로직 설계를 위한 논리적 엔티티 정의.

---

## 1. Order (주문)

### 속성

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| order_id | INTEGER (PK) | ✅ | 자동 증가 |
| order_number | TEXT | ✅ | 날짜 기반 순번 (예: 20260430-001) |
| store_id | INTEGER (FK → Store) | ✅ | 매장 ID |
| table_id | INTEGER (FK → TableInfo) | ✅ | 테이블 ID |
| session_id | INTEGER (FK → TableSession) | ✅ | 현재 테이블 세션 ID |
| total_amount | INTEGER | ✅ | 총 주문 금액 (원) |
| status | TEXT | ✅ | 주문 상태: 'pending' / 'preparing' / 'completed' |
| ordered_at | TEXT (ISO 8601) | ✅ | 주문 시각 |
| updated_at | TEXT (ISO 8601) | ✅ | 최종 수정 시각 |

### 제약조건
- `order_number`는 매장 내에서 일별 고유 (store_id + 날짜 기준)
- `status` 기본값: 'pending'
- `total_amount`는 서버에서 계산 (클라이언트 값 무시)
- `ordered_at`은 서버 시각 기준

### 인덱스
- `idx_order_store_session`: (store_id, session_id) — 세션별 주문 조회
- `idx_order_store_date`: (store_id, ordered_at) — 날짜별 주문 조회
- `idx_order_store_table`: (store_id, table_id) — 테이블별 주문 조회

---

## 2. OrderItem (주문 항목)

### 속성

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| order_item_id | INTEGER (PK) | ✅ | 자동 증가 |
| order_id | INTEGER (FK → Order) | ✅ | 주문 ID |
| menu_item_id | INTEGER (FK → MenuItem) | ✅ | 메뉴 항목 ID |
| menu_name | TEXT | ✅ | 주문 시점의 메뉴명 (스냅샷) |
| quantity | INTEGER | ✅ | 수량 |
| unit_price | INTEGER | ✅ | 주문 시점의 단가 (원, 서버 검증 가격) |
| subtotal | INTEGER | ✅ | 소계 (quantity × unit_price) |

### 제약조건
- `quantity` ≥ 1
- `unit_price` ≥ 0
- `subtotal` = quantity × unit_price (서버에서 계산)
- `menu_name`과 `unit_price`는 주문 시점 스냅샷 (메뉴 변경 시에도 주문 기록 유지)
- Order 삭제 시 CASCADE 삭제

---

## 3. TableSession (테이블 세션)

### 속성

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| session_id | INTEGER (PK) | ✅ | 자동 증가 |
| table_id | INTEGER (FK → TableInfo) | ✅ | 테이블 ID |
| store_id | INTEGER (FK → Store) | ✅ | 매장 ID |
| status | TEXT | ✅ | 세션 상태: 'active' / 'completed' |
| started_at | TEXT (ISO 8601) | ✅ | 세션 시작 시각 |
| ended_at | TEXT (ISO 8601) | ❌ | 세션 종료 시각 (이용 완료 시 설정) |

### 제약조건
- 테이블당 활성 세션은 최대 1개 (status = 'active')
- `started_at`은 태블릿 로그인 시 서버 시각 기준
- `ended_at`은 이용 완료 처리 시 설정
- 세션 시작: 태블릿 로그인 시 자동 생성 (기존 활성 세션이 없을 때)

### 인덱스
- `idx_session_table_active`: (table_id, status) — 활성 세션 조회
- `idx_session_store`: (store_id) — 매장별 세션 조회

---

## 4. OrderHistory (과거 주문 이력)

### 속성

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| history_id | INTEGER (PK) | ✅ | 자동 증가 |
| original_order_id | INTEGER | ✅ | 원본 주문 ID (참조용, FK 아님) |
| order_number | TEXT | ✅ | 원본 주문 번호 |
| store_id | INTEGER (FK → Store) | ✅ | 매장 ID |
| table_id | INTEGER (FK → TableInfo) | ✅ | 테이블 ID |
| session_id | INTEGER | ✅ | 원본 세션 ID (참조용) |
| total_amount | INTEGER | ✅ | 총 주문 금액 |
| status | TEXT | ✅ | 이용 완료 시점의 주문 상태 |
| ordered_at | TEXT (ISO 8601) | ✅ | 원본 주문 시각 |
| completed_at | TEXT (ISO 8601) | ✅ | 이용 완료 처리 시각 |
| items_json | TEXT (JSON) | ✅ | 주문 항목 JSON 스냅샷 |

### 제약조건
- `items_json`은 OrderItem 배열의 JSON 직렬화 (menu_name, quantity, unit_price, subtotal)
- 이용 완료 시 Order + OrderItem → OrderHistory로 복사 후 원본 삭제
- `completed_at`은 이용 완료 처리 시 서버 시각
- 보존 기간: 90일 (90일 이전 데이터는 조회 시 필터링 또는 정기 삭제)

### 인덱스
- `idx_history_store_table`: (store_id, table_id) — 테이블별 이력 조회
- `idx_history_completed`: (completed_at) — 날짜 필터링 및 보존 기간 관리

---

## 5. 엔티티 관계도

```
+-------------+       +---------------+       +----------------+
|   Store     |       |  TableInfo    |       | TableSession   |
|-------------|       |---------------|       |----------------|
| store_id PK |<──┐   | table_id PK   |<──┐   | session_id PK  |
| name        |   │   | store_id FK   |   │   | table_id FK    |
| slug        |   │   | table_number  |   │   | store_id FK    |
+-------------+   │   | password_hash |   │   | status         |
                  │   +---------------+   │   | started_at     |
                  │                       │   | ended_at       |
                  │                       │   +----------------+
                  │                       │          |
                  │                       │          | 1:N
                  │                       │          v
                  │   +---------------+   │   +----------------+
                  │   |   MenuItem    |   │   |    Order       |
                  │   |---------------|   │   |----------------|
                  │   | menu_item_id  |   │   | order_id PK    |
                  │   | store_id FK   |   │   | order_number   |
                  │   | name          |   │   | store_id FK    |
                  │   | price         |   │   | table_id FK    |
                  │   +---------------+   │   | session_id FK  |
                  │          |            │   | total_amount   |
                  │          | ref        │   | status         |
                  │          v            │   | ordered_at     |
                  │   +---------------+   │   +----------------+
                  │   |  OrderItem    |   │          |
                  │   |---------------|   │          | 1:N
                  │   | order_item_id |   │          v
                  │   | order_id FK   |───┘   +----------------+
                  │   | menu_item_id  |       |  OrderItem     |
                  │   | menu_name     |       | (same as left) |
                  │   | quantity      |       +----------------+
                  │   | unit_price    |
                  │   | subtotal      |
                  │   +---------------+
                  │
                  │   +------------------+
                  └──>|  OrderHistory    |
                      |------------------|
                      | history_id PK    |
                      | original_order_id|
                      | order_number     |
                      | store_id FK      |
                      | table_id FK      |
                      | session_id       |
                      | total_amount     |
                      | status           |
                      | ordered_at       |
                      | completed_at     |
                      | items_json       |
                      +------------------+
```

---

## 6. 주문 번호 생성 규칙

### 형식
`YYYYMMDD-NNN`

### 규칙
- `YYYYMMDD`: 주문 생성 날짜 (서버 시각 기준)
- `NNN`: 해당 날짜의 매장 내 순번 (001부터 시작)
- 매일 자정에 순번 리셋
- 예시: `20260430-001`, `20260430-002`, ..., `20260430-999`

### 생성 로직
1. 해당 날짜의 마지막 주문 번호 조회 (store_id + 날짜 기준)
2. 순번 +1 하여 새 주문 번호 생성
3. 주문이 없는 날은 001부터 시작
4. 동시성: SQLite 단일 쓰기 특성으로 자연스럽게 순서 보장
