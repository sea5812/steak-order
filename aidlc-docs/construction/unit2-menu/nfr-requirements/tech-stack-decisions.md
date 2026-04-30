# Tech Stack Decisions - Unit 2: Menu Domain

---

## 기술 스택 (프로젝트 전체 결정 사항 준수)

| 구성 요소 | 기술 | Unit 2 사용 목적 |
|---|---|---|
| Runtime | Node.js + TypeScript | 서버 로직 구현 |
| Framework | Express | REST API 라우팅, 미들웨어 |
| ORM | Drizzle ORM | Category, MenuItem 테이블 CRUD |
| Database | SQLite (better-sqlite3) | 메뉴/카테고리 데이터 저장 |
| File Upload | multer | 이미지 파일 업로드 처리 |
| UUID | uuid (v4) | 이미지 파일명 생성 |
| File System | Node.js fs/promises | 이미지 파일 저장/삭제 |
| Testing | Vitest | 단위 테스트 |

---

## Unit 2 고유 의존성

### 런타임 의존성
| 패키지 | 버전 | 용도 |
|---|---|---|
| multer | ^1.4.5-lts.1 | multipart/form-data 파일 업로드 |
| uuid | ^9.0.0 | 이미지 파일명 UUID 생성 |

### 개발 의존성
| 패키지 | 버전 | 용도 |
|---|---|---|
| @types/multer | ^1.4.11 | multer 타입 정의 |
| @types/uuid | ^9.0.0 | uuid 타입 정의 |

---

## Unit 1 (Foundation) 의존 항목

Unit 2는 Unit 1에서 제공하는 다음 항목에 의존합니다:

| 항목 | 파일 | 용도 |
|---|---|---|
| DB 스키마 | db/schema.ts | categories, menu_items 테이블 정의 |
| DB 연결 | db/index.ts | Drizzle ORM 인스턴스 |
| authMiddleware | middleware/auth.ts | Admin 인증 검증 |
| tableAuthMiddleware | middleware/auth.ts | Table 인증 검증 |
| errorHandler | middleware/error-handler.ts | 글로벌 에러 처리 |
| 타입 정의 | types/index.ts | 공유 타입 |
| Express 앱 | index.ts | 라우터 등록 |

---

## 설계 결정 요약

| 결정 사항 | 선택 | 이유 |
|---|---|---|
| DB 캐싱 | 없음 | SQLite 로컬, 조회 성능 충분 |
| 이미지 서빙 | Express static | 단순, 로컬 환경에 적합 |
| 동시 수정 | Last-write-wins | 관리자 소수, 충돌 가능성 극히 낮음 |
| 이미지 저장 | 로컬 파일 시스템 | 외부 의존성 없음, 요구사항 준수 |
| 파일명 전략 | UUID v4 | 충돌 방지, 보안 (path traversal 차단) |
