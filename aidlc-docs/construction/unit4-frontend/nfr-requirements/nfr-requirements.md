# NFR Requirements - Unit 4: Frontend

---

## 1. 성능 요구사항

### NFR-FE-01: 페이지 로딩 성능
- **초기 로드**: 3초 이내 (LAN 환경 기준)
- **라우트 전환**: 즉시 (SPA 클라이언트 사이드 라우팅)
- **코드 스플리팅**: React.lazy + Suspense로 고객/관리자 번들 분리
  - 고객 라우트 (`/`, `/order-list`, `/orders`): 고객 번들
  - 관리자 라우트 (`/admin/*`): 관리자 번들
  - 설정 라우트 (`/setup`): 별도 번들

### NFR-FE-02: API 응답 처리
- API 호출 시 로딩 인디케이터 표시
- 응답 수신 후 100ms 이내 UI 반영
- 낙관적 업데이트(Optimistic Update)는 MVP에서 미적용 (서버 응답 후 업데이트)

### NFR-FE-03: SSE 실시간 성능
- SSE 이벤트 수신 후 UI 반영: 500ms 이내
- 전체 플로우 (주문 생성 → 관리자 대시보드 표시): 2초 이내
- SSE 연결 끊김 시 자동 재연결: 3초 간격, 최대 5회 시도

### NFR-FE-04: 번들 사이즈
- 메인 번들: 200KB 이하 (gzip 기준)
- 외부 의존성 최소화 (React, React Router, React DOM만)
- Tree shaking 활용

---

## 2. 사용성 요구사항

### NFR-FE-05: 반응형 디자인
- **고객 UI**: 태블릿(768px+) + 스마트폰(320px+) 모두 지원
  - 모바일 퍼스트 접근
  - 브레이크포인트: 320px (모바일), 768px (태블릿), 1024px (데스크톱)
  - 메뉴 카드 그리드: 모바일 1열, 태블릿 2열, 데스크톱 3열
- **관리자 UI**: 데스크톱(1024px+) + 태블릿(768px+) 지원
  - 대시보드 그리드: 태블릿 2열, 데스크톱 3~4열
  - 네비게이션: 데스크톱 상단 바, 태블릿 햄버거 메뉴

### NFR-FE-06: 터치 친화성
- 모든 인터랙티브 요소: 최소 44×44px 터치 영역
- 버튼 간 간격: 최소 8px
- 스와이프 제스처: MVP에서 미적용

### NFR-FE-07: 접근성 (기본)
- 시맨틱 HTML 사용 (header, nav, main, button 등)
- 적절한 색상 대비 (WCAG AA 기준 4.5:1)
- 폼 요소에 label 연결
- 키보드 네비게이션 기본 지원 (tab, enter)
- aria-label 주요 인터랙티브 요소에 적용

### NFR-FE-08: 브라우저 호환성
- 최신 Chrome (v120+) 지원
- ES2020+ 문법 사용 가능
- CSS Grid, Flexbox, CSS Variables 사용

---

## 3. 신뢰성 요구사항

### NFR-FE-09: 에러 핸들링
- **네트워크 에러**: 사용자 친화적 메시지 + 재시도 안내
- **인증 에러 (401)**: 자동 로그아웃 + 로그인 페이지 리다이렉트
- **서버 에러 (500)**: "일시적인 오류" 메시지
- **검증 에러 (400)**: 서버 응답 메시지 표시
- **React Error Boundary**: 페이지 레벨 에러 바운더리로 크래시 방지

### NFR-FE-10: SSE 연결 복구
- 연결 끊김 감지 시 자동 재연결
- 재연결 간격: 3초 (고정)
- 최대 재연결 시도: 5회
- 5회 실패 시 "연결이 끊어졌습니다. 페이지를 새로고침해주세요." 메시지

### NFR-FE-11: 데이터 영속성
- 주문 목록(장바구니): localStorage에 저장, 새로고침 시 복원
- 인증 토큰: localStorage에 저장, 새로고침 시 복원
- 테이블 설정 정보: localStorage에 저장

### NFR-FE-12: 이미지 로딩
- `loading="lazy"` 속성으로 뷰포트 밖 이미지 지연 로딩
- 이미지 로드 실패 시 기본 플레이스홀더 표시
- alt 텍스트: 메뉴명 사용

---

## 4. 유지보수성 요구사항

### NFR-FE-13: 코드 구조
- 기능별 디렉토리 구조 (pages, components, hooks, services)
- 컴포넌트당 하나의 파일 + 하나의 CSS Module
- TypeScript strict 모드 사용
- 명확한 타입 정의 (any 사용 금지)

### NFR-FE-14: 테스트
- MVP 단계에서는 테스트 미작성
- 단, Code Generation 시 단위 테스트 포함 (korean-guidance 규칙 준수)
- 테스트 프레임워크: Vitest + React Testing Library (설정만 포함)

---

## 5. NFR 요약 매트릭스

| NFR ID | 카테고리 | 요구사항 | 우선순위 |
|---|---|---|---|
| NFR-FE-01 | 성능 | 초기 로드 3초 이내 | High |
| NFR-FE-02 | 성능 | API 응답 후 100ms 이내 UI 반영 | High |
| NFR-FE-03 | 성능 | SSE 이벤트 2초 이내 표시 | High |
| NFR-FE-04 | 성능 | 메인 번들 200KB 이하 | Medium |
| NFR-FE-05 | 사용성 | 태블릿+스마트폰+데스크톱 반응형 | High |
| NFR-FE-06 | 사용성 | 44×44px 최소 터치 영역 | High |
| NFR-FE-07 | 사용성 | WCAG AA 기본 접근성 | Medium |
| NFR-FE-08 | 사용성 | Chrome v120+ 지원 | High |
| NFR-FE-09 | 신뢰성 | 에러 핸들링 + Error Boundary | High |
| NFR-FE-10 | 신뢰성 | SSE 자동 재연결 (3초, 5회) | High |
| NFR-FE-11 | 신뢰성 | localStorage 데이터 영속성 | High |
| NFR-FE-12 | 신뢰성 | 이미지 lazy loading + 플레이스홀더 | Medium |
| NFR-FE-13 | 유지보수 | TypeScript strict, 기능별 구조 | Medium |
| NFR-FE-14 | 유지보수 | 단위 테스트 (Code Gen 시 포함) | Medium |
