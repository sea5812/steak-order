# Logical Components - Unit 4: Frontend

---

## 1. 프론트엔드 논리적 아키텍처

```
+------------------------------------------------------------------+
|                        Browser (Chrome)                           |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------+  +---------------------+                   |
|  |   Customer App     |  |    Admin App        |                   |
|  |   (Lazy Loaded)    |  |    (Lazy Loaded)    |                   |
|  +--------------------+  +---------------------+                   |
|           |                        |                               |
|  +--------------------------------------------------+             |
|  |              Shared Layer                         |             |
|  |  +------------+ +----------+ +----------------+  |             |
|  |  | Components | | Hooks    | | Contexts       |  |             |
|  |  | (8 shared) | | (4 hooks)| | (AuthContext)  |  |             |
|  |  +------------+ +----------+ +----------------+  |             |
|  +--------------------------------------------------+             |
|           |                                                        |
|  +--------------------------------------------------+             |
|  |              Service Layer                        |             |
|  |  +------------+ +----------+ +----------------+  |             |
|  |  | API Client | | API Svcs | | SSE Client     |  |             |
|  |  | (fetch)    | | (6 svcs) | | (EventSource)  |  |             |
|  |  +------------+ +----------+ +----------------+  |             |
|  +--------------------------------------------------+             |
|           |                        |                               |
|  +--------------------------------------------------+             |
|  |              Storage Layer                        |             |
|  |  +------------------+ +---------------------+    |             |
|  |  | localStorage     | | Session Memory      |    |             |
|  |  | - orderList      | | - useState          |    |             |
|  |  | - adminToken     | | - useReducer        |    |             |
|  |  | - tableToken     | |                     |    |             |
|  |  | - tableCredentials|                      |    |             |
|  |  | - tableInfo      | |                     |    |             |
|  |  +------------------+ +---------------------+    |             |
|  +--------------------------------------------------+             |
|                                                                    |
+------------------------------------------------------------------+
         |                              |
    REST API (fetch)              SSE (EventSource)
         |                              |
+------------------------------------------------------------------+
|                   Backend (Express)                                |
+------------------------------------------------------------------+
```

---

## 2. 컴포넌트 계층 구조

### 2.1 Customer App

```
App
├── ErrorBoundary
├── AuthContext.Provider
├── Suspense (Loading Spinner)
└── Routes
    ├── CustomerRoute (인증 가드)
    │   ├── CustomerMenuPage
    │   │   ├── Header
    │   │   ├── CategoryNav
    │   │   ├── MenuCard[] (Grid)
    │   │   ├── MenuDetailModal
    │   │   │   ├── QuantityControl
    │   │   │   └── AddToOrderButton
    │   │   └── BottomTabBar
    │   ├── CustomerOrderListPage
    │   │   ├── Header
    │   │   ├── OrderItemRow[]
    │   │   │   └── QuantityControl
    │   │   ├── TotalSection
    │   │   ├── OrderButton
    │   │   ├── ConfirmDialog
    │   │   ├── OrderSuccessView
    │   │   └── BottomTabBar
    │   └── CustomerOrderHistoryPage
    │       ├── Header
    │       ├── OrderCard[]
    │       │   ├── OrderStatusBadge
    │       │   └── OrderItemList
    │       └── BottomTabBar
    └── TableSetupPage
        └── SetupForm
```

### 2.2 Admin App

