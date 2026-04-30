# Business Logic Model - Unit 4: Frontend

## 1. 프론트엔드 아키텍처

### 1.1 프로젝트 구조
```
packages/frontend/src/
├── pages/
│   ├── customer/
│   │   ├── MenuPage.tsx                # 메뉴 조회/탐색
│   │   ├── MenuPage.module.css
│   │   ├── OrderListPage.tsx           # 주문 목록(장바구니) + 주문 확정
│   │   ├── OrderListPage.module.css
│   │   ├── OrderHistoryPage.tsx        # 주문 내역 조회
│   │   └── OrderHistoryPage.module.css
│   ├── admin/
│   │   ├── LoginPage.tsx               # 관리자 로그인
│   │   ├── LoginPage.module.css
│   │   ├── DashboardPage.tsx           # 실시간 주문 모니터링
│   │   ├── DashboardPage.module.css
│   │   ├── MenuManagePage.tsx          # 메뉴 CRUD
│   │   ├── MenuManagePage.module.css
│   │   ├── TableManagePage.tsx         # 테이블 관리
│   │   ├── TableManagePage.module.css
│   │   ├── AccountPage.tsx             # 계정 관리
│   │   └── AccountPage.module.css
│   └── setup/
│       ├── TableSetupPage.tsx          # 태블릿 초기 설정
│       └── TableSetupPage.module.css
├── components/
│   ├── MenuCard.tsx
│   ├── MenuCard.module.css
│   ├── CategoryNav.tsx
│   ├── CategoryNav.module.css
│   ├── OrderItemRow.tsx
│   ├── OrderItemRow.module.css
│   ├── QuantityControl.tsx
│   ├── QuantityControl.module.css
│   ├── OrderStatusBadge.tsx
│   ├── OrderStatusBadge.module.css
│   ├── TableCard.tsx
│   ├── TableCard.module.css
│   ├── ConfirmDialog.tsx
│   ├── ConfirmDialog.module.css
│   ├── Toast.tsx
│   └── Toast.module.css
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
├── contexts/
│   └── AuthContext.tsx
├── types/
│   └── index.ts
├── styles/
│   ├── theme.css                       # CSS 변수 (Black Marble 테마)
│   └── global.css                      # 글로벌 리셋 + 기본 스타일
├── App.tsx
└── main.tsx
```

### 1.2 라우팅 구조

```
/                           → CustomerMenuPage (자동 로그인 후)
/order-list                 → CustomerOrderListPage
/orders                     → CustomerOrderHistoryPage
/setup                      → TableSetupPage
/admin/login                → AdminLoginPage
/admin/dashboard            → AdminDashboardPage (인증 필요)
/admin/menus                → AdminMenuManagePage (인증 필요)
/admin/tables               → AdminTableManagePage (인증 필요)
/admin/accounts             → AdminAccountPage (인증 필요)
```

**인증 가드:**
- 고객 라우트 (`/`, `/order-list`, `/orders`): `useTableAuth`로 자동 로그인 확인. 실패 시 `/setup`으로 리다이렉트
- 관리자 라우트 (`/admin/*` except `/admin/login`): `useAuth`로 JWT 확인. 실패 시 `/admin/login`으로 리다이렉트
- `/setup`: 인증 불필요 (초기 설정 페이지)

### 1.3 상태 관리 전략

| 상태 유형 | 관리 방식 | 설명 |
|---|---|---|
| 인증 상태 (관리자) | React Context (AuthContext) | JWT 토큰, 로그인 상태, storeId |
| 테이블 인증 상태 | localStorage + useTableAuth | 테이블 JWT, storeId, tableId |
| 주문 목록 (장바구니) | localStorage + useOrderList | 메뉴 항목, 수량, 총액 |
| 페이지 로컬 상태 | useState / useReducer | 폼 입력, 로딩, 에러, 모달 |
| 실시간 데이터 | useSSE + useState | SSE 이벤트 수신 후 상태 업데이트 |

### 1.4 API 클라이언트 설계

