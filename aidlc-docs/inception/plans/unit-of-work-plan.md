# Unit of Work Plan - Black Marble Table

## Plan Overview
모노레포 구조의 단일 서비스를 4명의 팀원이 병렬 개발할 수 있도록 4개 유닛으로 분해합니다.

## Decomposition Strategy
- **아키텍처**: 모놀리식 모노레포 (단일 배포 단위)
- **분해 기준**: 기능 도메인 + 팀원 수 (4명)
- **유닛 유형**: Module (논리적 그룹, 독립 배포 아님)

---

## Generation Steps

### Step 1: 유닛 정의
- [x] Unit 1: 공통 기반 + DB 스키마 + 인증 (Foundation)
- [x] Unit 2: 메뉴 관리 (Menu Domain)
- [x] Unit 3: 주문 + SSE 실시간 (Order Domain)
- [x] Unit 4: 프론트엔드 UI (Frontend)
- [x] `unit-of-work.md` 생성

### Step 2: 유닛 의존성 매핑
- [x] 유닛 간 의존성 매트릭스 작성
- [x] 개발 순서 및 병렬화 전략
- [x] `unit-of-work-dependency.md` 생성

### Step 3: 스토리-유닛 매핑
- [x] 각 User Story를 유닛에 할당
- [x] `unit-of-work-story-map.md` 생성

### Step 4: 팀원 역할 분담
- [x] 4명 팀원별 유닛 할당 및 역할 정의
- [x] `team-assignment.md` 생성
