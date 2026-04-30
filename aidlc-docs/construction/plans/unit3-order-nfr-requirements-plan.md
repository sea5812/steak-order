# NFR Requirements Plan - Unit 3: Order Domain

## Unit 3 개요
- **범위**: 주문 CRUD, 테이블 세션 관리, SSE 실시간 통신, 이용 완료
- **핵심 컴포넌트**: OrderController/Service/Repository, TableController/Service/Repository, SSEController/Service/SSEManager
- **기존 NFR 참조**: requirements.md의 NFR-01~05

---

## Plan Checklist

### Part 1: 질문 수집 및 분석
- [x] Step 1: Functional Design 분석 완료
- [x] Step 2: NFR 질문 생성 및 사용자 답변 수집
- [x] Step 3: 답변 분석 및 모호성 확인 (모호성 없음)

### Part 2: NFR Requirements 산출물 생성
- [x] Step 4: NFR Requirements 문서 생성
  - [x] 4.1: 성능 요구사항 (응답 시간, 처리량)
  - [x] 4.2: 가용성 요구사항 (SSE 연결 안정성)
  - [x] 4.3: 확장성 요구사항 (동시 접속, 데이터 증가)
  - [x] 4.4: 신뢰성 요구사항 (트랜잭션, 에러 처리)
  - [x] 4.5: 유지보수성 요구사항 (로깅, 모니터링)
- [x] Step 5: Tech Stack Decisions 문서 생성

### Part 3: 승인
- [x] Step 6: 산출물 제시 및 사용자 승인 완료
- [x] Step 7: 승인 기록 및 상태 업데이트

---

## NFR Requirements 질문

아래 질문에 답변해주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택지 문자를 입력해주세요.

### Question 1
SSE 연결 동시 접속 수 기준으로 서버 리소스 관리 전략은?

A) 단순 인메모리 Map 관리 (MVP 수준, 50개 테이블 + 5명 관리자 충분)
B) 연결 수 제한 + 큐잉 (최대 연결 수 초과 시 대기열)
C) 연결 풀링 + 주기적 정리 (비활성 연결 자동 정리)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
주문 생성 API의 목표 응답 시간은?

A) 500ms 이내 (빠른 응답 우선)
B) 1초 이내 (requirements.md 기준 그대로)
C) 2초 이내 (여유 있는 기준)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
트랜잭션 실패 시 재시도 전략은?

A) 재시도 없음 — 클라이언트에 에러 반환, 사용자가 다시 시도
B) 서버 측 자동 재시도 (최대 2회) 후 실패 시 에러 반환
C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4
서버 로깅 수준은?

A) 최소 로깅 — 에러만 기록 (console.error)
B) 표준 로깅 — 에러 + 주요 비즈니스 이벤트 (주문 생성/삭제/이용완료) 기록
C) 상세 로깅 — 모든 API 요청/응답 + 비즈니스 이벤트 + SSE 연결/해제 기록
D) Other (please describe after [Answer]: tag below)

[Answer]:  A

### Question 5
이용 완료 트랜잭션(Order → OrderHistory 이동)의 데이터 무결성 보장 수준은?

A) SQLite 단일 트랜잭션으로 충분 (단일 서버, 동시성 낮음)
B) 트랜잭션 + 실패 시 롤백 로그 기록 (디버깅 용이)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
Unit 3의 테스트 프레임워크 선택은?

A) Vitest (Vite 생태계 통합, 빠른 실행)
B) Jest (가장 널리 사용, 풍부한 생태계)
C) Node.js 내장 test runner (외부 의존성 없음)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7
SSE heartbeat 실패 시 연결 정리 전략은?

A) heartbeat 전송 실패 시 즉시 연결 제거
B) 3회 연속 실패 시 연결 제거
C) heartbeat 없이 클라이언트 close 이벤트에만 의존
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 8
OrderHistory 90일 보존 정책의 구현 방식은?

A) 조회 시 WHERE 절로 90일 필터링만 적용 (데이터는 계속 쌓임)
B) 조회 시 필터링 + 서버 시작 시 90일 이전 데이터 자동 삭제
C) 조회 시 필터링만 (정기 삭제는 향후 구현)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