```typescript
// api-client.ts 핵심 로직
const apiClient = {
  // 기본 fetch 래퍼
  request(url, options) {
    // 1. JWT 토큰 자동 첨부 (Authorization: Bearer <token>)
    // 2. Content-Type: application/json 기본 설정
    // 3. 응답 상태 코드 확인
    // 4. 401 응답 시 토큰 제거 + 로그인 페이지 리다이렉트
    // 5. 에러 응답 시 표준 에러 객체 반환
  },
  get(url),
  post(url, body),
  put(url, body),
  delete(url),
  upload(url, formData)  // multipart/form-data (이미지 업로드)
}
```

---

## 2. 고객 UI 비즈니스 로직

### 2.1 자동 로그인 플로우 (useTableAuth)

```
앱 시작
  │
  ├─ localStorage에서 tableToken 확인
  │   ├─ 있음 → JWT 만료 확인
  │   │   ├─ 유효 → 인증 완료, 메뉴 페이지 표시
  │   │   └─ 만료 → localStorage에서 storeId, tableNumber, password 확인
  │   │       ├─ 있음 → 자동 재로그인 시도 (POST /api/table/login)
  │   │       │   ├─ 성공 → 새 토큰 저장, 메뉴 페이지 표시
  │   │       │   └─ 실패 → "관리자에게 재설정을 요청해주세요" 안내
  │   │       └─ 없음 → /setup 리다이렉트
  │   └─ 없음 → /setup 리다이렉트
```

**저장 데이터 (localStorage):**
- `tableToken`: JWT 토큰
- `tableCredentials`: `{ storeId, tableNumber, password }` (자동 재로그인용)
- `tableInfo`: `{ storeId, tableId, tableNumber }` (API 호출용)

### 2.2 메뉴 조회/탐색 (CustomerMenuPage)

**페이지 로드 시:**
1. `GET /api/stores/:storeId/categories` → 카테고리 목록 로드
2. `GET /api/stores/:storeId/menus` → 전체 메뉴 로드
3. 첫 번째 카테고리 자동 선택

**카테고리 필터링:**
- CategoryNav에서 카테고리 클릭 → 해당 카테고리 메뉴만 필터링 표시
- 선택된 카테고리 시각적 강조 (골드 언더라인)

**메뉴 추가 플로우 (모달 방식):**
1. MenuCard 클릭 → 메뉴 상세 모달 열림
2. 모달에 메뉴명, 가격, 설명, 이미지 표시
3. QuantityControl로 수량 선택 (기본값: 1, 최소: 1, 최대: 99)
4. "주문 목록에 추가" 버튼 클릭 → useOrderList.addItem() 호출
5. Toast로 "주문 목록에 추가되었습니다" 피드백
6. 모달 닫힘

**하단 탭 바:**
- 메뉴 | 주문 목록 (뱃지: 항목 수) | 주문 내역
- 현재 페이지 탭 골드 색상 강조

### 2.3 주문 목록 관리 (useOrderList)

**데이터 구조:**
```typescript
interface OrderListItem {
  menuId: number;
  menuName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
```

**비즈니스 로직:**
- `addItem(item)`: 동일 메뉴 존재 시 수량 증가, 없으면 새 항목 추가
- `removeItem(menuId)`: 항목 삭제
- `updateQuantity(menuId, quantity)`: 수량 변경 (0이면 삭제)
- `clearAll()`: 전체 비우기
- `getTotalPrice()`: 총 금액 계산 (price × quantity 합산)
- `getTotalItems()`: 총 항목 수 (수량 합산)

**localStorage 동기화:**
- 모든 변경 시 `localStorage.setItem('orderList', JSON.stringify(items))` 자동 저장
- 초기 로드 시 `localStorage.getItem('orderList')` 복원
- 주문 성공 시 `clearAll()` → localStorage도 비워짐

### 2.4 주문 생성 플로우 (CustomerOrderListPage)

**주문 목록 표시:**
- OrderItemRow 컴포넌트로 각 항목 표시 (메뉴명, 단가, 수량, 소계)
- QuantityControl로 수량 조절
- 삭제 버튼
- 하단에 총 금액 표시

