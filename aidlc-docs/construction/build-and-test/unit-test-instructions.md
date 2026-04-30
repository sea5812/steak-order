# Unit Test Execution - Unit 3: Order Domain

## Test Framework
- **Framework**: Vitest
- **DB**: 인메모리 SQLite (better-sqlite3 `:memory:`)
- **Mock**: vitest vi.fn(), vi.mock()

## Run Unit Tests

### 1. Execute All Unit Tests

```bash
cd packages/backend
npx vitest run
```

또는 특정 테스트만:

```bash
# 유틸리티 테스트
npx vitest run tests/utils/

# SSE 테스트
npx vitest run tests/sse/

# Repository 테스트
npx vitest run tests/repositories/

# Service 테스트
npx vitest run tests/services/

# Controller 테스트
npx vitest run tests/controllers/
```

### 2. Review Test Results

**Expected**: 전체 테스트 통과, 0 failures

| 테스트 파일 | 예상 테스트 수 | 설명 |
|---|---|---|
| `tests/utils/retry.test.ts` | 4 | withRetry 재시도 로직 |
| `tests/utils/validators.test.ts` | 10+ | 입력 검증 헬퍼 |
| `tests/utils/order-number.test.ts` | 6 | 주문번호 생성 |
| `tests/sse/sse-manager.test.ts` | 10+ | SSE 연결 관리, heartbeat |
| `tests/services/sse.service.test.ts` | 8 | SSE 이벤트 위임 |
| `tests/repositories/order.repository.test.ts` | 8+ | Order CRUD (인메모리 DB) |
| `tests/repositories/table.repository.test.ts` | 8+ | Table CRUD (인메모리 DB) |
| `tests/services/order.service.test.ts` | 8+ | 주문 비즈니스 로직 |
| `tests/services/table.service.test.ts` | 8+ | 테이블 비즈니스 로직 |
| `tests/controllers/order.controller.test.ts` | 6+ | 주문 HTTP 핸들러 |
| `tests/controllers/table.controller.test.ts` | 4+ | 테이블 HTTP 핸들러 |

### 3. Vitest 설정

`packages/backend/vitest.config.ts` (없으면 생성):

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

### 4. Fix Failing Tests

테스트 실패 시:
1. 에러 메시지에서 실패 원인 확인
2. Repository 테스트: 인메모리 DB 스키마가 실제 스키마와 일치하는지 확인
3. Service 테스트: mock 객체의 반환값이 올바른지 확인
4. Controller 테스트: req/res mock 구조가 Express 인터페이스와 일치하는지 확인
5. 수정 후 `npx vitest run` 재실행
