# Logical Components - Unit 2: Menu Domain

---

## 컴포넌트 구조

```
packages/backend/src/
├── controllers/
│   └── menu.controller.ts      # API 엔드포인트 핸들러
├── services/
│   └── menu.service.ts          # 비즈니스 로직
├── repositories/
│   └── menu.repository.ts       # 데이터 접근 레이어
└── uploads/                     # 이미지 저장 디렉토리 (런타임 생성)
    └── {storeId}/
        └── menus/
            └── {uuid}.{ext}
```

---

## 컴포넌트별 책임

### MenuController
| 책임 | 설명 |
|---|---|
| 라우팅 | Express Router로 12개 엔드포인트 등록 |
| 입력 검증 | 필수 필드, 타입, 범위 검증 (1단계) |
| 파일 수신 | multer 미들웨어로 이미지 파일 수신 |
| 응답 포맷팅 | 일관된 JSON 응답 구조 |
| 에러 위임 | 비즈니스 에러를 errorHandler로 전달 |

### MenuService
| 책임 | 설명 |
|---|---|
| 비즈니스 검증 | 카테고리명 중복, categoryId 존재 확인 (2단계) |
| 이미지 처리 | UUID 파일명 생성, 디스크 저장/삭제 |
| 순서 관리 | display_order 자동 할당, reorder 트랜잭션 |
| 삭제 보호 | 카테고리 소속 메뉴 존재 시 삭제 차단 |
| 파일 정합성 | 생성 실패 시 이미지 롤백, 삭제 시 soft failure |

### MenuRepository
| 책임 | 설명 |
|---|---|
| Category CRUD | categories 테이블 CRUD 쿼리 |
| MenuItem CRUD | menu_items 테이블 CRUD 쿼리 |
| 순서 조회 | 최대 display_order 조회 |
| 메뉴 카운트 | 카테고리별 메뉴 수 조회 (삭제 보호용) |
| 일괄 업데이트 | reorder 트랜잭션 쿼리 |

---

## 외부 의존성 (Unit 1 제공)

| 컴포넌트 | 제공 Unit | 사용 방식 |
|---|---|---|
| authMiddleware | Unit 1 | Admin 전용 엔드포인트 보호 |
| tableAuthMiddleware | Unit 1 | Table/Admin 조회 엔드포인트 보호 |
| errorHandler | Unit 1 | 글로벌 에러 처리 |
| DB 연결 (db) | Unit 1 | Drizzle ORM 인스턴스 |
| DB 스키마 | Unit 1 | categories, menu_items 테이블 정의 |
| Express 앱 | Unit 1 | 라우터 등록 |

---

## 인터페이스 정의

### MenuController → MenuService

```typescript
interface IMenuService {
  // Category
  getCategories(storeId: string): Promise<Category[]>;
  createCategory(storeId: string, data: CreateCategoryDto): Promise<Category>;
  updateCategory(storeId: string, categoryId: number, data: UpdateCategoryDto): Promise<Category>;
  deleteCategory(storeId: string, categoryId: number): Promise<void>;
  reorderCategories(storeId: string, categoryIds: number[]): Promise<void>;

  // MenuItem
  getMenusByStore(storeId: string, categoryId?: number): Promise<MenuItem[]>;
  getMenuById(storeId: string, menuId: number): Promise<MenuItem>;
  createMenu(storeId: string, data: CreateMenuDto, imageBuffer: Buffer, mimetype: string): Promise<MenuItem>;
  updateMenu(storeId: string, menuId: number, data: UpdateMenuDto, imageBuffer?: Buffer, mimetype?: string): Promise<MenuItem>;
  deleteMenu(storeId: string, menuId: number): Promise<void>;
  reorderMenus(storeId: string, menuIds: number[]): Promise<void>;
}
```

### MenuService → MenuRepository

```typescript
interface IMenuRepository {
  // Category
  findCategoriesByStore(storeId: string): Promise<Category[]>;
  findCategoryById(categoryId: number): Promise<Category | null>;
  findCategoryByName(storeId: string, name: string): Promise<Category | null>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(categoryId: number, data: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(categoryId: number): Promise<void>;
  getMaxCategoryOrder(storeId: string): Promise<number>;
  updateCategoryOrders(orders: { id: number; displayOrder: number }[]): Promise<void>;

  // MenuItem
  findMenusByStore(storeId: string, categoryId?: number): Promise<MenuItem[]>;
  findMenuById(menuId: number): Promise<MenuItem | null>;
  findMenusByIds(menuIds: number[]): Promise<MenuItem[]>;
  createMenu(data: InsertMenuItem): Promise<MenuItem>;
  updateMenu(menuId: number, data: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenu(menuId: number): Promise<void>;
  countMenusByCategory(categoryId: number): Promise<number>;
  getMaxMenuOrder(storeId: string, categoryId: number): Promise<number>;
  updateMenuOrders(orders: { id: number; displayOrder: number }[]): Promise<void>;
}
```

---

## DTO 정의

```typescript
interface CreateCategoryDto {
  name: string;
}

interface UpdateCategoryDto {
  name: string;
}

interface CreateMenuDto {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
}

interface UpdateMenuDto {
  name: string;
  price: number;
  description?: string;
  categoryId: number;
}
```
