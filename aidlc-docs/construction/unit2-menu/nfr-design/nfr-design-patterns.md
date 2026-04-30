# NFR Design Patterns - Unit 2: Menu Domain

---

## 1. 레이어드 아키텍처 패턴 (Layered Architecture)

```
MenuController (HTTP 요청/응답)
       │
       v
MenuService (비즈니스 로직)
       │
       v
MenuRepository (데이터 접근, Drizzle ORM)
       │
       v
SQLite Database
```

- **Controller**: 입력 검증, 요청 파싱, 응답 포맷팅
- **Service**: 비즈니스 규칙 적용, 파일 처리 오케스트레이션
- **Repository**: SQL 쿼리 실행, 데이터 매핑

---

## 2. 파일 업로드 패턴

### Multer Middleware 체인

```
Request (multipart/form-data)
       │
       v
multer (fileFilter + limits)
  ├─ MIME 검증 (image/jpeg, image/png)
  ├─ 크기 제한 (5MB)
  └─ 임시 저장 (메모리 버퍼)
       │
       v
Controller (파일 + body 수신)
       │
       v
Service (UUID 파일명 생성 → 디스크 저장)
```

### 설계 결정
- **multer storage**: `memoryStorage()` 사용 → Service에서 직접 파일 저장
- **이유**: 파일명을 UUID로 생성해야 하므로 Service 레이어에서 저장 제어
- **대안 고려**: `diskStorage()`는 파일명 생성을 multer에 위임하지만, 비즈니스 로직과 분리가 어려움

---

## 3. 에러 처리 패턴

### 커스텀 에러 클래스

```typescript
// 비즈니스 에러 → HTTP 상태 코드 매핑
AppError (base)
├── NotFoundError (404)
├── ConflictError (409)
├── ValidationError (400)
└── ForbiddenError (403)
```

### 에러 흐름
```
Service에서 비즈니스 에러 throw
       │
       v
Controller에서 catch하지 않음 (pass-through)
       │
       v
errorHandler 미들웨어 (Unit 1)에서 일괄 처리
       │
       v
일관된 JSON 에러 응답
```

---

## 4. 트랜잭션 패턴

### Reorder 작업

```typescript
// Drizzle ORM 트랜잭션
db.transaction((tx) => {
  for (const [index, id] of ids.entries()) {
    tx.update(table).set({ displayOrder: index }).where(eq(table.id, id));
  }
});
```

- **적용 대상**: `reorderCategories`, `reorderMenus`
- **이유**: 순서 변경은 여러 레코드를 동시에 업데이트하므로 원자성 보장 필요

---

## 5. 파일 정합성 패턴 (Soft Failure)

### 메뉴 삭제 시 이미지 처리

```
1. DB에서 메뉴 레코드 삭제 (트랜잭션)
2. 파일 시스템에서 이미지 삭제 시도
   ├─ 성공 → 완료
   └─ 실패 → 로그 기록, 비즈니스 로직은 성공 처리
```

- **이유**: 파일 삭제 실패가 비즈니스 로직을 중단시키면 안 됨
- **트레이드오프**: 고아 파일이 남을 수 있으나, MVP에서는 허용

### 메뉴 생성 시 이미지 처리

```
1. 이미지 파일 디스크 저장
   ├─ 성공 → DB에 메뉴 레코드 생성
   │         ├─ 성공 → 완료
   │         └─ 실패 → 저장된 이미지 파일 삭제 (롤백)
   └─ 실패 → 에러 반환
```

- **이유**: 이미지는 저장되었는데 DB 저장 실패 시 고아 파일 방지

---

## 6. 입력 검증 패턴

### 2단계 검증

```
1단계: Controller (형식 검증)
  - 필수 필드 존재 여부
  - 타입 검증 (string, number)
  - 범위 검증 (price >= 0, name.length <= 100)

2단계: Service (비즈니스 검증)
  - 카테고리명 중복 확인
  - categoryId 존재 확인
  - 카테고리 소속 메뉴 존재 확인 (삭제 시)
```

---

## 7. 정적 파일 서빙 패턴

```
Express App
  └─ express.static('/uploads', uploadsDir)
       └─ GET /uploads/{storeId}/menus/{uuid}.png
            → 파일 시스템에서 직접 서빙
```

- **설정 위치**: Unit 1의 Express 엔트리포인트 (index.ts)
- **Unit 2 책임**: 이미지 저장 경로 규칙 준수, image_url 필드에 접근 가능한 경로 저장