**주문 확정 플로우:**
1. "주문하기" 버튼 클릭
2. ConfirmDialog 표시: "주문을 확정하시겠습니까?"
3. 확인 → `POST /api/stores/:storeId/orders` 호출
   - Request Body: `{ tableId, sessionId, items: [{ menuId, quantity }] }`
4. 성공 시:
   - 성공 화면 표시: "주문이 접수되었습니다. 잠시 후 서빙해 드리겠습니다."
   - 주문 번호 표시
   - "확인" 버튼 → 메뉴 페이지(`/`)로 이동
   - useOrderList.clearAll() 호출
5. 실패 시:
   - Toast로 에러 메시지 표시
   - 주문 목록 유지 (데이터 손실 방지)

### 2.5 주문 내역 조회 (CustomerOrderHistoryPage)

**페이지 로드 시:**
1. `GET /api/stores/:storeId/tables/:tableId/orders` → 현재 세션 주문 목록 로드
2. 주문 시간 역순 정렬

**SSE 실시간 업데이트:**
1. `useSSE` 훅으로 `/api/stores/:storeId/sse/table/:tableId` 연결
2. `order:statusChanged` 이벤트 수신 시 해당 주문 상태 업데이트
3. 상태 변경 시 OrderStatusBadge 색상 변경 + 간단한 애니메이션

**주문 상태 표시:**
- 대기중 (pending): 골드 뱃지
- 준비중 (preparing): 블루 뱃지
- 완료 (completed): 그린 뱃지

---

## 3. 관리자 UI 비즈니스 로직

### 3.1 관리자 로그인 (AdminLoginPage)

**로그인 플로우:**
1. 매장 식별자, 사용자명, 비밀번호 입력
2. "로그인" 버튼 클릭
3. `POST /api/admin/login` 호출
4. 성공 시:
   - JWT 토큰을 localStorage에 저장
   - AuthContext 업데이트
   - `/admin/dashboard`로 리다이렉트
5. 실패 시:
   - 에러 메시지 표시 ("아이디 또는 비밀번호가 올바르지 않습니다")
   - 로그인 시도 제한 초과 시 별도 메시지

**세션 유지:**
- 페이지 새로고침 시 localStorage에서 토큰 복원
- JWT 만료(16시간) 시 자동 로그아웃 → 로그인 페이지 리다이렉트

### 3.2 실시간 대시보드 (AdminDashboardPage)

**페이지 로드 시:**
1. `GET /api/stores/:storeId/tables` → 테이블 목록 로드
2. `GET /api/stores/:storeId/orders` → 전체 주문 목록 로드
3. 테이블별로 주문 그룹화
4. SSE 연결 시작

**뷰 모드 전환:**
- 그리드 뷰: 테이블별 카드 형태 (TableCard)
- 리스트 뷰: 테이블별 행 형태
- 토글 버튼으로 전환 (기본: 그리드 뷰)

**테이블 카드 (그리드 뷰):**
- 테이블 번호
- 총 주문액
- 최신 주문 2~3개 미리보기 (메뉴명, 수량)
- 주문 상태별 색상 표시
- 신규 주문 시 카드 하이라이트 애니메이션

**테이블 행 (리스트 뷰):**
- 테이블 번호 | 총 주문액 | 주문 수 | 최신 주문 시각 | 상태

**주문 상세 보기:**
- TableCard 클릭 → 해당 테이블의 전체 주문 목록 모달/패널
- 각 주문: 주문 번호, 시각, 메뉴 목록, 금액, 상태
- 주문 상태 변경 버튼 (대기중 → 준비중 → 완료)
- 주문 삭제 버튼 → ConfirmDialog

**SSE 이벤트 처리:**
- `order:new` → 해당 테이블 카드에 주문 추가 + 하이라이트
- `order:updated` → 해당 주문 상태 업데이트
- `order:deleted` → 해당 주문 제거 + 총액 재계산
- `table:completed` → 해당 테이블 카드 리셋

**테이블 필터링:**
- 상단에 테이블 번호 필터 (전체 / 특정 테이블)

### 3.3 메뉴 관리 (AdminMenuManagePage)

