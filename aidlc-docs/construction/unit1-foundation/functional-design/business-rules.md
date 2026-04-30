# Business Rules - Unit 1: Foundation

---

## BR-AUTH: 인증 규칙

### BR-AUTH-01: 관리자 로그인
- 매장 식별자(slug) + 사용자명 + 비밀번호로 인증
- 매장 slug로 Store 조회 → storeId + username으로 Admin 조회 → bcrypt.compare()
- 성공 시 JWT 발급: `{ storeId, adminId, role: 'admin' }`, 만료 16시간
- 실패 시 401 Unauthorized 반환

### BR-AUTH-02: 테이블 태블릿 로그인
- 매장 식별자(slug) + 테이블 번호 + 비밀번호로 인증
- 매장 slug로 Store 조회 → storeId + tableNumber로 TableInfo 조회 → bcrypt.compare()
- 성공 시 JWT 발급: `{ storeId, tableId, tableNumber, role: 'table' }`, 만료 16시간
- 실패 시 401 Unauthorized 반환

### BR-AUTH-03: 로그인 시도 제한
- 동일 식별자(매장slug+username 또는 매장slug+tableNumber)로 5회 연속 실패 시 15분 잠금
- 인메모리 Map으로 관리 (서버 재시작 시 리셋 — MVP 수준)
- 잠금 중 로그인 시도 시 429 Too Many Requests 반환
- 성공 시 실패 카운트 리셋

### BR-AUTH-04: JWT 토큰 검증
- Authorization 헤더에서 Bearer 토큰 추출
- jsonwebtoken.verify()로 서명 + 만료 검증
- 유효하지 않으면 401 Unauthorized
- 유효하면 req.user에 디코딩된 페이로드 설정

### BR-AUTH-05: 역할 기반 접근 제어
- `authMiddleware`: role === 'admin' 검증 (관리자 API 보호)
- `tableAuthMiddleware`: role === 'table' 검증 (고객 API 보호)
- 역할 불일치 시 403 Forbidden

---

## BR-ADMIN: 관리자 계정 규칙

### BR-ADMIN-01: 관리자 계정 생성
- 로그인된 관리자만 생성 가능 (같은 매장)
- 사용자명: 2~50자, 영문+숫자+언더스코어만 허용
- 비밀번호: 4자 이상
- 동일 매장 내 사용자명 중복 불가 → 409 Conflict
- 비밀번호는 bcrypt(saltRounds=10)로 해싱 후 저장

### BR-ADMIN-02: 관리자 계정 목록 조회
- 로그인된 관리자의 매장(storeId) 소속 관리자만 조회
- 비밀번호 해시는 응답에서 제외
- createdAt 기준 오름차순 정렬

---

## BR-GLOBAL: 글로벌 규칙

### BR-GLOBAL-01: 에러 응답 형식
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지"
  }
}
```
- 400: 입력 검증 실패
- 401: 인증 실패
- 403: 권한 없음
- 404: 리소스 없음
- 409: 중복 충돌
- 429: 요청 제한 초과
- 500: 서버 내부 오류 (상세 정보 노출 금지)

### BR-GLOBAL-02: 입력 검증
- 모든 API 엔드포인트에서 요청 본문/파라미터 검증
- 검증 실패 시 400 Bad Request + 구체적 에러 메시지
- SQL Injection 방지: Drizzle ORM 파라미터 바인딩 사용

### BR-GLOBAL-03: 매장 격리
- 모든 데이터 조회/수정 시 storeId 필터 적용
- JWT의 storeId와 요청 경로의 storeId 일치 검증
- 불일치 시 403 Forbidden
