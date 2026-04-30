# NFR Requirements Plan - Unit 2: Menu Domain

## Unit Context
- **Unit Name**: Unit 2 - Menu Domain (메뉴 관리)
- **담당 Stories**: US-C02 (메뉴 조회), US-A05 (메뉴 관리 CRUD)
- **주요 특성**: 이미지 파일 업로드, CRUD 작업, 조회 성능

---

## Plan Steps

- [x] Step 1: 성능 요구사항 분석 (API 응답 시간, 이미지 서빙)
- [x] Step 2: 보안 요구사항 분석 (인증/인가, 파일 업로드 보안)
- [x] Step 3: 데이터 무결성 요구사항 분석
- [x] Step 4: 기술 스택 결정 확인
- [x] Step 5: NFR Requirements 문서 생성

---

## Questions

### Q1: 메뉴 조회 API 캐싱
메뉴 데이터는 자주 변경되지 않으므로 캐싱 전략이 필요할 수 있습니다. 어떻게 할까요?

A) 캐싱 없음 — 매번 DB에서 직접 조회 (단순, SQLite 로컬이므로 충분히 빠름)
B) 인메모리 캐싱 적용 — 메뉴 변경 시 캐시 무효화

[Answer]: A

### Q2: 이미지 서빙 방식
업로드된 이미지를 클라이언트에 제공하는 방식은?

A) Express static middleware로 직접 서빙 (단순)
B) 별도 이미지 서빙 경로 + Cache-Control 헤더 설정

[Answer]: A

### Q3: 동시 수정 충돌 처리
두 관리자가 동시에 같은 메뉴를 수정할 경우 어떻게 처리할까요?

A) Last-write-wins (마지막 저장이 우선, 단순)
B) Optimistic locking (updated_at 비교, 충돌 시 에러)

[Answer]: A

