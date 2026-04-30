# Functional Design Plan - Unit 3: Order Domain

## Unit 3 개요
- **담당**: 팀원 C (Order & Realtime Lead)
- **범위**: 주문 생성/조회/상태변경/삭제, 테이블 관리, SSE 실시간 통신, 이용 완료
- **관련 스토리**: US-C04, US-C05, US-A03, US-A04

---

## Plan Checklist

### Part 1: 질문 수집 및 분석
- [x] Step 1: Unit 3 컨텍스트 분석 완료
- [x] Step 2: Functional Design 질문 생성 및 사용자 답변 수집
- [x] Step 3: 답변 분석 및 모호성 확인 (모호성 없음)

### Part 2: Functional Design 산출물 생성
- [x] Step 4: Domain Entities 설계 (Order, OrderItem, TableSession, OrderHistory 엔티티)
- [x] Step 5: Business Logic Model 설계
  - [x] 5.1: 주문 생성 비즈니스 로직 (가격 검증, 세션 관리, 트랜잭션)
  - [x] 5.2: 주문 상태 변경 로직 (상태 전이 규칙)
  - [x] 5.3: 주문 삭제 로직 (총액 재계산)
  - [x] 5.4: 테이블 세션 관리 로직 (시작/종료/이용완료)
  - [x] 5.5: SSE 실시간 이벤트 브로드캐스트 로직
  - [x] 5.6: 테이블 과거 주문 내역 조회 로직
- [x] Step 6: Business Rules 정의
  - [x] 6.1: 주문 생성 규칙 (검증, 제약조건)
  - [x] 6.2: 주문 상태 전이 규칙
  - [x] 6.3: 주문 삭제 규칙
  - [x] 6.4: 테이블 세션 규칙
  - [x] 6.5: SSE 연결 관리 규칙
  - [x] 6.6: 이용 완료 규칙

### Part 3: 승인
- [x] Step 7: 산출물 제시 및 사용자 승인 완료
- [x] Step 8: 승인 기록 및 상태 업데이트

---

## Functional Design 질문

아래 질문에 답변해주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택지 문자를 입력해주세요.

### Question 1
주문 생성 시 메뉴 가격 검증은 어떻게 처리해야 하나요?

A) 클라이언트가 보낸 가격을 신뢰하고 그대로 저장 (빠른 처리)
B) 서버에서 DB의 현재 메뉴 가격을 조회하여 검증 후 서버 가격으로 저장 (안전)
C) 서버에서 검증하되, 가격 불일치 시 에러 반환 (클라이언트 재시도 필요)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 2
주문 상태 전이 규칙은 어떻게 설정하나요?

A) 순방향만 허용: 대기중 → 준비중 → 완료 (역방향 불가)
B) 순방향 + 역방향 허용: 대기중 ↔ 준비중 ↔ 완료 (자유 변경)
C) 순방향 + 한 단계 역방향: 대기중 → 준비중 → 완료, 준비중 → 대기중 가능 (완료 → 역방향 불가)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
테이블 세션 시작 시점은 언제인가요?

A) 고객이 첫 주문을 생성할 때 자동으로 세션 시작
B) 테이블 태블릿 로그인 시 자동으로 세션 시작
C) 관리자가 수동으로 세션을 시작
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 4
이용 완료(세션 종료) 시 주문 데이터 처리 방식은?

A) 현재 주문 데이터를 별도 OrderHistory 테이블로 복사 후 원본 삭제
B) 현재 주문에 세션 종료 플래그만 설정 (데이터 이동 없음, 쿼리로 구분)
C) 현재 주문의 session 상태를 'completed'로 변경하고, 새 세션 생성 시 이전 세션 주문은 자동 필터링
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 5
SSE 연결이 끊어졌을 때 재연결 전략은?

A) 클라이언트가 자동 재연결 (EventSource 기본 동작 활용, 별도 로직 없음)
B) 클라이언트가 자동 재연결 + 마지막 이벤트 ID 기반으로 놓친 이벤트 재전송
C) 클라이언트가 자동 재연결 + 재연결 시 전체 데이터 새로고침 (API 호출)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
주문 삭제 시 관련 데이터 처리는?

A) 주문(Order)과 주문항목(OrderItem) 모두 물리적 삭제 (hard delete)
B) 소프트 삭제 (deleted_at 플래그 설정, 데이터 보존)
C) 주문 상태를 '삭제됨'으로 변경 (데이터 보존, 이력 추적 가능)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 7
관리자 대시보드에서 주문 목록 조회 시 기본 필터링 범위는?

A) 현재 활성 세션의 주문만 표시 (이용 완료된 테이블 제외)
B) 오늘 날짜의 모든 주문 표시 (이용 완료 포함)
C) 현재 활성 세션 주문 기본 + 토글로 이용 완료 주문 포함 가능
D) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 8
SSE 이벤트 브로드캐스트 시 데이터 페이로드 범위는?

A) 변경된 엔티티의 전체 데이터를 전송 (클라이언트 로직 단순화)
B) 변경된 필드만 전송 (delta/patch 방식, 네트워크 효율)
C) 이벤트 타입 + ID만 전송, 클라이언트가 API로 상세 데이터 조회
D) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 9
테이블 과거 주문 내역 조회 시 데이터 보존 기간은?

A) 무제한 보존 (모든 과거 내역 조회 가능)
B) 최근 30일만 보존
C) 최근 90일만 보존
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 10
주문 번호 생성 방식은?

A) 자동 증가 정수 (1, 2, 3, ...) — 매장 전체 기준
B) 날짜 기반 순번 (예: 20260430-001, 20260430-002) — 일별 리셋
C) UUID 기반 (고유하지만 사용자 친화적이지 않음)
D) 테이블별 순번 (테이블 1의 주문 1, 주문 2, ...) — 세션별 리셋
E) Other (please describe after [Answer]: tag below)

[Answer]: B

