# Build Instructions - Unit 3: Order Domain

## Prerequisites
- **Runtime**: Node.js 18+ (LTS)
- **Package Manager**: npm 9+
- **Dependencies**: better-sqlite3, express, bcrypt (Unit 1에서 설치)
- **Dev Dependencies**: vitest, typescript (Unit 1에서 설치)

## Build Steps

### 1. Install Dependencies

Unit 1(Foundation)이 먼저 설치되어 있어야 합니다. 워크스페이스 루트에서:

```bash
npm install
```

또는 backend 패키지만:

```bash
cd packages/backend
npm install
```

Unit 3 추가 dev dependency (Unit 1에서 미설치 시):

```bash
cd packages/backend
npm install -D vitest
```

### 2. Configure Environment

별도 환경 변수 불필요 (SQLite 파일 기반, 로컬 서버).

### 3. TypeScript 컴파일

```bash
cd packages/backend
npx tsc --noEmit
```

또는 package.json에 스크립트가 있다면:

```bash
npm run build
```

### 4. Verify Build Success

- **Expected Output**: 컴파일 에러 없음
- **Build Artifacts**: `packages/backend/dist/` (tsc 출력)
- **Common Warnings**: 
  - `better-sqlite3` native module 관련 경고는 정상
  - `bcrypt` 관련 경고는 Unit 1 설치 시 해결됨

## Troubleshooting

### TypeScript 컴파일 에러
- **원인**: Unit 1의 DB 스키마 타입과 불일치
- **해결**: `src/types/order.types.ts`의 엔티티 타입이 Unit 1의 Drizzle 스키마와 일치하는지 확인

### better-sqlite3 설치 실패
- **원인**: native module 빌드 도구 미설치
- **해결**: `npm install -g node-gyp` 후 재시도. macOS: `xcode-select --install`

### Module Resolution 에러
- **원인**: ESM/CJS 모듈 시스템 불일치
- **해결**: `tsconfig.json`에서 `"module": "ESNext"`, `"moduleResolution": "bundler"` 확인. 파일 import에 `.js` 확장자 포함 확인.
