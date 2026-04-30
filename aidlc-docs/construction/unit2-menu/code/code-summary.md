# Code Summary - Unit 2: Menu Domain

## 생성된 파일 목록

### 프로젝트 설정
| 파일 | 용도 |
|---|---|
| `black-marble-table/package.json` | 워크스페이스 루트 (npm workspaces) |
| `black-marble-table/tsconfig.base.json` | 공유 TypeScript 설정 |
| `black-marble-table/packages/backend/package.json` | 백엔드 패키지 설정 및 의존성 |
| `black-marble-table/packages/backend/tsconfig.json` | 백엔드 TypeScript 설정 |

### 공유 인프라 (Unit 1 의존성 stub)
| 파일 | 용도 |
|---|---|
| `src/db/schema.ts` | Drizzle ORM 스키마 (categories, menu_items) |
| `src/db/index.ts` | SQLite DB 연결 |
| `src/types/index.ts` | 공유 타입 및 DTO 정의 |
| `src/errors/index.ts` | 커스텀 에러 클래스 (AppError, NotFoundError 등) |
| `src/middleware/auth.ts` | 인증 미들웨어 stub (JWT 검증 placeholder) |
| `src/middleware/error-handler.ts` | 글로벌 에러 핸들러 |

### Unit 2 핵심 코드
| 파일 | 용도 |
|---|---|
| `src/repositories/menu.repository.ts` | 데이터 접근 레이어 (Category + MenuItem CRUD) |
| `src/services/menu.service.ts` | 비즈니스 로직 (검증, 이미지 처리, 순서 관리) |
| `src/controllers/menu.controller.ts` | API 엔드포인트 (12개 라우트) |
| `src/index.ts` | Express 서버 엔트리포인트 |

### 단위 테스트
| 파일 | 테스트 대상 |
|---|---|
| `tests/repositories/menu.repository.test.ts` | Repository Layer |
| `tests/services/menu.service.test.ts` | Service Layer (비즈니스 로직) |
| `tests/controllers/menu.controller.test.ts` | Controller Layer (API 통합) |

---

## API 엔드포인트 요약

| Method | Endpoint | Auth | 설명 |
|---|---|---|---|
| GET | `/api/stores/:storeId/categories` | Table/Admin | 카테고리 목록 조회 |
| POST | `/api/stores/:storeId/categories` | Admin | 카테고리 생성 |
| PUT | `/api/stores/:storeId/categories/:id` | Admin | 카테고리 수정 |
| DELETE | `/api/stores/:storeId/categories/:id` | Admin | 카테고리 삭제 |
| PUT | `/api/stores/:storeId/categories/reorder` | Admin | 카테고리 순서 변경 |
| GET | `/api/stores/:storeId/menus` | Table/Admin | 메뉴 목록 조회 |
| GET | `/api/stores/:storeId/menus/:id` | Table/Admin | 메뉴 상세 조회 |
| POST | `/api/stores/:storeId/menus` | Admin | 메뉴 등록 (이미지 업로드) |
| PUT | `/api/stores/:storeId/menus/:id` | Admin | 메뉴 수정 |
| DELETE | `/api/stores/:storeId/menus/:id` | Admin | 메뉴 삭제 |
| PUT | `/api/stores/:storeId/menus/reorder` | Admin | 메뉴 순서 변경 |

---

## Story 구현 상태

| Story | 상태 | 구현 내용 |
|---|---|---|
| US-C02 (메뉴 조회 API) | ✅ 완료 | GET /categories, GET /menus, GET /menus/:id |
| US-A05 (메뉴 CRUD API) | ✅ 완료 | POST/PUT/DELETE categories, POST/PUT/DELETE menus, reorder |

---

## 실행 방법

```bash
cd black-marble-table
npm install
npm run dev:backend    # 개발 서버 실행
npm run test:backend   # 테스트 실행
```
