# Unit of Work - Story Map - Black Marble Table

---

## Story → Unit 매핑

| Story ID | Story Name | Unit 1 (Foundation) | Unit 2 (Menu) | Unit 3 (Order) | Unit 4 (Frontend) |
|---|---|---|---|---|---|
| US-C01 | 테이블 태블릿 자동 로그인 | ✓ (인증 API) | | | ✓ (자동 로그인 UI) |
| US-C02 | 메뉴 조회 및 탐색 | | ✓ (메뉴 조회 API) | | ✓ (메뉴 페이지) |
| US-C03 | 주문 목록 관리 | | | | ✓ (주문 목록 UI, localStorage) |
| US-C04 | 주문 생성 | | | ✓ (주문 생성 API) | ✓ (주문 확정 UI) |
| US-C05 | 주문 내역 조회 | | | ✓ (주문 조회 API, SSE) | ✓ (주문 내역 UI) |
| US-A01 | 매장 인증 | ✓ (관리자 로그인 API) | | | ✓ (로그인 페이지) |
| US-A02 | 관리자 계정 관리 | ✓ (계정 CRUD API) | | | ✓ (계정 관리 UI) |
| US-A03 | 실시간 주문 모니터링 | | | ✓ (주문 목록 API, SSE) | ✓ (대시보드 UI) |
| US-A04 | 테이블 관리 | | | ✓ (테이블 API, 이용완료) | ✓ (테이블 관리 UI) |
| US-A05 | 메뉴 관리 | | ✓ (메뉴 CRUD API) | | ✓ (메뉴 관리 UI) |

---

## Unit별 Story 요약

### Unit 1: Foundation (팀원 A) — 3 Stories
- US-C01 (Backend): 테이블 태블릿 인증 API
- US-A01 (Backend): 관리자 로그인 API
- US-A02 (Backend): 관리자 계정 CRUD API

### Unit 2: Menu Domain (팀원 B) — 2 Stories
- US-C02 (Backend): 메뉴/카테고리 조회 API
- US-A05 (Backend): 메뉴 CRUD API + 이미지 업로드

### Unit 3: Order Domain (팀원 C) — 4 Stories
- US-C04 (Backend): 주문 생성 API
- US-C05 (Backend): 주문 조회 API + SSE 테이블 스트림
- US-A03 (Backend): 주문 목록 API + SSE 관리자 스트림
- US-A04 (Backend): 테이블 관리 API + 이용 완료

### Unit 4: Frontend (팀원 D) — 10 Stories (전체)
- 모든 Story의 UI 구현 담당
- 고객 페이지 3개 + 관리자 페이지 5개 + 설정 페이지 1개
