# Frontend Components Design - Unit 4: Frontend

## 1. 공유 컴포넌트 (Shared Components)

### 1.1 MenuCard

**용도**: 메뉴 항목을 카드 형태로 표시 (고객 메뉴 페이지, 관리자 메뉴 관리)

```typescript
interface MenuCardProps {
  menu: MenuItem;
  onClick?: (menu: MenuItem) => void;       // 카드 클릭 핸들러
  showActions?: boolean;                     // 관리자용 수정/삭제 버튼 표시
  onEdit?: (menu: MenuItem) => void;         // 수정 버튼 핸들러
  onDelete?: (menuId: number) => void;       // 삭제 버튼 핸들러
}
```

**레이아웃**: 
- 메뉴명 (Playfair Display, 골드 색상)
- 가격 (₩XX,XXX)
- 설명 (최대 2줄, 말줄임)
- 이미지 (있으면 좌측 또는 상단에 작게 표시, 보조적)
- 관리자 모드: 수정/삭제 아이콘 버튼

---

### 1.2 CategoryNav

**용도**: 카테고리 네비게이션 바 (수평 스크롤)

```typescript
interface CategoryNavProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (categoryId: number) => void;
}
```

**레이아웃**:
- 수평 스크롤 가능한 탭 바
- 선택된 카테고리: 골드 텍스트 + 골드 언더라인
- 비선택: 회색 텍스트

---

### 1.3 OrderItemRow

**용도**: 주문 목록(장바구니) 내 항목 행

```typescript
interface OrderItemRowProps {
  item: OrderListItem;
  onQuantityChange: (menuId: number, quantity: number) => void;
  onRemove: (menuId: number) => void;
}
```

**레이아웃**:
- 메뉴명 | 단가 | QuantityControl | 소계 | 삭제 버튼

---

### 1.4 QuantityControl

**용도**: 수량 증가/감소 컨트롤

```typescript
interface QuantityControlProps {
  value: number;
  min?: number;           // 기본 1
  max?: number;           // 기본 99
  onChange: (value: number) => void;
}
```

**레이아웃**:
- [-] [수량] [+] 형태
- 최소/최대 도달 시 버튼 비활성화

---

### 1.5 OrderStatusBadge

**용도**: 주문 상태 뱃지

```typescript
interface OrderStatusBadgeProps {
  status: OrderStatus;
}
```

