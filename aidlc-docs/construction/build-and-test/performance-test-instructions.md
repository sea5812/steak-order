# Performance Test Instructions - Unit 3: Order Domain

## Performance Requirements (from NFR)

| 항목 | 목표 |
|---|---|
| 주문 생성 API | 1초 이내 (P95) |
| 주문 상태 변경 API | 500ms 이내 (P95) |
| 주문 조회 API | 500ms 이내 (P95) |
| SSE 이벤트 전달 | 2초 이내 |
| 이용 완료 처리 | 2초 이내 (P95) |
| 동시 SSE 연결 | 55개 (테이블 50 + 관리자 5) |

---

## 간단한 성능 테스트 (curl + time)

### 1. 주문 생성 응답 시간

```bash
# 10회 반복 측정
for i in $(seq 1 10); do
  time curl -s -X POST http://localhost:3000/api/stores/1/orders \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer TABLE_JWT" \
    -d '{"items":[{"menu_item_id":10,"quantity":1}]}' > /dev/null
done
```

### 2. 주문 조회 응답 시간

```bash
for i in $(seq 1 10); do
  time curl -s http://localhost:3000/api/stores/1/orders \
    -H "Authorization: Bearer ADMIN_JWT" > /dev/null
done
```

### 3. SSE 동시 연결 테스트

```bash
# 55개 동시 SSE 연결 (50 테이블 + 5 관리자)
for i in $(seq 1 50); do
  curl -s -N http://localhost:3000/api/stores/1/sse/table/$i \
    -H "Authorization: Bearer TABLE_JWT_$i" &
done

for i in $(seq 1 5); do
  curl -s -N http://localhost:3000/api/stores/1/sse/admin \
    -H "Authorization: Bearer ADMIN_JWT" &
done

# 연결 상태 확인 후 종료
sleep 5
kill $(jobs -p)
```

---

## 고급 성능 테스트 (향후)

MVP 범위에서는 위의 간단한 테스트로 충분. 향후 필요 시:
- **k6**: JavaScript 기반 부하 테스트 도구
- **Artillery**: Node.js 기반 부하 테스트
- **autocannon**: HTTP 벤치마크 도구

```bash
# autocannon 예시 (향후)
npx autocannon -c 10 -d 30 -m POST \
  -H "Content-Type=application/json" \
  -H "Authorization=Bearer TOKEN" \
  -b '{"items":[{"menu_item_id":10,"quantity":1}]}' \
  http://localhost:3000/api/stores/1/orders
```

---

## 성능 최적화 가이드

성능 목표 미달 시:
1. **SQLite WAL 모드 활성화**: `PRAGMA journal_mode=WAL;` (읽기/쓰기 동시성 향상)
2. **인덱스 확인**: `idx_order_store_session`, `idx_order_store_date` 인덱스 존재 확인
3. **SSE 페이로드 최소화**: 불필요한 데이터 제거
4. **Connection pooling**: better-sqlite3는 단일 연결이므로 해당 없음
