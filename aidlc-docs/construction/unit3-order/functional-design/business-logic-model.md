# Business Logic Model - Unit 3: Order Domain

## 개요
Unit 3의 핵심 비즈니스 로직 흐름을 정의한다. 주문 생성/조회/상태변경/삭제, 테이블 세션 관리, SSE 실시간 통신, 이용 완료 처리를 포함한다.

---

## 1. 주문 생성 (Order Creation)

### 흐름

```
클라이언트 요청
    |
    v
[1] 입력 검증
    - items 배열 비어있지 않은지 확인
    - 각 item의 menu_item_id, quantity 유효성 확인
    - quantity >= 1 확인
    |
    v
[2] 인증 정보에서 store_id, table_id 추출
    - JWT 토큰에서 디코딩
    |
    v
[3] 활성 세션 조회
    - table_id + status='active' 조건으로 TableSession 조회
    - 활성 세션 없으면 에러 반환 (403: 세션이 없습니다)
    |
    v
[4] 메뉴 가격 서버 검증
    - items의 menu_item_id 목록으로 MenuItem 일괄 조회
    - 존재하지 않는 메뉴 ID가 있으면 에러 반환 (400)
    - 서버 DB의 현재 가격을 unit_price로 사용
    - 클라이언트가 보낸 가격은 무시
    |
    v
[5] 주문 번호 생성
    - 오늘 날짜 기준 마지막 주문 번호 조회
    - YYYYMMDD-NNN 형식으로 순번 +1
    |
    v
[6] 트랜잭션 내 주문 생성
    - Order 레코드 생성 (status='pending')
    - OrderItem 레코드 일괄 생성
      - menu_name: MenuItem.name 스냅샷
      - unit_price: MenuItem.price (서버 가격)
      - subtotal: quantity * unit_price
    - total_amount: 모든 OrderItem.subtotal 합계
    |
    v
[7] SSE 이벤트 브로드캐스트
    - 관리자 SSE: 'order:new' 이벤트 (Order + OrderItems 전체 데이터)
    |
    v
[8] 응답 반환
    - 201 Created
    - 생성된 Order + OrderItems 반환
```

### 에러 시나리오
| 상황 | HTTP 코드 | 메시지 |
|---|---|---|
| items 배열 비어있음 | 400 | 주문 항목이 없습니다 |
| 존재하지 않는 메뉴 ID | 400 | 유효하지 않은 메뉴가 포함되어 있습니다 |
| quantity < 1 | 400 | 수량은 1 이상이어야 합니다 |
| 활성 세션 없음 | 403 | 활성 세션이 없습니다. 관리자에게 문의하세요 |
| DB 트랜잭션 실패 | 500 | 주문 처리 중 오류가 발생했습니다 |

---

## 2. 주문 상태 변경 (Order Status Update)

### 흐름

```
관리자 요청 (orderId, newStatus)
    |
    v
[1] 입력 검증
    - newStatus가 유효한 값인지 확인 ('pending', 'preparing', 'completed')
    |
    v
[2] 주문 조회
    - orderId로 Order 조회
    - 존재하지 않으면 404 반환
    - store_id 일치 확인 (관리자의 매장 주문만 변경 가능)
    |
    v
[3] 상태 전이 검증
    - 자유 변경 허용 (순방향 + 역방향 모두 가능)
    - 유효한 상태 값: pending, preparing, completed
    - 동일 상태로의 변경은 무시 (200 OK, 변경 없음)
    |
    v
[4] 상태 업데이트
    - Order.status 변경
    - Order.updated_at 갱신
    |
    v
[5] SSE 이벤트 브로드캐스트
    - 관리자 SSE: 'order:updated' 이벤트 (변경된 Order 전체 데이터)
    - 테이블 SSE: 'order:statusChanged' 이벤트 (해당 테이블에만)
    |
    v
[6] 응답 반환
    - 200 OK
    - 업데이트된 Order 반환
```

### 상태 전이 다이어그램

```
+----------+     +------------+     +-----------+
| pending  |<--->| preparing  |<--->| completed |
| (대기중) |     | (준비중)   |     | (완료)    |
+----------+     +------------+     +-----------+
```

- 모든 방향 전이 허용 (자유 변경)
- 동일 상태 변경 시 무시 (idempotent)

---

## 3. 주문 삭제 (Order Deletion)

### 흐름

