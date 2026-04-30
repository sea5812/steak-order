# Unit of Work 정의 - Black Marble Table

## 분해 전략
- **아키텍처**: 모놀리식 모노레포 (`black-marble-table/`)
- **분해 기준**: 기능 도메인 × 팀원 수 (4명)
- **유닛 유형**: Module (논리적 그룹)

---

## Unit 1: Foundation (공통 기반 + 인증)

**담당**: 팀원 A  
**범위**: 프로젝트 초기 설정, DB 스키마, 인증 시스템, 관리자 계정 관리

### 포함 컴포넌트
**Backend:**
- 프로젝트 구조 생성 (모노레포, tsconfig, package.json)
- Drizzle ORM 스키마 전체 (모든 테이블)
- DB 마이그레이션 및 시드 데이터
- AuthController, AuthService
- AdminController, AdminService
- authMiddleware, tableAuthMiddleware
- errorHandler (글로벌 에러 핸들링)
- Express 서버 엔트리포인트 (index.ts)
- StoreRepository, AdminRepository

### 산출물
```
packages/backend/src/
├── index.ts                    # 서버 엔트리포인트
├── db/
│   ├── schema.ts               # 전체 Drizzle 스키마
│   ├── index.ts                # DB 연결
│   ├── migrate.ts              # 마이그레이션
│   └── seed.ts                 # 시드 데이터 (Black Marble 메뉴)
├── middleware/
│   ├── auth.ts                 # JWT 인증 미들웨어
│   └── error-handler.ts        # 글로벌 에러 핸들러
├── controllers/
│   ├── auth.controller.ts
│   └── admin.controller.ts
├── services/
│   ├── auth.service.ts
│   └── admin.service.ts
├── repositories/
│   ├── store.repository.ts
│   └── admin.repository.ts
└── types/
    └── index.ts                # 공유 타입 정의
```

---

## Unit 2: Menu Domain (메뉴 관리)

**담당**: 팀원 B  
**범위**: 메뉴/카테고리 CRUD, 이미지 업로드, 메뉴 순서 관리

### 포함 컴포넌트
**Backend:**
- MenuController
- MenuService
- MenuRepository
- 이미지 업로드 처리 (multer)

### 산출물
```
packages/backend/src/
├── controllers/
│   └── menu.controller.ts
├── services/
│   └── menu.service.ts
├── repositories/
│   └── menu.repository.ts
└── uploads/                    # 이미지 저장 디렉토리
```

---

## Unit 3: Order Domain (주문 + SSE 실시간)

**담당**: 팀원 C  
**범위**: 주문 생성/조회/상태변경/삭제, 테이블 관리, SSE 실시간 통신, 이용 완료

### 포함 컴포넌트
**Backend:**
- OrderController
- OrderService
- OrderRepository
- TableController
- TableService
- TableRepository
- SSEController
- SSEService (SSEManager)

### 산출물
```
packages/backend/src/
├── controllers/
│   ├── order.controller.ts
│   ├── table.controller.ts
│   └── sse.controller.ts
├── services/
│   ├── order.service.ts
│   ├── table.service.ts
│   └── sse.service.ts
├── repositories/
│   ├── order.repository.ts
│   └── table.repository.ts
└── sse/
    └── sse-manager.ts          # SSE 연결 풀 관리
```

---

## Unit 4: Frontend (프론트엔드 UI)

**담당**: 팀원 D  
**범위**: 전체 React 프론트엔드 (고객 UI + 관리자 UI)

### 포함 컴포넌트
**Frontend:**
- 모든 Pages (9개)
- 모든 Shared Components (8개)
- 모든 Hooks (4개)
- 모든 API Services (6개)
- 스타일/테마 (Black Marble 다크 테마)
- React Router 설정

### 산출물
```
packages/frontend/src/
├── pages/
│   ├── customer/
│   │   ├── MenuPage.tsx
│   │   ├── OrderListPage.tsx
│   │   └── OrderHistoryPage.tsx
│   ├── admin/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── MenuManagePage.tsx
│   │   ├── TableManagePage.tsx
│   │   └── AccountPage.tsx
│   └── setup/
│       └── TableSetupPage.tsx
├── components/
│   ├── MenuCard.tsx
│   ├── CategoryNav.tsx
│   ├── OrderItemRow.tsx
│   ├── QuantityControl.tsx
│   ├── OrderStatusBadge.tsx
│   ├── TableCard.tsx
│   ├── ConfirmDialog.tsx
│   └── Toast.tsx
├── hooks/
│   ├── useOrderList.ts
│   ├── useSSE.ts
│   ├── useAuth.ts
│   └── useTableAuth.ts
├── services/
│   ├── api-client.ts
│   ├── auth.api.ts
│   ├── menu.api.ts
│   ├── order.api.ts
│   ├── table.api.ts
│   └── admin.api.ts
├── styles/
│   ├── theme.ts                # Black Marble 테마 변수
│   └── global.css
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

---

## 코드 조직 전략

```
black-marble-table/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   ├── tests/              # 단위 테스트
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── package.json                # 워크스페이스 루트
├── tsconfig.base.json
├── .gitignore
└── README.md
```
