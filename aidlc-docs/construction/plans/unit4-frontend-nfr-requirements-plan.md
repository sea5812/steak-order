# NFR Requirements Plan - Unit 4: Frontend

## 개요
Unit 4 Frontend의 비기능 요구사항(NFR) 평가 및 기술 스택 결정을 위한 계획입니다.

---

## 평가 단계

### Part A: 성능 요구사항
- [x] A1. 페이지 로딩 성능 (초기 로드, 라우트 전환)
- [x] A2. API 응답 처리 및 렌더링 성능
- [x] A3. SSE 실시간 업데이트 성능 (2초 이내 표시)
- [x] A4. 번들 사이즈 최적화

### Part B: 사용성 요구사항
- [x] B1. 반응형 디자인 (태블릿/데스크톱)
- [x] B2. 접근성 (WCAG 기본 준수)
- [x] B3. 브라우저 호환성

### Part C: 신뢰성 요구사항
- [x] C1. 에러 핸들링 전략
- [x] C2. SSE 연결 복구
- [x] C3. 오프라인/네트워크 장애 대응

### Part D: 기술 스택 확정
- [x] D1. React + TypeScript + Vite 설정
- [x] D2. 의존성 목록 확정
- [x] D3. 개발/빌드 도구 설정

---

## 질문

아래 질문에 답변해주세요. 각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해주세요.

### Question 1
고객 태블릿의 주요 사용 환경은?

A) 10인치 이상 태블릿 전용 (iPad 등)
B) 태블릿 + 스마트폰 모두 지원 (반응형)
C) 태블릿 전용이지만 스마트폰에서도 기본 동작
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2
관리자 대시보드의 주요 사용 환경은?

A) 데스크톱 PC 전용
B) 데스크톱 + 태블릿 모두 지원
C) 데스크톱 전용이지만 태블릿에서도 기본 동작
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
지원해야 할 브라우저 범위는?

A) 최신 Chrome만 (태블릿/PC 모두 Chrome 사용 가정)
B) Chrome + Safari (iPad 지원 포함)
C) Chrome + Safari + Firefox + Edge (주요 브라우저 전체)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
이미지 로딩 최적화가 필요한가요? (메뉴 이미지)

A) 필요 없음 — MVP이므로 원본 이미지 그대로 표시
B) 기본 최적화 — lazy loading 정도만 적용
C) 적극 최적화 — lazy loading + 이미지 리사이징 + WebP 변환
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 5
프론트엔드 테스트 전략은?

A) 단위 테스트만 (Vitest + React Testing Library)
B) 단위 테스트 + 통합 테스트
C) 단위 테스트 + E2E 테스트 (Playwright/Cypress)
D) 테스트 없이 MVP 우선 (나중에 추가)
E) Other (please describe after [Answer]: tag below)

[Answer]: D

