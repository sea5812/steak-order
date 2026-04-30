# NFR Requirements - Unit 1: Foundation

---

## NFR-U1-01: 인증 성능
- 로그인 API 응답 시간: 500ms 이내 (bcrypt 해싱 포함)
- JWT 검증: 10ms 이내
- bcrypt saltRounds: 10 (보안과 성능 균형)

## NFR-U1-02: 데이터베이스
- SQLite (better-sqlite3) — 동기 API, 단일 파일
- WAL 모드 활성화 (동시 읽기 성능 향상)
- Drizzle ORM으로 타입 안전 쿼리
- 마이그레이션: drizzle-kit으로 스키마 관리

## NFR-U1-03: 보안
- 비밀번호: bcrypt 해싱 (saltRounds=10)
- JWT: HS256 알고리즘, 환경변수에서 시크릿 로드
- 로그인 시도 제한: 5회 실패 → 15분 잠금
- CORS: 프론트엔드 origin만 허용
- 요청 본문 크기 제한: 10MB (이미지 업로드 고려)

## NFR-U1-04: 에러 핸들링
- 글로벌 에러 핸들러로 모든 미처리 예외 캐치
- 프로덕션 에러 응답에 스택 트레이스 미포함
- 구조화된 에러 응답 형식 (code + message)

## NFR-U1-05: 프로젝트 구조
- npm workspaces 모노레포
- TypeScript strict 모드
- ESM 모듈 시스템
- 경로 별칭 없음 (단순성 유지)

## NFR-U1-06: 기술 스택 버전
- Node.js: 20 LTS
- TypeScript: 5.x
- Express: 4.x
- better-sqlite3: 11.x
- drizzle-orm: 0.36.x
- jsonwebtoken: 9.x
- bcryptjs: 2.x (네이티브 빌드 불필요)
- zod: 3.x (입력 검증)
