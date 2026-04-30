# Business Rules - Unit 2: Menu Domain

---

## 검증 규칙 (Validation Rules)

### Category 검증

| 규칙 ID | 필드 | 규칙 | 에러 메시지 |
|---|---|---|---|
| CAT-V01 | name | 필수, 빈 문자열 불가 | "카테고리명은 필수입니다" |
| CAT-V02 | name | 동일 매장 내 중복 불가 | "이미 존재하는 카테고리명입니다" |
| CAT-V03 | name | 최대 50자 | "카테고리명은 50자 이내여야 합니다" |

### MenuItem 검증

| 규칙 ID | 필드 | 규칙 | 에러 메시지 |
|---|---|---|---|
| MENU-V01 | name | 필수, 빈 문자열 불가 | "메뉴명은 필수입니다" |
| MENU-V02 | name | 최대 100자 | "메뉴명은 100자 이내여야 합니다" |
| MENU-V03 | price | 필수, 0 이상 정수 | "가격은 0 이상이어야 합니다" |
| MENU-V04 | price | 최대 10,000,000 (천만원) | "가격이 허용 범위를 초과합니다" |
| MENU-V05 | categoryId | 필수, 해당 매장에 존재하는 카테고리 | "유효하지 않은 카테고리입니다" |
| MENU-V06 | description | 선택, 최대 500자 | "설명은 500자 이내여야 합니다" |
| MENU-V07 | imageFile | 등록 시 필수 | "메뉴 이미지는 필수입니다" |
| MENU-V08 | imageFile | 최대 5MB | "이미지 파일 크기는 5MB 이하여야 합니다" |
| MENU-V09 | imageFile | JPEG/PNG만 허용 | "이미지는 JPEG 또는 PNG 형식만 허용됩니다" |

### Reorder 검증

| 규칙 ID | 대상 | 규칙 | 에러 메시지 |
|---|---|---|---|
| ORD-V01 | categoryOrders | 빈 배열 불가 | "순서 변경할 항목이 없습니다" |
| ORD-V02 | categoryOrders | 모든 ID가 해당 매장 소속 | "유효하지 않은 카테고리가 포함되어 있습니다" |
| ORD-V03 | menuOrders | 빈 배열 불가 | "순서 변경할 항목이 없습니다" |
| ORD-V04 | menuOrders | 모든 ID가 해당 매장 소속 | "유효하지 않은 메뉴가 포함되어 있습니다" |

---

## 비즈니스 규칙 (Business Rules)

### BR-01: 카테고리 삭제 제한
- **규칙**: 카테고리에 1개 이상의 메뉴가 소속되어 있으면 삭제 불가
- **이유**: 데이터 무결성 보호, 실수로 인한 메뉴 손실 방지
- **HTTP 상태**: 409 Conflict
- **에러 메시지**: "해당 카테고리에 메뉴가 존재하여 삭제할 수 없습니다. 메뉴를 먼저 이동하거나 삭제해 주세요."

### BR-02: 이미지 필수 등록
- **규칙**: 메뉴 등록 시 이미지 파일 업로드 필수
- **이유**: 고객 UI에서 메뉴 이미지가 항상 표시되어야 함
- **예외**: 메뉴 수정 시에는 이미지 변경 선택 (기존 이미지 유지 가능)

### BR-03: 이미지 파일 관리
- **규칙**: 메뉴 삭제 또는 이미지 교체 시 기존 이미지 파일을 파일 시스템에서 삭제
- **이유**: 불필요한 파일 축적 방지
- **예외**: 파일 삭제 실패 시 로그만 남기고 비즈니스 로직은 계속 진행 (soft failure)

### BR-04: Display Order 자동 할당
- **규칙**: 새 카테고리/메뉴 생성 시 display_order를 자동으로 마지막 순서로 할당
- **계산**: 현재 최대 display_order + 1
- **초기값**: 첫 항목은 display_order = 0