```
관리자 요청 (orderId)
    |
    v
[1] 주문 조회
    - orderId로 Order 조회
    - 존재하지 않으면 404 반환
    - store_id 일치 확인
    |
    v
[2] 트랜잭션 내 삭제
    - OrderItem 삭제 (order_id 기준, CASCADE)
    - Order 삭제
    |
    v
[3] SSE 이벤트 브로드캐스트
    - 관리자 SSE: 'order:deleted' 이벤트 (삭제된 orderId, tableId)
    - 테이블 SSE: 'order:statusChanged' 이벤트 (해당 테이블에 삭제 알림)
    |
    v
[4] 응답 반환
    - 200 OK
    - { message: '주문이 삭제되었습니다' }
```

### 참고
- 물리적 삭제 (hard delete) — 복구 불가
- 삭제 후 관리자 대시보드에서 해당 테이블의 총 주문액이 자동 재계산됨 (클라이언트 측 SSE 이벤트 수신 후 재조회)

---

## 4. 주문 조회 (Order Query)

### 4.1 테이블별 현재 세션 주문 조회 (고객용)

```
GET /api/stores/:storeId/tables/:tableId/orders
    |
    v
[1] 인증 정보에서 store_id, table_id 확인
    |
    v
[2] 활성 세션 조회
    - table_id + status='active' 조건
    - 활성 세션 없으면 빈 배열 반환
    |
    v
[3] 주문 조회
    - session_id 기준으로 Order + OrderItem 조회
    - ordered_at 시간순 정렬 (오래된 것 먼저)
    |
    v
[4] 응답 반환
    - 200 OK
    - Order[] (각 Order에 items 포함)
```

### 4.2 매장 전체 주문 조회 (관리자용)

```
GET /api/stores/:storeId/orders?date=YYYY-MM-DD
    |
    v
[1] 인증 정보에서 store_id 확인 (관리자)
    |
    v
[2] 주문 조회
    - store_id + 날짜 필터 기준
    - 기본: 오늘 날짜의 모든 주문 (이용 완료 포함)
    - date 파라미터로 특정 날짜 조회 가능
    - ordered_at 시간순 정렬 (최신 먼저)
    |
    v
[3] 응답 반환
    - 200 OK
    - Order[] (각 Order에 items, table_number 포함)
```

---

## 5. 테이블 세션 관리 (Table Session Management)

### 5.1 세션 시작 (태블릿 로그인 시)

```
태블릿 로그인 성공
    |
    v
[1] 기존 활성 세션 확인
    - table_id + status='active' 조건
    |
    v
[2-A] 활성 세션 존재
    - 기존 세션 유지 (새로 생성하지 않음)
    - 기존 session_id 반환
    |
[2-B] 활성 세션 없음
    - 새 TableSession 생성 (status='active', started_at=현재시각)
    - 새 session_id 반환
    |
    v
[3] 로그인 응답에 session_id 포함
```

### 5.2 이용 완료 (Session Complete)

```
관리자 요청 (tableId)
    |
    v
[1] 활성 세션 조회
    - table_id + status='active' 조건
    - 활성 세션 없으면 400 반환 (이미 이용 완료됨)
    |
    v
[2] 현재 세션 주문 조회
    - session_id 기준 모든 Order + OrderItem 조회
    |
    v
[3] 트랜잭션 내 이용 완료 처리
    - 각 Order → OrderHistory 복사
      - items_json: OrderItem 배열을 JSON 직렬화
      - completed_at: 현재 시각
    - OrderItem 삭제 (해당 세션의 모든 주문)
    - Order 삭제 (해당 세션의 모든 주문)
    - TableSession.status = 'completed'
    - TableSession.ended_at = 현재 시각
    |
    v
[4] SSE 이벤트 브로드캐스트
    - 관리자 SSE: 'table:completed' 이벤트 (tableId, 세션 정보)
    |
    v
[5] 응답 반환
    - 200 OK
    - { message: '이용 완료 처리되었습니다', historyCount: N }
```

---

## 6. 테이블 관리 (Table Management)

### 6.1 테이블 목록 조회

```
GET /api/stores/:storeId/tables
    |
    v
[1] store_id 기준 테이블 목록 조회
    - 각 테이블의 활성 세션 정보 포함
    - 활성 세션이 있는 테이블: 현재 주문 총액, 주문 수 포함
    |
    v
[2] 응답 반환
    - 200 OK
    - Table[] (각 Table에 activeSession, totalAmount, orderCount 포함)
```

### 6.2 테이블 생성/설정

