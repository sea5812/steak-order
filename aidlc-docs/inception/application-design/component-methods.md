# 컴포넌트 메서드 정의 - Black Marble Table

> 상세 비즈니스 규칙은 Functional Design 단계에서 정의됩니다.

---

## Backend API 엔드포인트

### AuthController

| Method | Endpoint | 설명 | Auth |
|---|---|---|---|
| POST | `/api/admin/login` | 관리자 로그인 → JWT 발급 | None |
| POST | `/api/table/login` | 테이블 태블릿 로그인 → JWT 발급 | None |

### AdminController

| Method | Endpoint | 설명 | Auth |
|---|---|---|---|
| GET | `/api/admin/accounts` | 관리자 계정 목록 조회 | Admin |
| POST | `/api/admin/accounts` | 관리자 계정 생성 | Admin |

### MenuController

| Method | Endpoint | 설명 | Auth |
|---|---|---|---|
| GET | `/api/stores/:storeId/categories` | 카테고리 목록 조회 | Table/Admin |
| POST | `/api/stores/:storeId/categories` | 카테고리 생성 | Admin |
| PUT | `/api/stores/:storeId/categories/:id` | 카테고리 수정 | Admin |
| DELETE | `/api/stores/:storeId/categories/:id` | 카테고리 삭제 | Admin |
| GET | `/api/stores/:storeId/menus` | 메뉴 목록 조회 (카테고리별) | Table/Admin |
| GET | `/api/stores/:storeId/menus/:id` | 메뉴 상세 조회 | Table/Admin |
| POST | `/api/stores/:storeId/menus` | 메뉴 등록 (이미지 업로드 포함) | Admin |
| PUT | `/api/stores/:storeId/menus/:id` | 메뉴 수정 | Admin |
| DELETE | `/api/stores/:storeId/menus/:id` | 메뉴 삭제 | Admin |
| PUT | `/api/stores/:storeId/menus/reorder` | 메뉴 순서 변경 | Admin |

### OrderController

| Method | Endpoint | 설명 | Auth |
|---|---|---|---|
| POST | `/api/stores/:storeId/orders` | 주문 생성 | Table |
| GET | `/api/stores/:storeId/orders` | 주문 목록 조회 (관리자용, 필터링) | Admin |
| GET | `/api/stores/:storeId/tables/:tableId/orders` | 테이블별 현재 세션 주문 조회 | Table |
| PUT | `/api/stores/:storeId/orders/:id/status` | 주문 상태 변경 | Admin |
| DELETE | `/api/stores/:storeId/orders/:id` | 주문 삭제 | Admin |

### TableController

| Method | Endpoint | 설명 | Auth |
|---|---|---|---|
| GET | `/api/stores/:storeId/tables` | 테이블 목록 조회 | Admin |
| POST | `/api/stores/:storeId/tables` | 테이블 생성/설정 | Admin |
| PUT | `/api/stores/:storeId/tables/:id` | 테이블 수정 | Admin |
| POST | `/api/stores/:storeId/tables/:id/complete` | 테이블 이용 완료 처리 | Admin |
| GET | `/api/stores/:storeId/tables/:id/history` | 테이블 과거 주문 내역 조회 | Admin |

### SSEController

| Method | Endpoint | 설명 | Auth |
|---|---|---|---|
| GET | `/api/stores/:storeId/sse/admin` | 관리자용 SSE 스트림 (주문 업데이트) | Admin |
| GET | `/api/stores/:storeId/sse/table/:tableId` | 테이블용 SSE 스트림 (주문 상태) | Table |

---

## Backend Service 메서드

### AuthService

| 메서드 | Input | Output | 설명 |
|---|---|---|---|
| `adminLogin(storeId, username, password)` | 로그인 정보 | JWT 토큰 | 관리자 로그인 |
| `tableLogin(storeId, tableNumber, password)` | 테이블 정보 | JWT 토큰 | 테이블 태블릿 로그인 |
| `verifyToken(token)` | JWT 토큰 | 디코딩된 페이로드 | 토큰 검증 |
| `hashPassword(password)` | 평문 비밀번호 | 해시 | bcrypt 해싱 |
| `checkLoginAttempts(identifier)` | 식별자 | boolean | 로그인 시도 제한 확인 |

### OrderService

| 메서드 | Input | Output | 설명 |
|---|---|---|---|
| `createOrder(storeId, tableId, sessionId, items)` | 주문 정보 | Order | 주문 생성 |
| `getOrdersByTable(storeId, tableId, sessionId)` | 필터 | Order[] | 테이블 현재 세션 주문 조회 |
| `getOrdersByStore(storeId, filters)` | 필터 | Order[] | 매장 전체 주문 조회 |
| `updateOrderStatus(orderId, status)` | 주문ID, 상태 | Order | 주문 상태 변경 |
| `deleteOrder(orderId)` | 주문ID | void | 주문 삭제 |

### TableService

| 메서드 | Input | Output | 설명 |
|---|---|---|---|
| `createTable(storeId, tableNumber, password)` | 테이블 정보 | Table | 테이블 생성 |
| `getTablesByStore(storeId)` | 매장ID | Table[] | 테이블 목록 조회 |
| `completeTable(storeId, tableId)` | 매장ID, 테이블ID | void | 이용 완료 처리 |
| `getTableHistory(storeId, tableId, dateFilter)` | 필터 | OrderHistory[] | 과거 내역 조회 |
| `getOrCreateSession(storeId, tableId)` | 매장ID, 테이블ID | Session | 현재 세션 조회/생성 |

### MenuService

| 메서드 | Input | Output | 설명 |
|---|---|---|---|
| `getCategories(storeId)` | 매장ID | Category[] | 카테고리 목록 |
| `createCategory(storeId, data)` | 카테고리 정보 | Category | 카테고리 생성 |
| `getMenusByStore(storeId)` | 매장ID | MenuItem[] | 메뉴 목록 (카테고리 포함) |
| `createMenu(storeId, data, imageFile)` | 메뉴 정보 | MenuItem | 메뉴 등록 |
| `updateMenu(menuId, data, imageFile?)` | 메뉴 정보 | MenuItem | 메뉴 수정 |
| `deleteMenu(menuId)` | 메뉴ID | void | 메뉴 삭제 |
| `reorderMenus(storeId, menuOrders)` | 순서 정보 | void | 메뉴 순서 변경 |

### SSEService

| 메서드 | Input | Output | 설명 |
|---|---|---|---|
| `addClient(storeId, clientType, res)` | 연결 정보 | void | SSE 클라이언트 등록 |
| `removeClient(clientId)` | 클라이언트ID | void | SSE 클라이언트 제거 |
| `broadcastToAdmin(storeId, event, data)` | 이벤트 정보 | void | 관리자에게 이벤트 전송 |
| `broadcastToTable(storeId, tableId, event, data)` | 이벤트 정보 | void | 특정 테이블에 이벤트 전송 |
