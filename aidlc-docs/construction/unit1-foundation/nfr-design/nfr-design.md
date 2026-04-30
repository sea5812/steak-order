# NFR Design - Unit 1: Foundation

---

## 1. 프로젝트 구조 패턴

```
black-marble-table/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts              # Express 서버 엔트리
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Drizzle 스키마 (전체 테이블)
│   │   │   │   ├── index.ts          # DB 연결 (better-sqlite3 + drizzle)
│   │   │   │   ├── migrate.ts        # 마이그레이션 실행
│   │   │   │   └── seed.ts           # 시드 데이터
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # JWT 인증 미들웨어
│   │   │   │   └── error-handler.ts  # 글로벌 에러 핸들러
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── admin.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── admin.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── store.repository.ts
│   │   │   │   └── admin.repository.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── tests/
│   │   │   ├── auth.service.test.ts
│   │   │   └── admin.service.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/
│       ├── package.json
│       └── ... (Unit 4 담당)
├── package.json                # 워크스페이스 루트
├── tsconfig.base.json
└── .gitignore
```

## 2. DB 연결 패턴

```typescript
// db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('black-marble.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
```

## 3. 인증 미들웨어 패턴

```typescript
// middleware/auth.ts — 두 가지 미들웨어
// adminAuth: role === 'admin' 검증
// tableAuth: role === 'table' 검증
// 공통 로직: Bearer 토큰 추출 → jwt.verify → req.user 설정
```

## 4. 에러 핸들링 패턴

```typescript
// AppError 클래스: statusCode + code + message
// 글로벌 에러 핸들러: AppError → 구조화된 응답, 기타 → 500 Generic
// async 핸들러 래퍼: try/catch 자동화
```

## 5. 입력 검증 패턴

```typescript
// Zod 스키마로 요청 본문 검증
// 컨트롤러에서 schema.parse(req.body)
// ZodError → 400 Bad Request 자동 변환
```

## 6. 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| PORT | 3000 | 서버 포트 |
| JWT_SECRET | (필수) | JWT 서명 시크릿 |
| DB_PATH | ./black-marble.db | SQLite 파일 경로 |
| CORS_ORIGIN | http://localhost:5173 | 프론트엔드 origin |
| NODE_ENV | development | 환경 (development/production) |

## 7. 테스트 전략

- **테스트 프레임워크**: Vitest (Vite 생태계 통일)
- **단위 테스트 범위**:
  - AuthService: 로그인 성공/실패, 토큰 발급/검증, 시도 제한
  - AdminService: 계정 생성, 중복 검증, 목록 조회
- **테스트 DB**: 인메모리 SQLite (`:memory:`)로 격리