**상태별 스타일**:
- `pending` (대기중): 골드 배경 (#C9A96E)
- `preparing` (준비중): 블루 배경 (#4A90D9)
- `completed` (완료): 그린 배경 (#4CAF50)

---

### 1.6 TableCard

**용도**: 관리자 대시보드 테이블 카드

```typescript
interface TableCardProps {
  table: Table;
  orders: Order[];
  totalAmount: number;
  isHighlighted?: boolean;          // 신규 주문 하이라이트
  onClick: (tableId: number) => void;
}
```

**레이아웃**:
- 테이블 번호 (큰 글씨)
- 총 주문액 (₩XX,XXX)
- 최신 주문 2~3개 미리보기 (메뉴명 × 수량)
- 신규 주문 시 골드 보더 애니메이션 (2초)

---

### 1.7 ConfirmDialog

**용도**: 확인/취소 다이얼로그

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;             // 기본 "확인"
  cancelText?: string;              // 기본 "취소"
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';   // danger: 삭제 등 위험 작업
}
```

**레이아웃**:
- 오버레이 배경 (반투명 블랙)
- 중앙 모달: 제목, 메시지, 확인/취소 버튼
- danger variant: 확인 버튼 빨간색

---

### 1.8 Toast

**용도**: 성공/실패/정보 피드백 토스트

```typescript
interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}
```

**동작**:
- 화면 우상단에 스택 형태로 표시
- 기본 3초 후 자동 사라짐
- 수동 닫기 가능 (X 버튼)
- success: 그린 좌측 보더
- error: 레드 좌측 보더
- info: 블루 좌측 보더

---

## 2. 커스텀 Hooks

### 2.1 useOrderList

```typescript
interface UseOrderListReturn {
  items: OrderListItem[];
  addItem: (item: Omit<OrderListItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  clearAll: () => void;
  totalPrice: number;
  totalItems: number;
}
```

**내부 로직**:
- `useState<OrderListItem[]>` + `useEffect`로 localStorage 동기화
- 초기값: localStorage에서 복원
- 모든 변경 시 localStorage에 자동 저장

### 2.2 useSSE

```typescript
interface UseSSEOptions {
  url: string;
  onEvent: (event: SSEEvent) => void;
  enabled?: boolean;                    // 기본 true
}

interface UseSSEReturn {
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}
```

**내부 로직**:
- `EventSource` API 사용
- 자동 재연결 (3초 간격, 최대 5회)
- 컴포넌트 언마운트 시 연결 해제
- `enabled` false 시 연결 안 함

### 2.3 useAuth

```typescript
interface UseAuthReturn {
  token: string | null;
  storeId: string | null;
  adminId: number | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (data: AdminLoginRequest) => Promise<void>;
  logout: () => void;
}
```

**내부 로직**:
- AuthContext를 소비하는 훅
- login: API 호출 → 토큰 저장 → Context 업데이트
- logout: 토큰 제거 → Context 초기화 → `/admin/login` 리다이렉트

### 2.4 useTableAuth

```typescript
interface UseTableAuthReturn {
  token: string | null;
  storeId: string | null;
  tableId: number | null;
  tableNumber: number | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setup: (data: TableLoginRequest) => Promise<void>;
}
```

**내부 로직**:
- 마운트 시 localStorage에서 토큰 확인 → 자동 로그인 시도
- setup: API 호출 → 토큰 + credentials 저장
- isLoading: 자동 로그인 진행 중 표시

---

## 3. API Services

### 3.1 api-client.ts

```typescript
// 기본 설정
const BASE_URL = '/api';

// 토큰 타입 (관리자 vs 테이블)
type TokenType = 'admin' | 'table';

// 핵심 함수
function getToken(type: TokenType): string | null;
function request<T>(url: string, options?: RequestInit): Promise<T>;
function get<T>(url: string): Promise<T>;
function post<T>(url: string, body?: unknown): Promise<T>;
function put<T>(url: string, body?: unknown): Promise<T>;
function del<T>(url: string): Promise<T>;
function upload<T>(url: string, formData: FormData): Promise<T>;
```

### 3.2 auth.api.ts

```typescript
function adminLogin(data: AdminLoginRequest): Promise<AdminLoginResponse>;
function tableLogin(data: TableLoginRequest): Promise<TableLoginResponse>;
```

### 3.3 menu.api.ts

```typescript
function getCategories(storeId: string): Promise<Category[]>;
function createCategory(storeId: string, data: { name: string }): Promise<Category>;
function updateCategory(storeId: string, id: number, data: { name: string }): Promise<Category>;
function deleteCategory(storeId: string, id: number): Promise<void>;
function getMenus(storeId: string): Promise<MenuItem[]>;
function getMenu(storeId: string, id: number): Promise<MenuItem>;
function createMenu(storeId: string, data: FormData): Promise<MenuItem>;
function updateMenu(storeId: string, id: number, data: FormData): Promise<MenuItem>;
function deleteMenu(storeId: string, id: number): Promise<void>;
function reorderMenus(storeId: string, data: MenuReorderRequest): Promise<void>;
```

### 3.4 order.api.ts

```typescript
function createOrder(storeId: string, data: OrderCreateRequest): Promise<OrderCreateResponse>;
function getOrdersByTable(storeId: string, tableId: number): Promise<Order[]>;
function getOrdersByStore(storeId: string): Promise<Order[]>;
function updateOrderStatus(storeId: string, orderId: number, data: OrderStatusUpdateRequest): Promise<Order>;
function deleteOrder(storeId: string, orderId: number): Promise<void>;
```

### 3.5 table.api.ts

```typescript
function getTables(storeId: string): Promise<Table[]>;
function createTable(storeId: string, data: TableCreateRequest): Promise<Table>;
function updateTable(storeId: string, id: number, data: Partial<TableCreateRequest>): Promise<Table>;
function completeTable(storeId: string, id: number): Promise<void>;
function getTableHistory(storeId: string, id: number, dateFilter?: string): Promise<OrderHistory[]>;
```

### 3.6 admin.api.ts

```typescript
function getAccounts(): Promise<AdminAccount[]>;
function createAccount(data: AdminCreateRequest): Promise<AdminAccount>;
```

---

## 4. 페이지별 컴포넌트 구성

### 4.1 CustomerMenuPage
```
CustomerMenuPage
├── Header ("Black Marble Table" + 테이블 번호)
├── CategoryNav
├── MenuCard[] (그리드)
├── MenuDetailModal (선택 시)
│   ├── 메뉴 상세 정보
│   ├── QuantityControl
│   └── "주문 목록에 추가" 버튼
└── BottomTabBar (메뉴* | 주문 목록 | 주문 내역)
```

### 4.2 CustomerOrderListPage
```
CustomerOrderListPage
├── Header ("주문 목록")
├── OrderItemRow[] (목록)
│   └── QuantityControl
├── 총 금액 표시
├── "전체 비우기" 버튼
├── "주문하기" 버튼
├── ConfirmDialog (주문 확정)
├── OrderSuccessView (주문 성공 시)
│   ├── 성공 메시지
│   ├── 주문 번호
│   └── "확인" 버튼
└── BottomTabBar (메뉴 | 주문 목록* | 주문 내역)
```

### 4.3 CustomerOrderHistoryPage
```
CustomerOrderHistoryPage
├── Header ("주문 내역")
├── Order[] (시간 역순)
│   ├── 주문 번호 + 시각
│   ├── OrderItem[] (메뉴명 × 수량)
│   ├── 주문 금액
│   └── OrderStatusBadge
└── BottomTabBar (메뉴 | 주문 목록 | 주문 내역*)
```

### 4.4 AdminLoginPage
```
AdminLoginPage
├── 로고 ("Black Marble Table")
├── 로그인 폼
│   ├── 매장 식별자 입력
│   ├── 사용자명 입력
│   ├── 비밀번호 입력
│   └── "로그인" 버튼
└── 에러 메시지 (실패 시)
```

### 4.5 AdminDashboardPage
```
AdminDashboardPage
├── AdminNavBar (대시보드* | 메뉴 관리 | 테이블 관리 | ▼ 더보기)
├── 필터 바 (테이블 필터 + 뷰 모드 토글)
├── 그리드 뷰: TableCard[] (그리드)
├── 리스트 뷰: TableRow[] (테이블)
├── TableDetailModal (카드 클릭 시)
│   ├── 테이블 번호 + 총 주문액
│   ├── Order[] (주문 목록)
│   │   ├── OrderItem[] + OrderStatusBadge
│   │   ├── 상태 변경 버튼
│   │   └── 삭제 버튼
│   ├── "이용 완료" 버튼
│   └── "과거 내역" 버튼
├── OrderHistoryModal (과거 내역 클릭 시)
│   ├── 날짜 필터
│   ├── OrderHistory[] (시간 역순)
│   └── "닫기" 버튼
├── ConfirmDialog
└── Toast
```

### 4.6 AdminMenuManagePage
```
AdminMenuManagePage
├── AdminNavBar (대시보드 | 메뉴 관리* | 테이블 관리 | ▼ 더보기)
├── CategoryNav (카테고리 탭)
├── "메뉴 추가" 버튼
├── MenuCard[] (관리자 모드: showActions=true)
├── MenuFormModal (추가/수정)
│   ├── 메뉴명 입력*
│   ├── 가격 입력*
│   ├── 설명 입력
│   ├── 카테고리 선택*
│   ├── 이미지 업로드
│   └── 저장/취소 버튼
├── ConfirmDialog (삭제 확인)
└── Toast
```

### 4.7 AdminTableManagePage
```
AdminTableManagePage
├── AdminNavBar (대시보드 | 메뉴 관리 | 테이블 관리* | ▼ 더보기)
├── "테이블 추가" 버튼
├── Table[] (테이블 목록)
│   ├── 테이블 번호 + 세션 상태 + 총 주문액
│   ├── "이용 완료" 버튼
│   ├── "과거 내역" 버튼
│   └── 주문 목록 (펼침/접힘)
├── TableFormModal (추가)
│   ├── 테이블 번호 입력
│   ├── 비밀번호 입력
│   └── 저장/취소 버튼
├── OrderHistoryModal
├── ConfirmDialog
└── Toast
```

### 4.8 AdminAccountPage
```
AdminAccountPage
├── AdminNavBar (대시보드 | 메뉴 관리 | 테이블 관리 | ▼ 더보기 > 계정 관리*)
├── "계정 추가" 버튼
├── AdminAccount[] (계정 목록)
│   └── 사용자명
├── AccountFormModal (추가)
│   ├── 사용자명 입력
│   ├── 비밀번호 입력
│   └── 저장/취소 버튼
├── ConfirmDialog
└── Toast
```

### 4.9 TableSetupPage
```
TableSetupPage
├── 로고 ("Black Marble Table")
├── 설정 폼
│   ├── 매장 식별자 입력
│   ├── 테이블 번호 입력
│   ├── 비밀번호 입력
│   └── "설정 완료" 버튼
└── 에러 메시지 (실패 시)
```