**메뉴 목록 표시:**
1. `GET /api/stores/:storeId/categories` → 카테고리 로드
2. `GET /api/stores/:storeId/menus` → 메뉴 로드
3. 카테고리별 탭으로 분류 표시

**메뉴 등록:**
1. "메뉴 추가" 버튼 → 등록 모달
2. 입력 필드: 메뉴명*, 가격*, 설명, 카테고리*, 이미지 업로드
3. 검증: 메뉴명 필수, 가격 0 이상, 카테고리 필수
4. `POST /api/stores/:storeId/menus` (multipart/form-data)
5. 성공 → Toast + 목록 갱신

**메뉴 수정:**
1. 메뉴 항목의 "수정" 버튼 → 수정 모달 (기존 값 프리필)
2. `PUT /api/stores/:storeId/menus/:id`
3. 성공 → Toast + 목록 갱신

**메뉴 삭제:**
1. "삭제" 버튼 → ConfirmDialog
2. `DELETE /api/stores/:storeId/menus/:id`
3. 성공 → Toast + 목록 갱신

**메뉴 순서 변경:**
- 드래그 앤 드롭 또는 위/아래 화살표 버튼
- `PUT /api/stores/:storeId/menus/reorder`

### 3.4 테이블 관리 (AdminTableManagePage)

**테이블 목록:**
1. `GET /api/stores/:storeId/tables` → 테이블 목록 로드
2. 각 테이블: 번호, 현재 세션 상태, 총 주문액

**테이블 생성:**
1. "테이블 추가" 버튼 → 모달
2. 테이블 번호, 비밀번호 입력
3. `POST /api/stores/:storeId/tables`

**주문 삭제 (직권 수정):**
1. 테이블 선택 → 주문 목록 표시
2. 특정 주문 "삭제" 버튼 → ConfirmDialog
3. `DELETE /api/stores/:storeId/orders/:id`
4. 성공 → Toast + 총 주문액 재계산

**이용 완료:**
1. "이용 완료" 버튼 → ConfirmDialog: "테이블 X번 이용 완료 처리하시겠습니까?"
2. `POST /api/stores/:storeId/tables/:id/complete`
3. 성공 → 테이블 주문 목록 리셋, 총 주문액 0

**과거 내역 조회:**
1. "과거 내역" 버튼 → 모달/패널
2. `GET /api/stores/:storeId/tables/:id/history`
3. 날짜 필터링 지원
4. 각 주문: 주문 번호, 시각, 메뉴 목록, 총 금액, 이용 완료 시각
5. "닫기" 버튼으로 복귀

### 3.5 계정 관리 (AdminAccountPage)

**계정 목록:**
1. `GET /api/admin/accounts` → 관리자 계정 목록 로드
2. 각 계정: 사용자명

**계정 생성:**
1. "계정 추가" 버튼 → 모달
2. 사용자명, 비밀번호 입력
3. 검증: 사용자명 필수, 비밀번호 최소 길이
4. `POST /api/admin/accounts`
5. 성공 → Toast + 목록 갱신
6. 중복 사용자명 → 에러 메시지

### 3.6 태블릿 설정 (TableSetupPage)

**설정 플로우:**
1. 매장 식별자 입력
2. 테이블 번호 입력
3. 테이블 비밀번호 입력
4. "설정 완료" 버튼
5. `POST /api/table/login` 호출
6. 성공 시:
   - JWT 토큰 + 인증 정보 localStorage 저장
   - `/` (메뉴 페이지)로 리다이렉트
7. 실패 시:
   - 에러 메시지 표시

---

## 4. 상단 네비게이션 바 (관리자)

**구조:**
```
[Black Marble Table 로고] [대시보드] [메뉴 관리] [테이블 관리] [▼ 더보기]
                                                                  ├─ 계정 관리
                                                                  └─ 로그아웃
```

- 현재 페이지 탭 강조 (골드 언더라인)
- 드롭다운: 계정 관리, 로그아웃
- 로그아웃 클릭 → localStorage 토큰 제거 + `/admin/login` 리다이렉트
