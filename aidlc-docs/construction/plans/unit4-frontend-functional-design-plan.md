# Functional Design Plan - Unit 4: Frontend

## 개요
Unit 4 Frontend의 상세 비즈니스 로직 설계를 위한 계획입니다.
전체 React 프론트엔드 (고객 UI 9개 페이지 + 관리자 UI + 공유 컴포넌트 + Hooks + API Services)를 다룹니다.

---

## 설계 단계

### Part A: 프론트엔드 아키텍처 및 상태 관리
- [x] A1. 프로젝트 구조 및 디렉토리 레이아웃 확정
- [x] A2. 라우팅 구조 및 인증 가드 설계
- [x] A3. 전역 상태 관리 전략 (Context vs Zustand vs localStorage)
- [x] A4. API 클라이언트 설계 (인터셉터, 에러 핸들링, JWT 자동 첨부)
- [x] A5. Black Marble 다크 테마 디자인 시스템 정의

### Part B: 고객 UI 비즈니스 로직
- [x] B1. 자동 로그인 플로우 (useTableAuth) — localStorage 기반 세션 관리
- [x] B2. 메뉴 조회/탐색 (CustomerMenuPage) — 카테고리 필터링, 메뉴 카드 레이아웃
- [x] B3. 주문 목록 관리 (useOrderList) — localStorage 연동, 수량 조절, 총액 계산
- [x] B4. 주문 생성 플로우 (CustomerOrderListPage) — 주문 확정, 성공/실패 처리
- [x] B5. 주문 내역 조회 (CustomerOrderHistoryPage) — SSE 실시간 상태 업데이트

### Part C: 관리자 UI 비즈니스 로직
- [x] C1. 관리자 로그인 (AdminLoginPage + useAuth) — JWT 세션 관리
- [x] C2. 실시간 대시보드 (AdminDashboardPage) — SSE 연동, 테이블 카드 그리드
- [x] C3. 메뉴 관리 (AdminMenuManagePage) — CRUD, 이미지 업로드, 순서 변경
- [x] C4. 테이블 관리 (AdminTableManagePage) — 세션 관리, 이용 완료, 과거 내역
- [x] C5. 계정 관리 (AdminAccountPage) — 관리자 계정 생성/조회
- [x] C6. 태블릿 설정 (TableSetupPage) — 초기 설정 플로우

### Part D: 공유 컴포넌트 및 Hooks 설계
- [x] D1. 공유 컴포넌트 Props/State 정의 (8개 컴포넌트)
- [x] D2. 커스텀 Hooks 인터페이스 정의 (4개 훅)
- [x] D3. API Service 레이어 인터페이스 정의 (6개 서비스)

---

## 질문

아래 질문에 답변해주세요. 각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해주세요.

### Question 1
CSS 스타일링 방식은 어떤 것을 사용할까요?

A) CSS Modules (.module.css)
B) Tailwind CSS
C) styled-components (CSS-in-JS)
D) Vanilla CSS + CSS 변수 (가장 가벼운 방식)
E) Other (please describe after [Answer]: tag below)

[Answer]: 추천해줘

### Question 2
상태 관리 라이브러리를 사용할까요? (주문 목록/장바구니는 localStorage 기반이 확정)

A) React Context API만 사용 (추가 라이브러리 없음)
B) Zustand (경량 상태 관리)
C) Redux Toolkit
D) Other (please describe after [Answer]: tag below)

[Answer]: 추천해줘

### Question 3
관리자 대시보드의 테이블 카드 그리드에서 한 화면에 표시할 테이블 수는?

A) 고정 4열 그리드 (데스크톱 기준)
B) 반응형 그리드 (화면 크기에 따라 2~6열 자동 조절)
C) 리스트 뷰와 그리드 뷰 전환 가능
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 4
고객 메뉴 페이지에서 메뉴를 주문 목록에 추가하는 방식은?

A) 메뉴 카드에 "+" 버튼 → 바로 1개 추가 (수량 조절은 주문 목록 페이지에서)
B) 메뉴 카드 클릭 → 상세 모달에서 수량 선택 후 추가
C) 메뉴 카드에 수량 조절 컨트롤 직접 표시
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 5
고객 UI와 관리자 UI의 네비게이션 구조는?

A) 고객: 하단 탭 바 (메뉴/주문목록/주문내역) / 관리자: 좌측 사이드바
B) 고객: 상단 탭 바 / 관리자: 상단 네비게이션 바
C) 고객: 하단 탭 바 / 관리자: 상단 네비게이션 바 + 드롭다운
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 6
폼 검증(Form Validation) 방식은?

A) 직접 구현 (커스텀 validation 함수)
B) React Hook Form + Zod
C) Formik + Yup
D) Other (please describe after [Answer]: tag below)

[Answer]: 추천

### Question 7
HTTP 클라이언트는 어떤 것을 사용할까요?

A) Fetch API (브라우저 내장, 추가 의존성 없음)
B) Axios (인터셉터, 자동 JSON 변환 등 편의 기능)
C) Other (please describe after [Answer]: tag below)

[Answer]: 추천

