# Unit Test Instructions - Unit 2: Menu Domain

## 테스트 실행

### 전체 테스트 실행

```bash
cd black-marble-table
npm run test:backend
```

### 개별 테스트 파일 실행

```bash
cd black-marble-table/packages/backend

# Repository Layer 테스트
npx vitest run tests/repositories/menu.repository.test.ts

# Service Layer 테스트
npx vitest run tests/services/menu.service.test.ts

# Controller Layer 테스트
npx vitest run tests/controllers/menu.controller.test.ts
```

### Watch 모드 (개발 중)

```bash
cd black-marble-table/packages/backend
npx vitest
```

---

## 테스트 구조

### Repository Layer (`tests/repositories/menu.repository.test.ts`)

| 테스트 그룹 | 테스트 케이스 |
|---|---|
| findCategoriesByStore | 매장 ID로 카테고리 목록 조회 |
| findCategoryById | 카테고리 ID로 단일 조회, 미존재 시 undefined |
| createCategory | 새 카테고리 생성 및 반환 |
| countMenusByCategory | 카테고리별 메뉴 수 반환 |
| findMenusByStore | 매장 전체 메뉴 조회 |
| deleteMenu | 메뉴 삭제 |

### Service Layer (`tests/services/menu.service.test.ts`)

| 테스트 그룹 | 테스트 케이스 |
|---|---|
| getCategories | 매장 카테고리 목록 반환 |
| createCategory | 정상 생성, 빈 이름 에러, 50자 초과 에러, 중복명 에러 |
| updateCategory | 정상 수정, 미존재 에러, 다른 매장 에러 |
| deleteCategory | 정상 삭제, 메뉴 존재 시 에러 |
| reorderCategories | 정상 순서 변경, 빈 배열 에러, 유효하지 않은 ID 에러 |
| getMenusByStore | 전체 조회, 카테고리 필터링 |
| getMenuById | 정상 조회, 미존재 에러 |
| createMenu | 정상 생성, 유효하지 않은 카테고리 에러, 음수 가격 에러, 빈 이름 에러 |
| deleteMenu | 정상 삭제, 미존재 에러 |
| reorderMenus | 정상 순서 변경, 빈 배열 에러 |

### Controller Layer (`tests/controllers/menu.controller.test.ts`)

| 테스트 그룹 | 테스트 케이스 |
|---|---|
| GET /categories | 200 목록 반환, 401 인증 없음 |
| POST /categories | 201 생성, 403 Table 역할 거부, 409 중복명 |
| DELETE /categories/:id | 204 삭제, 409 메뉴 존재 |
| GET /menus | 200 목록 반환, categoryId 필터링 |
| GET /menus/:id | 200 상세 반환, 404 미존재 |
| POST /menus | 201 이미지 포함 생성, 400 이미지 없음 |
| DELETE /menus/:id | 204 삭제 |
| PUT /menus/reorder | 204 순서 변경 |

---

## 테스트 커버리지

```bash
cd black-marble-table/packages/backend
npx vitest run --coverage
```

### 커버리지 대상
- `src/repositories/menu.repository.ts`
- `src/services/menu.service.ts`
- `src/controllers/menu.controller.ts`
- `src/errors/index.ts`
- `src/middleware/error-handler.ts`

### 제외 대상
- `src/index.ts` (서버 엔트리포인트)
- `src/db/index.ts` (DB 연결)