```
POST /api/stores/:storeId/tables
    |
    v
[1] 입력 검증
    - table_number: 필수, 양의 정수
    - password: 필수, 최소 4자
    |
    v
[2] 중복 확인
    - 동일 store_id + table_number 존재 여부
    - 중복 시 409 반환
    |
    v
[3] 테이블 생성
    - password bcrypt 해싱 (AuthService 활용)
    - TableInfo 레코드 생성
    |
    v
[4] 응답 반환
    - 201 Created
    - 생성된 Table 정보 (password 제외)
```

### 6.3 테이블 수정

```
PUT /api/stores/:storeId/tables/:id
    |
    v
[1] 테이블 조회 및 store_id 확인
    |
    v
[2] 입력 검증
    - table_number 변경 시 중복 확인
    - password 변경 시 bcrypt 해싱
    |
    v
[3] 테이블 업데이트
    |
    v
[4] 응답 반환
    - 200 OK
```

### 6.4 과거 주문 내역 조회

```
GET /api/stores/:storeId/tables/:id/history?startDate=&endDate=
    |
    v
[1] 테이블 조회 및 store_id 확인
    |
    v
[2] OrderHistory 조회
    - table_id + 날짜 범위 필터
    - 기본: 최근 90일 이내
    - startDate/endDate 파라미터로 범위 지정 가능
    - completed_at 시간 역순 정렬
    |
    v
[3] 응답 반환
    - 200 OK
    - OrderHistory[] (items_json 파싱하여 items 배열로 반환)
```

---

## 7. SSE 실시간 통신 (Server-Sent Events)

### 7.1 SSE 연결 관리

```
SSEManager (인메모리 클라이언트 풀)
    |
    +-- adminClients: Map<storeId, Set<Response>>
    |       관리자 SSE 연결 풀 (매장별)
    |
    +-- tableClients: Map<storeId:tableId, Response>
            테이블 SSE 연결 풀 (테이블별 1개)
```

### 7.2 관리자 SSE 스트림

```
GET /api/stores/:storeId/sse/admin
    |
    v
[1] 인증 확인 (Admin JWT)
    |
    v
[2] SSE 헤더 설정
    - Content-Type: text/event-stream
    - Cache-Control: no-cache
    - Connection: keep-alive
    |
    v
[3] SSEManager에 클라이언트 등록
    - adminClients[storeId].add(res)
    |
    v
[4] 연결 유지 (heartbeat 30초 간격)
    - ':heartbeat\n\n' 전송
    |
    v
[5] 연결 종료 시 클라이언트 제거
    - req.on('close') → adminClients[storeId].delete(res)
```

### 7.3 테이블 SSE 스트림

```
GET /api/stores/:storeId/sse/table/:tableId
    |
    v
[1] 인증 확인 (Table JWT)
    |
    v
[2] SSE 헤더 설정
    |
    v
[3] SSEManager에 클라이언트 등록
    - tableClients[storeId:tableId] = res
    - 기존 연결이 있으면 교체 (테이블당 1개)
    |
    v
[4] 연결 유지 (heartbeat 30초 간격)
    |
    v
[5] 연결 종료 시 클라이언트 제거
```

### 7.4 이벤트 타입 및 페이로드

| 이벤트 | 대상 | 페이로드 | 트리거 |
|---|---|---|---|
| `order:new` | Admin | Order 전체 (items 포함) | 주문 생성 |
| `order:updated` | Admin | Order 전체 (items 포함) | 주문 상태 변경 |
| `order:deleted` | Admin | { orderId, tableId } | 주문 삭제 |
| `order:statusChanged` | Table | Order 전체 (items 포함) | 주문 상태 변경 |
| `order:deleted` | Table | { orderId } | 주문 삭제 |
| `table:completed` | Admin | { tableId, sessionId } | 이용 완료 |

### 7.5 이벤트 전송 형식

```
event: order:new
data: {"order":{"order_id":1,"order_number":"20260430-001",...},"items":[...]}

event: order:updated
data: {"order":{"order_id":1,"status":"preparing",...},"items":[...]}

event: order:deleted
data: {"orderId":1,"tableId":5}

event: table:completed
data: {"tableId":5,"sessionId":12}
```

### 7.6 SSE 재연결
- EventSource 기본 자동 재연결 동작 활용
- 별도 Last-Event-ID 처리 없음
- 재연결 시 클라이언트가 필요하면 API로 최신 데이터 조회
