# 테이블오더 서비스 - 요구사항 명확화 질문

아래 질문들에 답변해 주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택한 옵션의 알파벳을 입력해 주세요.
제공된 옵션 중 해당하는 것이 없으면 마지막 옵션(Other)을 선택하고 설명을 추가해 주세요.

---

## Question 1
프로젝트의 기술 스택(프로그래밍 언어 및 프레임워크)은 어떤 것을 사용하시겠습니까?

**Backend:**
A) Node.js + Express/Fastify (JavaScript/TypeScript)
B) Java + Spring Boot
C) Python + FastAPI/Django
D) Go + Gin/Echo
E) Other (please describe after [Answer]: tag below)

[Answer]: B

**Frontend:**
A) React (JavaScript/TypeScript)
B) Vue.js
C) Next.js (React 기반 풀스택)
D) Svelte/SvelteKit
E) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
데이터베이스는 어떤 것을 사용하시겠습니까?

A) PostgreSQL (관계형 데이터베이스)
B) MySQL/MariaDB (관계형 데이터베이스)
C) MongoDB (NoSQL 문서형 데이터베이스)
D) SQLite (경량 관계형 데이터베이스, 개발/소규모 매장용)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
배포 환경은 어떤 것을 고려하고 계십니까?

A) AWS (EC2, ECS, Lambda 등)
B) Docker 컨테이너 기반 (Docker Compose 등)
C) 로컬 서버 / 온프레미스
D) 클라우드 PaaS (Heroku, Railway, Render 등)
E) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
매장(Store) 관리 구조는 어떻게 되나요? 이 시스템은 단일 매장용인가요, 다중 매장(멀티테넌트)을 지원해야 하나요?

A) 단일 매장 전용 (하나의 매장만 운영)
B) 다중 매장 지원 (여러 매장이 하나의 시스템을 공유, 멀티테넌트)
C) 단일 매장으로 시작하되, 향후 다중 매장 확장 가능한 구조
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
메뉴 이미지 관리는 어떻게 처리하시겠습니까?

A) 외부 이미지 URL 직접 입력 (별도 이미지 호스팅 사용)
B) 서버에 이미지 파일 업로드 기능 포함
C) 클라우드 스토리지(S3 등)에 업로드 후 URL 저장
D) MVP에서는 이미지 URL 직접 입력, 향후 업로드 기능 추가
E) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6
관리자 계정 관리는 어떻게 하시겠습니까?

A) 시스템 초기 설정 시 관리자 계정 1개 생성 (고정)
B) 관리자가 추가 관리자 계정을 생성할 수 있음
C) 매장별 관리자 계정 1개 (매장 생성 시 자동 생성)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 7
동시 접속 사용자 규모는 어느 정도를 예상하시나요?

A) 소규모 (테이블 10개 이하, 관리자 1~2명)
B) 중규모 (테이블 10~50개, 관리자 2~5명)
C) 대규모 (테이블 50개 이상, 관리자 5명 이상)
D) 규모는 미정이나, 확장 가능한 구조 필요
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 8
테이블 태블릿의 세션 만료 정책은 어떻게 하시겠습니까? (관리자는 16시간으로 명시되어 있으나, 고객용 태블릿 세션은 명시되지 않았습니다)

A) 태블릿 세션은 만료 없음 (항상 로그인 상태 유지, 매장 영업 중 계속 사용)
B) 태블릿 세션도 16시간 후 만료 (관리자와 동일)
C) 태블릿 세션은 24시간 후 만료
D) 태블릿 세션은 매장 이용 완료(테이블 세션 종료) 시에만 리셋
E) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 9
주문 상태 실시간 업데이트(고객 화면)에 대해 요구사항에 "선택사항"으로 표시되어 있습니다. MVP에 포함하시겠습니까?

A) 예, MVP에 포함 (SSE 또는 폴링으로 고객 화면에서도 주문 상태 실시간 업데이트)
B) 아니오, MVP에서 제외 (고객은 수동 새로고침으로 주문 상태 확인)
C) 간단한 폴링 방식으로 포함 (30초 간격 자동 새로고침)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10
메뉴 관리 기능이 요구사항에 포함되어 있지만 MVP 범위에는 명시되지 않았습니다. MVP에 메뉴 관리(CRUD)를 포함하시겠습니까?

A) 예, 메뉴 관리 전체 CRUD를 MVP에 포함
B) 메뉴 등록/수정만 포함 (삭제, 순서 조정은 제외)
C) MVP에서 제외 (초기 데이터는 DB 직접 입력 또는 시드 데이터로 처리)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 11: Security Extensions
이 프로젝트에 보안 확장 규칙(Security Extension Rules)을 적용하시겠습니까?

A) 예 — 모든 SECURITY 규칙을 blocking constraint로 적용 (프로덕션 수준 애플리케이션에 권장)
B) 아니오 — 모든 SECURITY 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)
C) Other (please describe after [Answer]: tag below)

[Answer]: B