```
App
├── ErrorBoundary
├── AuthContext.Provider
├── Suspense (Loading Spinner)
└── Routes
    ├── AdminLoginPage
    │   └── LoginForm
    └── AdminRoute (인증 가드)
        ├── AdminNavBar
        ├── AdminDashboardPage
        │   ├── FilterBar (테이블 필터 + 뷰 토글)
        │   ├── GridView: TableCard[]
        │   ├── ListView: TableRow[]
        │   ├── TableDetailModal
        │   │   ├── OrderCard[]
        │   │   │   ├── OrderStatusBadge
        │   │   │   └── StatusChangeButtons
        │   │   ├── CompleteButton
        │   │   └── HistoryButton
        │   ├── OrderHistoryModal
        │   ├── ConfirmDialog
        │   └── Toast
        ├── AdminMenuManagePage
        │   ├── CategoryNav
        │   ├── MenuCard[] (관리자 모드)
        │   ├── MenuFormModal
        │   ├── ConfirmDialog
        │   └── Toast
        ├── AdminTableManagePage
        │   ├── TableList
        │   ├── TableFormModal
        │   ├── OrderHistoryModal
        │   ├── ConfirmDialog
        │   └── Toast
        └── AdminAccountPage
            ├── AccountList
            ├── AccountFormModal
            ├── ConfirmDialog
            └── Toast
```

---

## 3. 데이터 흐름

### 3.1 고객 주문 플로우

```
MenuPage                OrderListPage           OrderHistoryPage
   |                         |                        |
   | addItem()               | createOrder()          | useSSE()
   v                         v                        v
useOrderList ──────> localStorage ──────> API ──────> SSE
(클라이언트 상태)    (영속 저장)      (서버 전송)   (실시간 수신)
```

### 3.2 관리자 대시보드 플로우

```
DashboardPage
   |
   ├── 초기 로드: GET /tables + GET /orders
   │   └── 테이블별 주문 그룹화 → TableCard[] 렌더링
   |
   ├── SSE 수신: order:new
   │   └── 해당 테이블 orders 배열에 추가 → 카드 하이라이트
   |
   ├── SSE 수신: order:updated
   │   └── 해당 주문 상태 업데이트 → OrderStatusBadge 변경
   |
   ├── 상태 변경: PUT /orders/:id/status
   │   └── 로컬 상태 업데이트 (서버 응답 후)
   |
   └── 이용 완료: POST /tables/:id/complete
       └── 해당 테이블 주문 리셋 → 카드 초기화
```

### 3.3 인증 플로우

```
앱 시작
   |
   ├── 고객 라우트 접근
   │   └── useTableAuth
   │       ├── localStorage.tableToken 확인
   │       ├── 유효 → 인증 완료
   │       ├── 만료 → 자동 재로그인 (저장된 credentials)
   │       └── 없음 → /setup 리다이렉트
   |
   └── 관리자 라우트 접근
       └── useAuth (AuthContext)
           ├── localStorage.adminToken 확인
           ├── 유효 → 인증 완료
           └── 없음/만료 → /admin/login 리다이렉트
```

---

## 4. NFR 패턴 적용 매핑

| NFR ID | 패턴 | 적용 위치 |
|---|---|---|
| NFR-FE-01 | Route-Based Code Splitting | App.tsx (React.lazy) |
| NFR-FE-02 | Loading State Pattern | 모든 페이지 컴포넌트 |
| NFR-FE-03 | SSE Auto-Reconnect | useSSE 훅 |
| NFR-FE-04 | Code Splitting + Tree Shaking | Vite 빌드 설정 |
| NFR-FE-05 | Responsive Grid System | CSS Modules (media queries) |
| NFR-FE-06 | Touch-Friendly Sizing | CSS Variables (--touch-min) |
| NFR-FE-07 | Semantic HTML + ARIA | 모든 컴포넌트 |
| NFR-FE-08 | ES2020 Target | Vite/TypeScript 설정 |
| NFR-FE-09 | Error Boundary + API Error Handler | ErrorBoundary, api-client |
| NFR-FE-10 | SSE Auto-Reconnect | useSSE 훅 |
| NFR-FE-11 | localStorage Sync Hook | useOrderList, useAuth, useTableAuth |
| NFR-FE-12 | Image Lazy Loading | MenuCard (loading="lazy") |
| NFR-FE-13 | Feature-Based Directory | 프로젝트 구조 |
| NFR-FE-14 | Vitest + RTL | 테스트 설정 (Code Gen 시) |
