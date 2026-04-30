# Code Generation Plan - Unit 2: Menu Domain

## Unit Context
- **Unit Name**: Unit 2 - Menu Domain (메뉴 관리)
- **담당 Stories**: US-C02 (메뉴 조회 API), US-A05 (메뉴 CRUD API + 이미지 업로드)
- **프로젝트 구조**: 모노레포 (`packages/backend/`)
- **의존성**: Unit 1 (Foundation) — DB 스키마, 미들웨어, Express 앱

## Unit 1 의존성 처리 전략
Unit 1이 아직 구현되지 않았으므로, Unit 2가 필요로 하는 최소한의 공유 인프라를 함께 생성합니다:
- DB 스키마 (categories, menu_items 테이블만)
- DB 연결 설정
- 공유 타입 정의
- 에러 클래스
- 미들웨어 stub (인증 미들웨어는 pass-through stub)

---

## Generation Steps

### Step 1: 프로젝트 구조 및 설정 파일
- [x] 1.1 워크스페이스 루트 package.json (npm workspaces)
- [x] 1.2 tsconfig.base.json
- [x] 1.3 packages/backend/package.json (의존성 포함)
- [x] 1.4 packages/backend/tsconfig.json
- [x] 1.5 .gitignore 업데이트

### Step 2: 공유 인프라 (Unit 1 의존성 stub)
- [x] 2.1 packages/backend/src/db/schema.ts (categories, menu_items 테이블 스키마)
- [x] 2.2 packages/backend/src/db/index.ts (DB 연결)
- [x] 2.3 packages/backend/src/types/index.ts (공유 타입 정의)
- [x] 2.4 packages/backend/src/middleware/auth.ts (인증 미들웨어 stub)
- [x] 2.5 packages/backend/src/middleware/error-handler.ts (에러 핸들러)
- [x] 2.6 packages/backend/src/errors/index.ts (커스텀 에러 클래스)

### Step 3: Repository Layer
- [x] 3.1 packages/backend/src/repositories/menu.repository.ts
- [x] 3.2 Repository Layer 단위 테스트: packages/backend/tests/repositories/menu.repository.test.ts

### Step 4: Service Layer
- [x] 4.1 packages/backend/src/services/menu.service.ts
- [x] 4.2 Service Layer 단위 테스트: packages/backend/tests/services/menu.service.test.ts

### Step 5: Controller Layer (API)
- [x] 5.1 packages/backend/src/controllers/menu.controller.ts
- [x] 5.2 Controller Layer 단위 테스트: packages/backend/tests/controllers/menu.controller.test.ts

### Step 6: 서버 엔트리포인트
- [x] 6.1 packages/backend/src/index.ts (Express 앱 + 라우터 등록 + static 서빙)

### Step 7: 문서 생성
- [x] 7.1 aidlc-docs/construction/unit2-menu/code/code-summary.md

---

## Story Traceability

| Story | 구현 Step | 상태 |
|---|---|---|
| US-C02 (메뉴 조회 API) | Step 3, 4, 5 (GET endpoints) | [x] |
| US-A05 (메뉴 CRUD API) | Step 3, 4, 5 (POST/PUT/DELETE endpoints) | [x] |

---

## 파일 목록 (생성 예정)

```
black-marble-table/
├── package.json
├── tsconfig.base.json
├── .gitignore
└── packages/
    └── backend/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── index.ts
            ├── db/
            │   ├── schema.ts
            │   └── index.ts
            ├── types/
            │   └── index.ts
            ├── errors/
            │   └── index.ts
            ├── middleware/
            │   ├── auth.ts
            │   └── error-handler.ts
            ├── repositories/
            │   └── menu.repository.ts
            ├── services/
            │   └── menu.service.ts
            └── controllers/
                └── menu.controller.ts
        └── tests/
            ├── repositories/
            │   └── menu.repository.test.ts
            ├── services/
            │   └── menu.service.test.ts
            └── controllers/
                └── menu.controller.test.ts
```
