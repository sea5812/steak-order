# Domain Entities - Unit 2: Menu Domain

---

## Entity: Category (카테고리)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| category_id | INTEGER | PK, AUTO_INCREMENT | 카테고리 고유 ID |
| store_id | TEXT | FK(Store), NOT NULL | 매장 식별자 |
| name | TEXT | NOT NULL, UNIQUE(store_id + name) | 카테고리명 |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 노출 순서 |
| created_at | TEXT | NOT NULL, ISO 8601 | 생성 시각 |
| updated_at | TEXT | NOT NULL, ISO 8601 | 수정 시각 |

### 제약조건
- 동일 매장 내 카테고리명 중복 불가
- display_order는 0 이상의 정수
- 카테고리에 소속 메뉴가 있으면 삭제 불가

---

## Entity: MenuItem (메뉴 항목)

| 필드 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| menu_item_id | INTEGER | PK, AUTO_INCREMENT | 메뉴 고유 ID |
| store_id | TEXT | FK(Store), NOT NULL | 매장 식별자 |
| category_id | INTEGER | FK(Category), NOT NULL | 소속 카테고리 ID |
| name | TEXT | NOT NULL | 메뉴명 |
| price | INTEGER | NOT NULL, >= 0 | 가격 (원) |
| description | TEXT | NULLABLE | 메뉴 설명 |
| image_url | TEXT | NOT NULL | 이미지 파일 경로 |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 노출 순서 |
| created_at | TEXT | NOT NULL, ISO 8601 | 생성 시각 |
| updated_at | TEXT | NOT NULL, ISO 8601 | 수정 시각 |

### 제약조건
- 가격은 0 이상의 정수 (원 단위)
- 이미지는 필수 (image_url NOT NULL)
- display_order는 카테고리 내에서의 순서

---

## Entity Relationships

```
Store (1) ──── (N) Category
Category (1) ──── (N) MenuItem
Store (1) ──── (N) MenuItem
```

- Store → Category: 1:N (매장은 여러 카테고리를 가짐)
- Category → MenuItem: 1:N (카테고리는 여러 메뉴를 가짐)
- Store → MenuItem: 1:N (매장은 여러 메뉴를 가짐, store_id로 직접 참조)

---

## 이미지 파일 저장 구조

```
packages/backend/uploads/
└── {store_id}/
    └── menus/
        └── {uuid}.{ext}    # 예: black-marble/menus/a1b2c3d4.png
```

- 파일명: UUID v4로 생성 (충돌 방지)
- 허용 확장자: .jpg, .jpeg, .png
- 최대 파일 크기: 5MB
- image_url 저장 형식: `/uploads/{store_id}/menus/{filename}`
