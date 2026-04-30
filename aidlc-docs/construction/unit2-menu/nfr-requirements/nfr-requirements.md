# NFR Requirements - Unit 2: Menu Domain

---

## 1. 성능 요구사항 (Performance)

| 항목 | 요구사항 | 근거 |
|---|---|---|
| 메뉴 조회 API 응답 시간 | 500ms 이내 | 요구사항 NFR-01 |
| 메뉴 CRUD API 응답 시간 | 1초 이내 | 이미지 업로드 포함 |
| 이미지 업로드 처리 | 3초 이내 (5MB 기준) | 파일 I/O 포함 |
| 이미지 서빙 | Express static middleware | 로컬 환경, 별도 캐싱 불필요 |
| DB 캐싱 | 없음 (직접 조회) | SQLite 로컬 파일 DB, 네트워크 지연 없음 |
| 동시 접속 | 테이블 50개 + 관리자 5명 | 요구사항 NFR-01 |

### 성능 설계 결정
- **캐싱 없음**: SQLite는 로컬 파일 기반이라 조회 성능이 충분 (1ms 이내)
- **이미지 서빙**: Express `express.static()` 미들웨어로 직접 서빙
- **동시 수정**: Last-write-wins 방식 (관리자 2~5명, 충돌 가능성 극히 낮음)

---

## 2. 보안 요구사항 (Security)

| 항목 | 요구사항 | 구현 방식 |
|---|---|---|
| API 인증 | JWT 토큰 기반 | Unit 1 (Foundation)에서 제공하는 authMiddleware 사용 |
| 인가 (조회) | Table 또는 Admin 역할 | tableAuthMiddleware 또는 authMiddleware |
| 인가 (CRUD) | Admin 역할만 허용 | authMiddleware (admin role 검증) |
| 매장 격리 | storeId 기반 데이터 격리 | 모든 쿼리에 store_id 조건 포함 |
| 파일 업로드 보안 | MIME 타입 + 확장자 검증 | multer fileFilter로 JPEG/PNG만 허용 |
| 파일 크기 제한 | 최대 5MB | multer limits 설정 |
| 파일명 보안 | UUID로 파일명 생성 | 원본 파일명 사용하지 않음 (path traversal 방지) |
| 업로드 경로 | 지정된 디렉토리만 허용 | uploads/{storeId}/menus/ 고정 경로 |

### 보안 설계 결정
- **파일명**: UUID v4로 생성하여 원본 파일명 노출 방지 및 path traversal 공격 차단
- **MIME 검증**: multer의 fileFilter에서 `image/jpeg`, `image/png`만 허용
- **인증/인가**: Unit 1에서 제공하는 미들웨어에 의존 (직접 구현하지 않음)

---

## 3. 데이터 무결성 (Data Integrity)

| 항목 | 요구사항 | 구현 방식 |
|---|---|---|
| 카테고리 삭제 보호 | 소속 메뉴 존재 시 삭제 불가 | 삭제 전 메뉴 존재 여부 확인 |
| 순서 변경 원자성 | reorder 작업의 트랜잭션 처리 | Drizzle ORM 트랜잭션 사용 |
| 이미지-DB 정합성 | 메뉴 삭제 시 이미지 파일도 삭제 | 파일 삭제 실패 시 로그만 남김 (soft failure) |
| 외래키 무결성 | category_id 참조 무결성 | DB 레벨 FK 제약조건 |

---

## 4. 가용성 (Availability)

| 항목 | 요구사항 | 근거 |
|---|---|---|
| 서비스 가용성 | 매장 영업 시간 동안 안정 운영 | 요구사항 NFR-02 |
| 에러 복구 | 이미지 저장 실패 시 DB 롤백 | 트랜잭션 처리 |
| 파일 시스템 에러 | 이미지 삭제 실패 시 비즈니스 로직 계속 | soft failure 패턴 |

---

## 5. 확장성 (Scalability)

| 항목 | 요구사항 | 구현 방식 |
|---|---|---|
| 멀티테넌트 | store_id 기반 데이터 격리 | 모든 엔티티에 store_id 포함 |
| 이미지 저장 | 매장별 디렉토리 분리 | uploads/{storeId}/menus/ |

---

## 6. 유지보수성 (Maintainability)

| 항목 | 요구사항 | 구현 방식 |
|---|---|---|
| 레이어 분리 | Controller → Service → Repository | 3-tier 아키텍처 |
| 에러 처리 | 일관된 에러 응답 형식 | Unit 1의 errorHandler 미들웨어 사용 |
| 타입 안전성 | TypeScript strict mode | 모든 인터페이스/타입 명시적 정의 |
