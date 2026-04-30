# 컴포넌트 정의 - Black Marble Table (테이블오더)

## 모노레포 구조

```
black-marble-table/
├── packages/
│   ├── backend/          # Express + TypeScript 서버
│   │   ├── src/
│   │   │   ├── controllers/    # API 엔드포인트 핸들러
│   │   │   ├── services/       # 비즈니스 로직
│   │   │   ├── repositories/   # 데이터 접근 레이어
│   │   │   ├── middleware/     # 인증, 에러 핸들링
│   │   │   ├── sse/            # SSE 이벤트 관리
│   │   │   ├── db/             # Drizzle 스키마, 마이그레이션, 시드
│   │   │   ├── types/          # 공유 타입 정의
│   │   │   └── index.ts        # 서버 엔트리포인트
│   │   └── package.json
│   └── frontend/         # React + TypeScript 클라이언트
│       ├── src/
│       │   ├── pages/          # 페이지 컴포넌트
│       │   ├── components/     # 재사용 UI 컴포넌트
│       │   ├── hooks/          # 커스텀 React 훅
│       │   ├── services/       # API 호출 레이어
│       │   ├── stores/         # 상태 관리 (장바구니 등)
│       │   ├── types/          # 타입 정의
│       │   └── styles/         # 글로벌 스타일, 테마
│       └── package.json
├── package.json          # 워크스페이스 루트
└── tsconfig.base.json    # 공유 TypeScript 설정
```

---

## Backend 컴포넌트

### Controllers (API 엔드포인트 핸들러)

| 컴포넌트 | 책임 | 관련 스토리 |
|---|---|---|
| **AuthController** | 관리자 로그인, 테이블 태블릿 인증 | US-A01, US-C01 |
| **AdminController** | 관리자 계정 CRUD | US-A02 |
| **MenuController** | 메뉴/카테고리 CRUD, 조회 | US-A05, US-C02 |
| **OrderController** | 주문 생성, 조회, 상태 변경, 삭제 | US-C04, US-C05, US-A03 |
| **TableController** | 테이블 설정, 세션 관리, 이용 완료 | US-A04 |
| **SSEController** | SSE 연결 관리, 이벤트 스트리밍 | US-A03, US-C05 |

### Services (비즈니스 로직)

| 컴포넌트 | 책임 |
|---|---|
| **AuthService** | JWT 발급/검증, 비밀번호 해싱/검증, 로그인 시도 제한 |
| **AdminService** | 관리자 계정 생성, 조회 |
| **MenuService** | 메뉴/카테고리 CRUD, 순서 조정, 이미지 처리 |
| **OrderService** | 주문 생성, 상태 변경, 삭제, 총액 계산 |
| **TableService** | 테이블 설정, 세션 시작/종료, 이용 완료 처리 |
| **SSEService** | SSE 클라이언트 관리, 이벤트 브로드캐스트 |

### Repositories (데이터 접근)

| 컴포넌트 | 책임 |
|---|---|
| **StoreRepository** | 매장 정보 조회 |
| **AdminRepository** | 관리자 계정 CRUD |
| **MenuRepository** | 메뉴/카테고리 CRUD |
| **OrderRepository** | 주문/주문항목 CRUD, 이력 관리 |
| **TableRepository** | 테이블/세션 CRUD |

### Middleware

| 컴포넌트 | 책임 |
|---|---|
| **authMiddleware** | JWT 토큰 검증 (관리자 API 보호) |
| **tableAuthMiddleware** | 테이블 태블릿 인증 검증 (고객 API 보호) |
| **errorHandler** | 글로벌 에러 핸들링 |

### SSE

| 컴포넌트 | 책임 |
|---|---|
| **SSEManager** | SSE 연결 풀 관리, 매장별 이벤트 브로드캐스트 |

---

## Frontend 컴포넌트

### Pages (페이지)

| 컴포넌트 | 책임 | 사용자 |
|---|---|---|
| **CustomerMenuPage** | 메뉴 조회/탐색, 주문 목록 추가 | 고객 |
| **CustomerOrderListPage** | 주문 목록(장바구니) 확인, 주문 확정 | 고객 |
| **CustomerOrderHistoryPage** | 주문 내역 조회, 실시간 상태 | 고객 |
| **AdminLoginPage** | 관리자 로그인 | 관리자 |
| **AdminDashboardPage** | 실시간 주문 모니터링 대시보드 | 관리자 |
| **AdminMenuManagePage** | 메뉴 CRUD 관리 | 관리자 |
| **AdminTableManagePage** | 테이블 설정, 세션 관리 | 관리자 |
| **AdminAccountPage** | 관리자 계정 관리 | 관리자 |
| **TableSetupPage** | 태블릿 초기 설정 (관리자가 1회 수행) | 관리자 |

### Shared Components (재사용 UI)

| 컴포넌트 | 책임 |
|---|---|
| **MenuCard** | 메뉴 항목 카드 (Black Marble 다크 테마) |
| **CategoryNav** | 카테고리 네비게이션 바 |
| **OrderItemRow** | 주문 목록 내 항목 행 |
| **QuantityControl** | 수량 증가/감소 컨트롤 |
| **OrderStatusBadge** | 주문 상태 뱃지 (대기중/준비중/완료) |
| **TableCard** | 관리자 대시보드 테이블 카드 |
| **ConfirmDialog** | 확인 팝업 다이얼로그 |
| **Toast** | 성공/실패 피드백 토스트 |

### Hooks (커스텀 훅)

| 컴포넌트 | 책임 |
|---|---|
| **useOrderList** | 주문 목록(장바구니) 상태 관리 (localStorage 연동) |
| **useSSE** | SSE 연결 및 이벤트 수신 |
| **useAuth** | 인증 상태 관리 (JWT 토큰) |
| **useTableAuth** | 테이블 태블릿 자동 인증 |

### Services (API 호출)

| 컴포넌트 | 책임 |
|---|---|
| **apiClient** | Axios/fetch 기반 HTTP 클라이언트 (JWT 자동 첨부) |
| **authApi** | 인증 관련 API 호출 |
| **menuApi** | 메뉴 관련 API 호출 |
| **orderApi** | 주문 관련 API 호출 |
| **tableApi** | 테이블 관련 API 호출 |
| **adminApi** | 관리자 관련 API 호출 |
