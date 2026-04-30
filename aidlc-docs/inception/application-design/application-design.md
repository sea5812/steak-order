# Application Design 통합 문서 - Black Marble Table

이 문서는 Application Design 산출물의 통합 요약입니다. 상세 내용은 개별 문서를 참조하세요.

---

## 1. 아키텍처 개요

**모노레포 구조** (npm workspaces)로 Backend와 Frontend를 하나의 프로젝트에서 관리합니다.

| 레이어 | 기술 | 역할 |
|---|---|---|
| Frontend | React + TypeScript + Vite | 고객 주문 UI + 관리자 대시보드 |
| Backend | Express + TypeScript | REST API + SSE 서버 |
| ORM | Drizzle ORM | 타입 안전 데이터 접근 |
| Database | SQLite (better-sqlite3) | 데이터 저장 |

## 2. 컴포넌트 요약

### Backend (6 Controllers, 6 Services, 5 Repositories)
- **AuthController/Service**: 관리자 로그인, 테이블 인증, JWT 관리
- **AdminController/Service**: 관리자 계정 CRUD
- **MenuController/Service**: 메뉴/카테고리 CRUD, 이미지 업로드
- **OrderController/Service**: 주문 생성, 상태 변경, 삭제
- **TableController/Service**: 테이블 설정, 세션 관리, 이용 완료
- **SSEController/Service**: 실시간 이벤트 스트리밍

### Frontend (9 Pages, 8 Shared Components, 4 Hooks, 6 API Services)
- **고객 페이지 3개**: 메뉴, 주문 목록, 주문 내역
- **관리자 페이지 5개**: 로그인, 대시보드, 메뉴 관리, 테이블 관리, 계정 관리
- **설정 페이지 1개**: 태블릿 초기 설정

→ 상세: [components.md](components.md)

## 3. API 엔드포인트 요약

| 영역 | 엔드포인트 수 | 인증 |
|---|---|---|
| Auth | 2 | None |
| Admin | 2 | Admin JWT |
| Menu | 8 | Table/Admin JWT |
| Order | 5 | Table/Admin JWT |
| Table | 5 | Admin JWT |
| SSE | 2 | Admin/Table JWT |
| **합계** | **24** | |

→ 상세: [component-methods.md](component-methods.md)

## 4. 핵심 서비스 흐름

1. **주문 생성**: Customer → OrderController → OrderService → DB + SSE → Admin
2. **주문 상태 변경**: Admin → OrderController → OrderService → DB + SSE → Customer
3. **이용 완료**: Admin → TableController → TableService → 주문 이력 이동 + 세션 리셋
4. **SSE 이벤트**: order:new, order:updated, order:deleted, table:completed, order:statusChanged

→ 상세: [services.md](services.md)

## 5. 의존성 구조

- Controller → Service → Repository → Database (단방향)
- SSEService는 인메모리 클라이언트 풀 관리 (DB 의존 없음)
- OrderService가 가장 많은 의존성 (TableService, SSEService, MenuRepository, OrderRepository)

→ 상세: [component-dependency.md](component-dependency.md)
