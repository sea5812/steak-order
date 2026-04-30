# Business Logic Model - Unit 2: Menu Domain

---

## MenuService 메서드별 비즈니스 로직

### 1. getCategories(storeId)
**목적**: 매장의 카테고리 목록 조회

**로직**:
1. storeId로 카테고리 목록 조회
2. display_order 오름차순 정렬
3. 카테고리 목록 반환

**Input**: storeId (string)
**Output**: Category[]

---

### 2. createCategory(storeId, data)
**목적**: 새 카테고리 생성

**로직**:
1. 입력 검증 (name 필수)
2. 동일 매장 내 카테고리명 중복 확인
3. display_order 자동 할당 (현재 최대값 + 1)
4. 카테고리 생성 및 저장
5. 생성된 카테고리 반환

**Input**: storeId (string), data: { name: string }
**Output**: Category

---

### 3. updateCategory(storeId, categoryId, data)
**목적**: 카테고리 정보 수정

**로직**:
1. categoryId로 카테고리 존재 확인
2. 매장 소속 확인 (storeId 일치)
3. 입력 검증 (name 필수)
4. 동일 매장 내 카테고리명 중복 확인 (자기 자신 제외)
5. 카테고리 정보 업데이트
6. 수정된 카테고리 반환

**Input**: storeId (string), categoryId (number), data: { name: string }
**Output**: Category

---

### 4. deleteCategory(storeId, categoryId)
**목적**: 카테고리 삭제

**로직**:
1. categoryId로 카테고리 존재 확인
2. 매장 소속 확인 (storeId 일치)
3. 해당 카테고리에 소속된 메뉴 존재 여부 확인
4. **메뉴가 있으면 삭제 불가** → 에러 반환 (409 Conflict)
5. 메뉴가 없으면 카테고리 삭제
6. 삭제 후 남은 카테고리의 display_order 재정렬 (gap 없이)

**Input**: storeId (string), categoryId (number)
**Output**: void

---

### 5. reorderCategories(storeId, categoryOrders)
**목적**: 카테고리 노출 순서 변경

**로직**:
1. categoryOrders 배열 검증 (빈 배열 불가)
2. 전달된 모든 categoryId가 해당 매장에 속하는지 확인
3. 배열 순서대로 display_order 업데이트 (index 0 → order 0, index 1 → order 1, ...)
4. 트랜잭션으로 일괄 업데이트

**Input**: storeId (string), categoryOrders: number[] (categoryId 배열, 순서대로)
**Output**: void

---

### 6. getMenusByStore(storeId, categoryId?)
**목적**: 매장 메뉴 목록 조회 (카테고리별 필터링 가능)

**로직**:
1. storeId로 메뉴 목록 조회
2. categoryId가 있으면 해당 카테고리 메뉴만 필터링
3. display_order 오름차순 정렬
4. 메뉴 목록 반환

**Input**: storeId (string), categoryId? (number, optional)
**Output**: MenuItem[]

---

### 7. getMenuById(storeId, menuId)
**목적**: 메뉴 상세 조회

**로직**:
1. menuId로 메뉴 조회
2. 매장 소속 확인 (storeId 일치)
3. 메뉴가 없으면 404 에러
4. 메뉴 상세 정보 반환

**Input**: storeId (string), menuId (number)
**Output**: MenuItem

---

### 8. createMenu(storeId, data, imageFile)
**목적**: 새 메뉴 등록 (이미지 업로드 포함)

**로직**:
1. 입력 검증 (name, price, categoryId, imageFile 필수)
2. 가격 검증 (0 이상 정수)
3. categoryId가 해당 매장에 존재하는지 확인
4. 이미지 파일 검증:
   - 파일 크기 ≤ 5MB
   - MIME 타입: image/jpeg 또는 image/png
5. 이미지 파일 저장 (UUID 파일명 생성)
6. display_order 자동 할당 (해당 카테고리 내 최대값 + 1)
7. 메뉴 정보 DB 저장
8. 생성된 메뉴 반환

**Input**: storeId (string), data: { name, price, description?, categoryId }, imageFile: File
**Output**: MenuItem

---

### 9. updateMenu(storeId, menuId, data, imageFile?)
**목적**: 메뉴 정보 수정

**로직**:
1. menuId로 메뉴 존재 확인
2. 매장 소속 확인 (storeId 일치)
3. 입력 검증 (name, price, categoryId 필수)
4. 가격 검증 (0 이상 정수)
5. categoryId가 해당 매장에 존재하는지 확인
6. 이미지 파일이 있으면:
   - 파일 검증 (크기, MIME 타입)
   - 새 이미지 저장
   - 기존 이미지 파일 삭제
   - image_url 업데이트
7. 메뉴 정보 업데이트
8. 수정된 메뉴 반환

**Input**: storeId (string), menuId (number), data: { name, price, description?, categoryId }, imageFile?: File
**Output**: MenuItem

---

### 10. deleteMenu(storeId, menuId)
**목적**: 메뉴 삭제

**로직**:
1. menuId로 메뉴 존재 확인
2. 매장 소속 확인 (storeId 일치)
3. 이미지 파일 삭제 (파일 시스템에서)
4. 메뉴 DB 레코드 삭제
5. 삭제 후 해당 카테고리 내 display_order 재정렬

**Input**: storeId (string), menuId (number)
**Output**: void

---

### 11. reorderMenus(storeId, menuOrders)
**목적**: 메뉴 노출 순서 변경

**로직**:
1. menuOrders 배열 검증 (빈 배열 불가)
2. 전달된 모든 menuId가 해당 매장에 속하는지 확인
3. 배열 순서대로 display_order 업데이트
4. 트랜잭션으로 일괄 업데이트

**Input**: storeId (string), menuOrders: number[] (menuId 배열, 순서대로)
**Output**: void

---

## 서비스 의존성

| 의존 대상 | 용도 |
|---|---|
| MenuRepository | 데이터 접근 (Category, MenuItem CRUD) |
| 파일 시스템 (fs) | 이미지 파일 저장/삭제 |