### BR-05: Display Order 재정렬
- **규칙**: 삭제 후 display_order에 gap이 생기면 재정렬하지 않음 (성능 고려)
- **이유**: reorder API를 통해 명시적으로 순서를 관리하므로, 삭제 시 자동 재정렬 불필요
- **수정**: 삭제 후 자동 재정렬하지 않고, 조회 시 display_order 순으로 정렬만 수행

### BR-06: 매장 격리 (Store Isolation)
- **규칙**: 모든 조회/수정/삭제 작업은 storeId 기반으로 격리
- **이유**: 멀티테넌트 확장성 확보
- **검증**: 요청된 리소스의 store_id가 인증된 사용자의 store_id와 일치하는지 확인

---

## 에러 처리 시나리오

| 시나리오 | HTTP 상태 | 에러 코드 | 설명 |
|---|---|---|---|
| 카테고리 미존재 | 404 | CATEGORY_NOT_FOUND | 요청한 카테고리가 존재하지 않음 |
| 메뉴 미존재 | 404 | MENU_NOT_FOUND | 요청한 메뉴가 존재하지 않음 |
| 카테고리명 중복 | 409 | CATEGORY_NAME_DUPLICATE | 동일 매장 내 카테고리명 중복 |
| 카테고리 삭제 불가 | 409 | CATEGORY_HAS_MENUS | 소속 메뉴가 있어 삭제 불가 |
| 입력 검증 실패 | 400 | VALIDATION_ERROR | 필수 필드 누락 또는 형식 오류 |
| 이미지 크기 초과 | 400 | IMAGE_TOO_LARGE | 5MB 초과 |
| 이미지 형식 오류 | 400 | IMAGE_INVALID_FORMAT | JPEG/PNG 외 형식 |
| 권한 없음 | 401 | UNAUTHORIZED | 인증 토큰 없음 또는 만료 |
| 접근 거부 | 403 | FORBIDDEN | 해당 매장 리소스에 대한 권한 없음 |
| 서버 에러 | 500 | INTERNAL_ERROR | 예상치 못한 서버 오류 |

---

## API 엔드포인트 상세

### GET /api/stores/:storeId/categories
- **Auth**: Table 또는 Admin
- **Response**: `{ categories: Category[] }`

### POST /api/stores/:storeId/categories
- **Auth**: Admin
- **Body**: `{ name: string }`
- **Response**: `{ category: Category }` (201 Created)

### PUT /api/stores/:storeId/categories/:id
- **Auth**: Admin
- **Body**: `{ name: string }`
- **Response**: `{ category: Category }`

### DELETE /api/stores/:storeId/categories/:id
- **Auth**: Admin
- **Response**: 204 No Content

### PUT /api/stores/:storeId/categories/reorder
- **Auth**: Admin
- **Body**: `{ categoryIds: number[] }`
- **Response**: 204 No Content

### GET /api/stores/:storeId/menus
- **Auth**: Table 또는 Admin
- **Query**: `?categoryId=number` (optional)
- **Response**: `{ menus: MenuItem[] }`

### GET /api/stores/:storeId/menus/:id
- **Auth**: Table 또는 Admin
- **Response**: `{ menu: MenuItem }`

### POST /api/stores/:storeId/menus
- **Auth**: Admin
- **Content-Type**: multipart/form-data
- **Body**: `name, price, description?, categoryId, image (file)`
- **Response**: `{ menu: MenuItem }` (201 Created)

### PUT /api/stores/:storeId/menus/:id
- **Auth**: Admin
- **Content-Type**: multipart/form-data
- **Body**: `name, price, description?, categoryId, image? (file, optional)`
- **Response**: `{ menu: MenuItem }`

### DELETE /api/stores/:storeId/menus/:id
- **Auth**: Admin
- **Response**: 204 No Content

### PUT /api/stores/:storeId/menus/reorder
- **Auth**: Admin
- **Body**: `{ menuIds: number[] }`
- **Response**: 204 No Content
