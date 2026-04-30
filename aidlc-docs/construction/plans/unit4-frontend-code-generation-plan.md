# Code Generation Plan - Unit 4: Frontend

## Unit Context
- **Unit**: Unit 4 - Frontend (전체 React 프론트엔드)
- **담당**: 팀원 D (Frontend Lead)
- **브랜치**: feature/unit4-frontend
- **코드 위치**: `black-marble-table/packages/frontend/`
- **Stories**: US-C01~C05, US-A01~A05 (전체 10개 스토리의 UI 구현)

## Dependencies
- **Unit 1 (Foundation)**: API 타입 정의 참조 (Mock 데이터로 독립 개발)
- **Unit 2 (Menu)**: 메뉴 API 엔드포인트 (Mock 데이터로 독립 개발)
- **Unit 3 (Order)**: 주문/SSE API 엔드포인트 (Mock 데이터로 독립 개발)

## 기술 스택
- React 18 + TypeScript 5 + Vite 5
- CSS Modules + CSS Variables (Black Marble 테마)
- React Router 6 + React Context
- Fetch API + EventSource (SSE)
- Vitest + React Testing Library (단위 테스트)

---

## Generation Steps

### Step 1: 프로젝트 구조 및 설정
- [ ] 1.1 Vite + React + TypeScript 프로젝트 초기화 (package.json, vite.config.ts, tsconfig.json)
- [ ] 1.2 디렉토리 구조 생성 (pages, components, hooks, services, contexts, types, styles)
- [ ] 1.3 글로벌 스타일 및 Black Marble 테마 (theme.css, global.css)
- [x] 1.1 Vite + React + TypeScript 프로젝트 초기화 (package.json, vite.config.ts, tsconfig.json)
- [x] 1.2 디렉토리 구조 생성 (pages, components, hooks, services, contexts, types, styles)
- [x] 1.3 글로벌 스타일 및 Black Marble 테마 (theme.css, global.css)
- [x] 1.4 Google Fonts 설정 (Playfair Display, Inter)
- [x] 1.5 main.tsx + App.tsx (라우팅, Suspense, ErrorBoundary)

### Step 2: 타입 정의 및 API 클라이언트
- [x] 2.1 공유 타입 정의 (types/index.ts)
- [x] 2.2 API 클라이언트 (services/api-client.ts)
- [x] 2.3 Auth API (services/auth.api.ts)
- [x] 2.4 Menu API (services/menu.api.ts)
- [x] 2.5 Order API (services/order.api.ts)
- [x] 2.6 Table API (services/table.api.ts)
- [x] 2.7 Admin API (services/admin.api.ts)

### Step 3: Contexts 및 Hooks
- [x] 3.1 AuthContext (contexts/AuthContext.tsx) — US-A01
- [x] 3.2 useAuth 훅 (hooks/useAuth.ts) — US-A01
- [x] 3.3 useTableAuth 훅 (hooks/useTableAuth.ts) — US-C01
- [x] 3.4 useOrderList 훅 (hooks/useOrderList.ts) — US-C03
- [x] 3.5 useSSE 훅 (hooks/useSSE.ts) — US-C05, US-A03

### Step 4: 공유 컴포넌트
- [x] 4.1 MenuCard (components/MenuCard.tsx + .module.css)
- [x] 4.2 CategoryNav (components/CategoryNav.tsx + .module.css)
- [x] 4.3 OrderItemRow (components/OrderItemRow.tsx + .module.css)
- [x] 4.4 QuantityControl (components/QuantityControl.tsx + .module.css)
- [x] 4.5 OrderStatusBadge (components/OrderStatusBadge.tsx + .module.css)
- [x] 4.6 TableCard (components/TableCard.tsx + .module.css)
- [x] 4.7 ConfirmDialog (components/ConfirmDialog.tsx + .module.css)
- [x] 4.8 Toast (components/Toast.tsx + .module.css)

### Step 5: 고객 페이지
- [x] 5.1 CustomerMenuPage (pages/customer/MenuPage.tsx + .module.css) — US-C02, US-C03
- [x] 5.2 CustomerOrderListPage (pages/customer/OrderListPage.tsx + .module.css) — US-C03, US-C04
- [x] 5.3 CustomerOrderHistoryPage (pages/customer/OrderHistoryPage.tsx + .module.css) — US-C05

### Step 6: 관리자 페이지
- [x] 6.1 AdminLoginPage (pages/admin/LoginPage.tsx + .module.css) — US-A01
- [x] 6.2 AdminDashboardPage (pages/admin/DashboardPage.tsx + .module.css) — US-A03, US-A04
- [x] 6.3 AdminMenuManagePage (pages/admin/MenuManagePage.tsx + .module.css) — US-A05
- [x] 6.4 AdminTableManagePage (pages/admin/TableManagePage.tsx + .module.css) — US-A04
- [x] 6.5 AdminAccountPage (pages/admin/AccountPage.tsx + .module.css) — US-A02

### Step 7: 설정 페이지
- [x] 7.1 TableSetupPage (pages/setup/TableSetupPage.tsx + .module.css) — US-C01

### Step 8: 단위 테스트
- [x] 8.1 Vitest 설정 (vitest.config.ts, setup 파일)
- [x] 8.2 useOrderList 훅 테스트
- [x] 8.3 useAuth 훅 테스트
- [x] 8.4 공유 컴포넌트 테스트 (MenuCard, QuantityControl, OrderStatusBadge, ConfirmDialog, Toast)
- [x] 8.5 API 클라이언트 테스트

### Step 9: 문서 및 요약
- [x] 9.1 Code Generation Summary (aidlc-docs/construction/unit4-frontend/code/code-summary.md)

---

## Story Traceability

| Story | 구현 Step | 상태 |
|---|---|---|
| US-C01 (자동 로그인) | 3.3, 7.1 | [x] |
| US-C02 (메뉴 조회) | 4.1, 4.2, 5.1 | [x] |
| US-C03 (주문 목록) | 3.4, 4.3, 4.4, 5.1, 5.2 | [x] |
| US-C04 (주문 생성) | 5.2 | [x] |
| US-C05 (주문 내역) | 3.5, 4.5, 5.3 | [x] |
| US-A01 (매장 인증) | 3.1, 3.2, 6.1 | [x] |
| US-A02 (계정 관리) | 6.5 | [x] |
| US-A03 (주문 모니터링) | 3.5, 4.6, 6.2 | [x] |
| US-A04 (테이블 관리) | 6.2, 6.4 | [x] |
| US-A05 (메뉴 관리) | 6.3 | [x] |
| US-C02 (메뉴 조회) | 4.1, 4.2, 5.1 | [ ] |
| US-C03 (주문 목록) | 3.4, 4.3, 4.4, 5.1, 5.2 | [ ] |
| US-C04 (주문 생성) | 5.2 | [ ] |
| US-C05 (주문 내역) | 3.5, 4.5, 5.3 | [ ] |
| US-A01 (매장 인증) | 3.1, 3.2, 6.1 | [ ] |
| US-A02 (계정 관리) | 6.5 | [ ] |
| US-A03 (주문 모니터링) | 3.5, 4.6, 6.2 | [ ] |
| US-A04 (테이블 관리) | 6.2, 6.4 | [ ] |
| US-A05 (메뉴 관리) | 6.3 | [ ] |
