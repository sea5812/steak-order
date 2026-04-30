# NFR Design Patterns - Unit 4: Frontend

---

## 1. 성능 패턴

### Pattern 1: Route-Based Code Splitting
**적용 NFR**: NFR-FE-01 (페이지 로딩), NFR-FE-04 (번들 사이즈)

```typescript
// App.tsx — React.lazy로 라우트별 코드 스플리팅
const CustomerMenuPage = lazy(() => import('./pages/customer/MenuPage'));
const CustomerOrderListPage = lazy(() => import('./pages/customer/OrderListPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
// ...

// Suspense로 로딩 상태 처리
<Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

**효과**: 초기 번들에 현재 라우트 코드만 포함. 고객이 관리자 코드를 다운로드하지 않음.

### Pattern 2: Image Lazy Loading
**적용 NFR**: NFR-FE-12 (이미지 로딩)

```typescript
// MenuCard 컴포넌트 내
<img
  src={menu.imageUrl || '/placeholder-menu.svg'}
  alt={menu.name}
  loading="lazy"
  onError={(e) => { e.currentTarget.src = '/placeholder-menu.svg'; }}
/>
```

**효과**: 뷰포트 밖 이미지 지연 로딩, 로드 실패 시 플레이스홀더 표시.

### Pattern 3: API Request with Loading State
**적용 NFR**: NFR-FE-02 (API 응답 처리)

```typescript
// 페이지 컴포넌트 내 공통 패턴
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setIsLoading(true);
  apiCall()
    .then(setData)
    .catch((err) => setError(err.message))
    .finally(() => setIsLoading(false));
}, []);

// 렌더링
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
return <DataView data={data} />;
```

---

## 2. 신뢰성 패턴

### Pattern 4: Error Boundary
**적용 NFR**: NFR-FE-09 (에러 핸들링)

```typescript
// ErrorBoundary 컴포넌트 — 페이지 레벨 적용
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

// 적용 위치: 각 라우트를 ErrorBoundary로 감싸기
<ErrorBoundary>
  <CustomerMenuPage />
</ErrorBoundary>
```

### Pattern 5: SSE Auto-Reconnect
**적용 NFR**: NFR-FE-03 (SSE 성능), NFR-FE-10 (SSE 연결 복구)

```typescript
// useSSE 훅 내부 로직
function useSSE({ url, onEvent, enabled = true }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 3000; // 3초

  function connect() {
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      retryCount.current = 0;
    };
    
    eventSource.onmessage = (event) => {
      onEvent(JSON.parse(event.data));
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      setIsConnected(false);
      
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        setTimeout(connect, RETRY_INTERVAL);
      } else {
        setError('연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
      }
    };
    
    return eventSource;
  }
  // cleanup on unmount
}
```

### Pattern 6: Centralized API Error Handling
**적용 NFR**: NFR-FE-09 (에러 핸들링)

```typescript
// api-client.ts 내부
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    // 인증 만료 → 자동 로그아웃
    localStorage.removeItem('adminToken');
    localStorage.removeItem('tableToken');
    window.location.href = '/admin/login';
    throw new Error('인증이 만료되었습니다.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '요청 처리 중 오류가 발생했습니다.');
  }

  return response.json();
}
```

---

## 3. 사용성 패턴

### Pattern 7: Responsive Grid System
**적용 NFR**: NFR-FE-05 (반응형 디자인)

```css
/* 브레이크포인트 CSS Variables */
:root {
  --bp-mobile: 320px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}

/* 메뉴 카드 그리드 — 모바일 퍼스트 */
.menuGrid {
  display: grid;
  grid-template-columns: 1fr;                    /* 모바일: 1열 */
  gap: 16px;
  padding: 16px;
}

@media (min-width: 768px) {
  .menuGrid {
    grid-template-columns: repeat(2, 1fr);       /* 태블릿: 2열 */
  }
}

@media (min-width: 1024px) {
  .menuGrid {
    grid-template-columns: repeat(3, 1fr);       /* 데스크톱: 3열 */
  }
}

/* 대시보드 테이블 카드 그리드 */
.dashboardGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);         /* 태블릿: 2열 */
  gap: 16px;
}

@media (min-width: 1024px) {
  .dashboardGrid {
    grid-template-columns: repeat(3, 1fr);       /* 데스크톱: 3열 */
  }
}

@media (min-width: 1280px) {
  .dashboardGrid {
    grid-template-columns: repeat(4, 1fr);       /* 와이드: 4열 */
  }
}
```

### Pattern 8: Black Marble Theme System
**적용 NFR**: NFR-FE-05 (사용성), 브랜딩 요구사항

```css
/* theme.css — CSS Variables */
:root {
  /* 배경 */
  --color-bg-primary: #0A0A0A;        /* 제트블랙 메인 배경 */
  --color-bg-secondary: #1A1A1A;      /* 카드/섹션 배경 */
  --color-bg-tertiary: #2A2A2A;       /* 입력 필드/호버 배경 */
  --color-bg-overlay: rgba(0, 0, 0, 0.7);  /* 모달 오버레이 */

  /* 텍스트 */
  --color-text-primary: #FFFFFF;       /* 메인 텍스트 */
  --color-text-secondary: #B0B0B0;     /* 보조 텍스트 */
  --color-text-muted: #707070;         /* 비활성 텍스트 */

  /* 포인트 */
  --color-accent: #C9A96E;            /* 골드 포인트 */
  --color-accent-hover: #D4B87A;      /* 골드 호버 */
  --color-accent-muted: rgba(201, 169, 110, 0.2);  /* 골드 배경 */

  /* 상태 */
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-info: #4A90D9;

  /* 보더 */
  --color-border: #333333;
  --color-border-hover: #555555;

  /* 폰트 */
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', -apple-system, sans-serif;

  /* 사이즈 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --touch-min: 44px;                   /* 최소 터치 영역 */

  /* 그림자 */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.5);

  /* 트랜지션 */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
}
```

---

## 4. 데이터 영속성 패턴

### Pattern 9: localStorage Sync Hook
**적용 NFR**: NFR-FE-11 (데이터 영속성)

```typescript
// useOrderList 내부 — localStorage 동기화 패턴
function useOrderList() {
  const [items, setItems] = useState<OrderListItem[]>(() => {
    // 초기값: localStorage에서 복원
    const saved = localStorage.getItem('orderList');
    return saved ? JSON.parse(saved) : [];
  });

  // items 변경 시 자동 저장
  useEffect(() => {
    localStorage.setItem('orderList', JSON.stringify(items));
  }, [items]);

  // ... addItem, removeItem, updateQuantity, clearAll
}
```

---

## 5. 인증 가드 패턴

### Pattern 10: Route Protection
**적용 NFR**: BR-AUTH-03 (라우트 보호)

```typescript
// ProtectedRoute 컴포넌트
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useTableAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}
```
