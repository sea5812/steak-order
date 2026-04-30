# NFR Design Plan - Unit 3: Order Domain

## Unit 3 개요
- **NFR 기반**: nfr-requirements.md (21개 NFR), tech-stack-decisions.md
- **핵심 설계 영역**: SSE 연결 관리 패턴, 트랜잭션 재시도 패턴, 에러 처리 패턴

---

## Plan Checklist

### Part 1: 질문 수집 및 분석
- [x] Step 1: NFR Requirements 분석 완료
- [x] Step 2: NFR Design 질문 생성 및 사용자 답변 수집
- [x] Step 3: 답변 분석 및 모호성 확인 (모호성 없음)

### Part 2: NFR Design 산출물 생성
- [x] Step 4: NFR Design Patterns 문서 생성
  - [x] 4.1: SSE 연결 관리 패턴 (SSEManager 설계)
  - [x] 4.2: 트랜잭션 재시도 패턴 (withRetry)
  - [x] 4.3: 에러 처리 패턴 (AppError, 글로벌 핸들러)
  - [x] 4.4: 의존성 주입 패턴 (Service 생성자 주입)
- [x] Step 5: Logical Components 문서 생성
  - [x] 5.1: SSEManager 컴포넌트 상세 설계
  - [x] 5.2: 트랜잭션 유틸리티 컴포넌트
  - [x] 5.3: 입력 검증 컴포넌트

### Part 3: 승인
- [x] Step 6: 산출물 제시 및 사용자 승인 완료
- [x] Step 7: 승인 기록 및 상태 업데이트

---

## NFR Design 질문

아래 질문에 답변해주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택지 문자를 입력해주세요.

### Question 1
Service 레이어의 의존성 주입 방식은?

A) 생성자 주입 — 각 Service 클래스가 생성자에서 Repository를 받음 (테스트 용이)
B) 모듈 레벨 싱글톤 — 각 Service를 모듈에서 직접 export (간단, 테스트 시 mock 필요)
C) DI 컨테이너 (tsyringe, inversify 등) — 자동 의존성 해결
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 2
입력 검증 구현 방식은?

A) 수동 검증 — Controller에서 직접 if/throw 패턴 (외부 의존성 없음)
B) Zod 스키마 검증 — 선언적 스키마 정의 + 자동 타입 추론
C) express-validator — Express 미들웨어 기반 검증
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 3
SSEManager의 heartbeat 구현 방식은?

A) 전역 단일 setInterval — 모든 연결에 동일 타이머로 heartbeat 전송
B) 연결별 개별 setInterval — 각 연결마다 독립 타이머
C) Other (please describe after [Answer]: tag below)

[Answer]: A

