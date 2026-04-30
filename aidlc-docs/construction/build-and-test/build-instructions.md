# Build Instructions - Unit 2: Menu Domain

## 사전 요구사항

| 항목 | 버전 | 설치 확인 |
|---|---|---|
| Node.js | >= 18.x | `node --version` |
| npm | >= 9.x | `npm --version` |

---

## 빌드 단계

### 1. 의존성 설치

```bash
cd black-marble-table
npm install
```

### 2. TypeScript 컴파일

```bash
npm run build:backend
```

### 3. 데이터베이스 초기화

SQLite DB는 서버 시작 시 자동 생성됩니다. 별도 마이그레이션은 Unit 1 (Foundation)에서 처리합니다.

현재 Unit 2 단독 실행 시에는 DB 테이블을 수동으로 생성해야 합니다:

```bash
cd packages/backend
npx tsx -e "
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = new Database(resolve('data', 'black-marble.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(\`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
\`);

console.log('✅ Database tables created successfully');
db.close();
"
```

### 4. 서버 실행

```bash
# 개발 모드 (hot reload)
npm run dev:backend

# 프로덕션 모드
npm run build:backend
cd packages/backend
node dist/index.js
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 5. Health Check

```bash
curl http://localhost:3000/health
# 응답: {"status":"ok","timestamp":"2026-04-30T..."}
```

---

## 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| PORT | 3000 | 서버 포트 |
| DB_PATH | ./data/black-marble.db | SQLite DB 파일 경로 |
