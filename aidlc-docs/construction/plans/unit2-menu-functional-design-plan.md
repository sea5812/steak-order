# Functional Design Plan - Unit 2: Menu Domain

## Unit Context
- **Unit Name**: Unit 2 - Menu Domain (메뉴 관리)
- **담당 Stories**: US-C02 (메뉴 조회 및 탐색), US-A05 (메뉴 관리)
- **범위**: 메뉴/카테고리 CRUD, 이미지 업로드, 메뉴 순서 관리
- **컴포넌트**: MenuController, MenuService, MenuRepository

---

## Plan Steps

- [x] Step 1: 도메인 엔티티 정의 (Category, MenuItem)
- [x] Step 2: 비즈니스 로직 모델 정의 (MenuService 메서드별 로직)
- [x] Step 3: 비즈니스 규칙 및 검증 로직 정의
- [x] Step 4: API 엔드포인트 상세 설계 (Request/Response 스키마)
- [x] Step 5: 에러 처리 시나리오 정의
- [x] Step 6: Functional Design 문서 생성

---

## Questions

### Q1: 카테고리 관리 범위
카테고리 CRUD에서 카테고리 삭제 시 해당 카테고리에 속한 메뉴 항목은 어떻게 처리해야 하나요?

A) 카테고리에 메뉴가 있으면 삭제 불가 (에러 반환)
B) 카테고리 삭제 시 소속 메뉴도 함께 삭제 (Cascade)
C) 카테고리 삭제 시 소속 메뉴를 "미분류" 카테고리로 이동

[Answer]: A

### Q2: 메뉴 이미지 업로드 제약
이미지 업로드 시 파일 크기 제한과 허용 포맷은 어떻게 설정할까요?

A) 최대 5MB, JPEG/PNG만 허용
B) 최대 10MB, JPEG/PNG/WebP 허용
C) 제한 없음 (constraints.md에서 이미지 리사이징 제외이므로 원본 그대로 저장)

[Answer]: A

### Q3: 메뉴 순서 변경 방식
메뉴 순서 변경(reorder) API의 동작 방식은 어떻게 할까요?

A) 전체 메뉴 ID 배열을 순서대로 전송 (전체 재정렬)
B) 특정 메뉴의 새 위치(index)만 전송 (단일 이동)
C) 두 메뉴의 ID를 전송하여 위치 교환 (swap)

[Answer]: A

### Q4: 카테고리 순서 관리
카테고리에도 노출 순서(display_order)가 있는데, 카테고리 순서 변경 API도 필요한가요?

A) 예, 카테고리도 순서 변경 API 필요
B) 아니오, 카테고리는 생성 순서대로 고정

[Answer]: A

### Q5: 메뉴 이미지 필수 여부
메뉴 등록 시 이미지는 필수인가요, 선택인가요?

A) 필수 (이미지 없이 메뉴 등록 불가)
B) 선택 (이미지 없이도 메뉴 등록 가능, 기본 이미지 또는 빈 상태)

[Answer]: A

