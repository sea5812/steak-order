# Tech Stack Decisions - Unit 3: Order Domain

## 개요
Unit 3의 기술 스택 결정 사항. requirements.md에서 정의된 전체 기술 스택을 기반으로 Unit 3 특화 결정을 문서화한다.

---

## 1. 런타임 & 프레임워크

| 항목 | 선택 | 근거 |
|---|---|---|
| Runtime | Node.js (TypeScript) | 프로젝트 전체 기술 스택 |
| Framework | Express | 프로젝트 전체 기술 스택 |
| TypeScript | strict 모드 | 타입 안전성 확보 |

---

## 2. 데이터베이스 & ORM

| 항목 | 선택 | 근거 |
|---|---|---|
| Database | SQLite (better-sqlite3) | 프로젝트 전체 기술 스택, 동기식 API로 트랜잭션 간편 |
| ORM | Drizzle ORM | 프로젝트 전체 기술 스택, TypeScript 네이티브 |
| 트랜잭션 | Drizzle transaction API | SQLite 단일 트랜잭션으로 원자성 보장 |

### SQLite 특성 활용
- **단일 쓰기**: 동시 쓰기 충돌 없음 (주문번호 순번 보장)
- **WAL 모드**: 읽기/쓰기 동시 가능 (SSE 조회 중 주문 생성 가능)
- **동기식 API**: better-sqlite3의 동기식 특성으로 트랜잭션 코드 단순화

---

## 3. SSE (Server-Sent Events)

| 항목 | 선택 | 근거 |
|---|---|---|
| 구현 방식 | Express Response 직접 사용 | 외부 라이브러리 불필요, 구현 간단 |
| 연결 관리 | 인메모리 Map/Set | MVP 수준, 55개 동시 연결 충분 |
| Heartbeat | 30초 간격 | 프록시 타임아웃 방지 |
| 실패 처리 | 즉시 연결 제거 | heartbeat 전송 실패 시 |
| 재연결 | EventSource 기본 동작 | 클라이언트 측 자동 재연결 |

### SSE 구현 패턴
```typescript
// SSEManager 구조
class SSEManager {
  private adminClients: Map<number, Set<Response>>;    // storeId → admin connections
  private tableClients: Map<string, Response>;          // "storeId:tableId" → table connection
}
```

---

## 4. 테스트

| 항목 | 선택 | 근거 |
|---|---|---|
| 프레임워크 | Vitest | Vite 생태계 통합, 빠른 실행, TypeScript 네이티브 |
| 테스트 범위 | Service + Repository 단위 테스트 | 핵심 비즈니스 로직 커버리지 |
| Mock | vitest mock / vi.fn() | Vitest 내장 mock 기능 |
| DB 테스트 | 인메모리 SQLite | 테스트 격리, 빠른 실행 |

---

## 5. 에러 처리

| 항목 | 선택 | 근거 |
|---|---|---|
| 글로벌 핸들러 | Unit 1의 errorHandler 미들웨어 | 프로젝트 전체 일관성 |
| 커스텀 에러 | AppError 클래스 (statusCode, message) | 비즈니스 에러 구분 |
| 응답 형식 | `{ error: { code, message } }` | 클라이언트 파싱 용이 |

---

## 6. 트랜잭션 재시도

| 항목 | 선택 | 근거 |
|---|---|---|
| 재시도 전략 | 서버 측 자동 재시도 (최대 2회) | SQLite BUSY 에러 대응 |
| 재시도 대상 | 주문 생성, 이용 완료 트랜잭션 | 쓰기 충돌 가능성 있는 작업 |
| 재시도 간격 | 100ms 고정 | 단순 구현, SQLite 특성상 충분 |
| 실패 시 | 500 에러 반환 | 클라이언트에 재시도 안내 |

### 재시도 패턴
```typescript
async function withRetry<T>(fn: () => T, maxRetries = 2, delay = 100): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (isSQLiteBusyError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // non-retryable error
    }
  }
  throw new Error('Unreachable');
}
```

---

## 7. 로깅

| 항목 | 선택 | 근거 |
|---|---|---|
| 수준 | 최소 (에러만) | MVP 수준, 빠른 개발 우선 |
| 방식 | console.error | 외부 의존성 없음 |
| 형식 | `[timestamp] ERROR: message` | 기본 디버깅 정보 |
| 대상 | 트랜잭션 실패, 예외, SSE 전송 실패 | 핵심 에러만 |

---

## 8. 데이터 보존

| 항목 | 선택 | 근거 |
|---|---|---|
| OrderHistory 보존 | 90일 | 사용자 선택 |
| 구현 방식 | 조회 시 WHERE 필터링 | MVP 수준, 데이터는 계속 쌓임 |
| 정기 삭제 | 향후 구현 | MVP 범위 외 |

---

## 9. Unit 3 의존성 (npm packages)

### 직접 사용 (Unit 1에서 설치됨)
| 패키지 | 용도 | 버전 |
|---|---|---|
| express | HTTP 서버 | Unit 1에서 설치 |
| drizzle-orm | ORM | Unit 1에서 설치 |
| better-sqlite3 | SQLite 드라이버 | Unit 1에서 설치 |

### Unit 3 추가 설치 불필요
- SSE: Express Response 직접 사용 (추가 패키지 없음)
- 주문 로직: 순수 TypeScript (추가 패키지 없음)

### 개발 의존성
| 패키지 | 용도 |
|---|---|
| vitest | 테스트 프레임워크 |
| @types/better-sqlite3 | 타입 정의 (Unit 1에서 설치됨) |

---

## 10. 결정 요약

| 영역 | 결정 | 복잡도 |
|---|---|---|
| SSE 관리 | 인메모리 Map, heartbeat 30초, 실패 시 즉시 제거 | Low |
| 트랜잭션 | SQLite 단일 트랜잭션 + 재시도 2회 | Low |
| 테스트 | Vitest + 인메모리 SQLite | Low |
| 로깅 | console.error (에러만) | Low |
| 데이터 보존 | 90일 WHERE 필터링 | Low |
| 추가 패키지 | vitest만 (개발 의존성) | Low |

전체적으로 MVP에 적합한 단순하고 실용적인 기술 결정.
