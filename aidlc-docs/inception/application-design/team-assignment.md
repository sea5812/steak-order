# 팀원 역할 분담 - Black Marble Table

## 팀 구성 (4명)

---

### 팀원 A: Foundation & Auth Lead

**담당 유닛**: Unit 1 (Foundation)  
**역할**: 프로젝트 기반 구축 + 인증 시스템

| 작업 | 우선순위 | 예상 시간 |
|---|---|---|
| 모노레포 프로젝트 구조 생성 | 🔴 Critical | 1h |
| Drizzle ORM 스키마 전체 정의 | 🔴 Critical | 2h |
| DB 시드 데이터 (Black Marble 메뉴 36개) | 🔴 Critical | 1h |
| 인증 미들웨어 (JWT, bcrypt) | 🔴 Critical | 2h |
| AuthController + AuthService | 🟡 High | 1.5h |
| AdminController + AdminService | 🟡 High | 1h |
| 글로벌 에러 핸들러 | 🟡 High | 0.5h |
| 단위 테스트 (인증, 관리자) | 🟢 Medium | 1.5h |

**총 예상**: ~10.5h  
**블로킹 요소**: 없음 (첫 번째로 시작)  
**다른 팀원 언블록 시점**: DB 스키마 + 미들웨어 완료 시 (~4h)

---

### 팀원 B: Menu Domain Lead

**담당 유닛**: Unit 2 (Menu)  
**역할**: 메뉴/카테고리 CRUD + 이미지 업로드

| 작업 | 우선순위 | 예상 시간 |
|---|---|---|
| MenuController (8 endpoints) | 🔴 Critical | 2h |
| MenuService (CRUD + 순서 변경) | 🔴 Critical | 2h |
| MenuRepository (Drizzle 쿼리) | 🟡 High | 1.5h |
| 이미지 업로드 처리 (multer) | 🟡 High | 1h |
| 입력 검증 (가격, 필수 필드) | 🟡 High | 0.5h |
| 단위 테스트 (메뉴 CRUD) | 🟢 Medium | 1.5h |

**총 예상**: ~8.5h  
**블로킹 요소**: Unit 1의 DB 스키마 + 인증 미들웨어  
**시작 가능 시점**: 팀원 A가 스키마 완료 후 (~4h)

---

### 팀원 C: Order & Realtime Lead

**담당 유닛**: Unit 3 (Order + SSE)  
**역할**: 주문 관리 + 테이블 관리 + SSE 실시간 통신

| 작업 | 우선순위 | 예상 시간 |
|---|---|---|
| SSEManager (연결 풀 관리) | 🔴 Critical | 1.5h |
| SSEController + SSEService | 🔴 Critical | 1h |
| OrderController (5 endpoints) | 🔴 Critical | 2h |
| OrderService (생성, 상태변경, 삭제) | 🔴 Critical | 2h |
| TableController (5 endpoints) | 🟡 High | 1.5h |
| TableService (세션 관리, 이용 완료) | 🟡 High | 2h |
| OrderRepository + TableRepository | 🟡 High | 2h |
| 단위 테스트 (주문, 테이블, SSE) | 🟢 Medium | 2h |

**총 예상**: ~14h (가장 큰 유닛)  
**블로킹 요소**: Unit 1의 DB 스키마 + 인증 미들웨어  
**시작 가능 시점**: 팀원 A가 스키마 완료 후 (~4h)

---

### 팀원 D: Frontend Lead

**담당 유닛**: Unit 4 (Frontend)  
**역할**: 전체 React UI (고객 + 관리자)

| 작업 | 우선순위 | 예상 시간 |
|---|---|---|
| 프로젝트 설정 (Vite, Router, 테마) | 🔴 Critical | 1h |
| Black Marble 테마 + 글로벌 스타일 | 🔴 Critical | 1.5h |
| 공유 컴포넌트 (8개) | 🔴 Critical | 3h |
| 고객 - 메뉴 페이지 | 🟡 High | 2h |
| 고객 - 주문 목록 페이지 | 🟡 High | 1.5h |
| 고객 - 주문 내역 페이지 (SSE) | 🟡 High | 1.5h |
| 관리자 - 로그인 페이지 | 🟡 High | 1h |
| 관리자 - 대시보드 (SSE) | 🟡 High | 3h |
| 관리자 - 메뉴 관리 페이지 | 🟢 Medium | 2h |
| 관리자 - 테이블 관리 페이지 | 🟢 Medium | 2h |
| 관리자 - 계정 관리 페이지 | 🟢 Medium | 1h |
| 태블릿 설정 페이지 | 🟢 Medium | 0.5h |
| Hooks (4개) + API Services (6개) | 🟡 High | 2h |

**총 예상**: ~22h (가장 큰 범위)  
**블로킹 요소**: 없음 (Mock 데이터로 즉시 시작 가능, API 타입만 필요)  
**시작 가능 시점**: 즉시 (테마 + 공유 컴포넌트부터)

---

## 개발 타임라인 (1일 기준)

```
시간    팀원A(Foundation)  팀원B(Menu)      팀원C(Order)     팀원D(Frontend)
──────  ────────────────  ──────────────  ──────────────  ────────────────
09:00   프로젝트 구조     (대기)          (대기)          Vite 설정 + 테마
10:00   DB 스키마         (대기)          (대기)          공유 컴포넌트
11:00   시드 데이터       (대기)          (대기)          공유 컴포넌트
12:00   인증 미들웨어     (대기)          (대기)          고객 메뉴 페이지
──────  ── Unit1 기반 완료 → Unit2,3 시작 가능 ──────────────────────────
13:00   Auth API          Menu Controller  SSE Manager     고객 주문목록
14:00   Admin API         Menu Service     Order Controller 고객 주문내역
15:00   에러 핸들러       Menu Repository  Order Service    관리자 로그인
16:00   단위 테스트       이미지 업로드    Table Controller 관리자 대시보드
17:00   (완료/지원)       입력 검증       Table Service    관리자 대시보드
18:00   (통합 지원)       단위 테스트     Order Repository 관리자 메뉴관리
19:00   (통합 지원)       (완료/지원)     단위 테스트     관리자 테이블관리
20:00   ──────────────── 통합 테스트 + 버그 수정 ────────────────────────
```

---

## Git 브랜치 전략

```
main
├── feature/unit1-foundation     (팀원 A)
├── feature/unit2-menu           (팀원 B)
├── feature/unit3-order          (팀원 C)
└── feature/unit4-frontend       (팀원 D)
```

- 각 팀원은 자신의 feature 브랜치에서 작업
- Unit 1 완료 후 main에 머지 → 다른 브랜치가 main에서 리베이스
- 최종 통합 시 각 feature 브랜치를 main에 순차 머지
