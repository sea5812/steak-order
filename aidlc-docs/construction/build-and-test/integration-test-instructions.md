# Integration Test Instructions - Unit 2: Menu Domain

## 통합 테스트 시나리오

Unit 2는 단독 유닛이므로, 통합 테스트는 API 엔드포인트를 실제 DB와 함께 테스트합니다.

---

## 사전 준비

1. 서버 실행: `npm run dev:backend`
2. DB 초기화 완료 (build-instructions.md 참조)

---

## 테스트 시나리오

### 시나리오 1: 카테고리 CRUD 플로우

```bash
# 인증 토큰 생성 (Base64 encoded JSON)
TOKEN=$(echo -n '{"storeId":"black-marble","role":"admin","adminId":1}' | base64)

# 1. 카테고리 생성
curl -X POST http://localhost:3000/api/stores/black-marble/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Appetizers"}'
# 기대: 201, category 객체 반환

# 2. 카테고리 목록 조회
curl http://localhost:3000/api/stores/black-marble/categories \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200, categories 배열

# 3. 카테고리 수정
curl -X PUT http://localhost:3000/api/stores/black-marble/categories/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Starters"}'
# 기대: 200, 수정된 category

# 4. 카테고리 삭제 (메뉴 없을 때)
curl -X DELETE http://localhost:3000/api/stores/black-marble/categories/1 \
  -H "Authorization: Bearer $TOKEN"
# 기대: 204
```

### 시나리오 2: 메뉴 CRUD 플로우

```bash
TOKEN=$(echo -n '{"storeId":"black-marble","role":"admin","adminId":1}' | base64)

# 1. 카테고리 먼저 생성
curl -X POST http://localhost:3000/api/stores/black-marble/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prime Steaks"}'

# 2. 메뉴 등록 (이미지 포함)
curl -X POST http://localhost:3000/api/stores/black-marble/menus \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=포터하우스 스테이크" \
  -F "price=198000" \
  -F "description=USDA 프라임 드라이에이징 포터하우스" \
  -F "categoryId=1" \
  -F "image=@/path/to/steak.jpg"
# 기대: 201, menu 객체 (imageUrl 포함)

# 3. 메뉴 목록 조회
curl http://localhost:3000/api/stores/black-marble/menus \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200, menus 배열

# 4. 메뉴 상세 조회
curl http://localhost:3000/api/stores/black-marble/menus/1 \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200, menu 객체

# 5. 메뉴 수정
curl -X PUT http://localhost:3000/api/stores/black-marble/menus/1 \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=포터하우스 (2인 이상)" \
  -F "price=210000" \
  -F "categoryId=1"
# 기대: 200, 수정된 menu

# 6. 메뉴 삭제
curl -X DELETE http://localhost:3000/api/stores/black-marble/menus/1 \
  -H "Authorization: Bearer $TOKEN"
# 기대: 204
```

### 시나리오 3: 순서 변경

```bash
TOKEN=$(echo -n '{"storeId":"black-marble","role":"admin","adminId":1}' | base64)

# 카테고리 순서 변경
curl -X PUT http://localhost:3000/api/stores/black-marble/categories/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categoryIds":[3,1,2]}'
# 기대: 204

# 메뉴 순서 변경
curl -X PUT http://localhost:3000/api/stores/black-marble/menus/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"menuIds":[5,3,1,2,4]}'
# 기대: 204
```

### 시나리오 4: 에러 케이스

```bash
TOKEN=$(echo -n '{"storeId":"black-marble","role":"admin","adminId":1}' | base64)

# 메뉴가 있는 카테고리 삭제 시도
curl -X DELETE http://localhost:3000/api/stores/black-marble/categories/1 \
  -H "Authorization: Bearer $TOKEN"
# 기대: 409, CATEGORY_HAS_MENUS

# 이미지 없이 메뉴 생성 시도
curl -X POST http://localhost:3000/api/stores/black-marble/menus \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Test" \
  -F "price=10000" \
  -F "categoryId=1"
# 기대: 400, IMAGE_REQUIRED

# 인증 없이 접근
curl http://localhost:3000/api/stores/black-marble/categories
# 기대: 401, UNAUTHORIZED
```

---

## 검증 기준

| 항목 | 기준 |
|---|---|
| 카테고리 CRUD | 생성/조회/수정/삭제 정상 동작 |
| 메뉴 CRUD | 이미지 업로드 포함 생성/조회/수정/삭제 정상 동작 |
| 순서 변경 | 카테고리/메뉴 reorder 정상 동작 |
| 인증/인가 | Admin만 CRUD 가능, Table은 조회만 가능 |
| 에러 처리 | 적절한 HTTP 상태 코드 및 에러 메시지 반환 |
| 이미지 서빙 | 업로드된 이미지가 /uploads/ 경로로 접근 가능 |
