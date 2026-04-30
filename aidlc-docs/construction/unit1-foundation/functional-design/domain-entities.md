# Domain Entities - Unit 1: Foundation

---

## Entity Relationship Diagram

```
+----------+       +----------+       +------------+
|  Store   |1────N |  Admin   |       | TableInfo  |
+----------+       +----------+       +------------+
| id (PK)  |       | id (PK)  |       | id (PK)    |
| slug     |       | storeId  |──FK──>| storeId    |──FK──>Store
| name     |       | username |       | number     |
| address  |       | passHash |       | passHash   |
| createdAt|       | createdAt|       | createdAt  |
+----------+       +----------+       +------------+
     │                                      │
     │1──N                                  │1──N
     v                                      v
+----------+       +------------+     +---------------+
| Category |1────N | MenuItem   |     | TableSession  |
+----------+       +------------+     +---------------+
| id (PK)  |       | id (PK)   |     | id (PK)       |
| storeId  |──FK──>| storeId   |──>  | tableId       |──FK
| name     |       | categoryId|──FK  | storeId       |──FK
| order    |       | name      |     | startedAt     |
| createdAt|       | price     |     | endedAt       |
+----------+       | desc      |     +---------------+
                   | imageUrl  |           │
                   | order     |           │1──N
                   | createdAt |           v
                   +------------+     +----------+
                                      |  Order   |
                                      +----------+
                                      | id (PK)  |
                                      | storeId  |──FK
                                      | tableId  |──FK
                                      | sessionId|──FK
                                      | total    |
                                      | status   |
                                      | orderedAt|
                                      +----------+
                                           │
                                           │1──N
                                           v
                                      +------------+
                                      | OrderItem  |
                                      +------------+
                                      | id (PK)    |
                                      | orderId    |──FK
                                      | menuItemId |──FK
                                      | menuName   |
                                      | quantity   |
                                      | unitPrice  |
                                      +------------+

                                      +---------------+
                                      | OrderHistory  |
                                      +---------------+
                                      | id (PK)       |
                                      | storeId       |──FK
                                      | tableId       |──FK
                                      | sessionId     |
                                      | orderData     | (JSON)
                                      | completedAt   |
                                      +---------------+
```

---

## Entity 상세 정의

### Store (매장)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 매장 고유 ID |
| slug | TEXT | UNIQUE, NOT NULL | 매장 식별자 (URL-safe, 예: "black-marble") |
| name | TEXT | NOT NULL | 매장명 (예: "Black Marble") |
| address | TEXT | | 매장 주소 |
| createdAt | TEXT | NOT NULL, DEFAULT NOW | 생성 시각 (ISO 8601) |

### Admin (관리자)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 관리자 고유 ID |
| storeId | INTEGER | FK → Store.id, NOT NULL | 소속 매장 |
| username | TEXT | NOT NULL | 사용자명 |
| passwordHash | TEXT | NOT NULL | bcrypt 해시 비밀번호 |
| createdAt | TEXT | NOT NULL, DEFAULT NOW | 생성 시각 |
| **UNIQUE** | (storeId, username) | | 매장 내 사용자명 유일 |

### TableInfo (테이블)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 테이블 고유 ID |
| storeId | INTEGER | FK → Store.id, NOT NULL | 소속 매장 |
| tableNumber | INTEGER | NOT NULL | 테이블 번호 |
| passwordHash | TEXT | NOT NULL | bcrypt 해시 비밀번호 |
| createdAt | TEXT | NOT NULL, DEFAULT NOW | 생성 시각 |
| **UNIQUE** | (storeId, tableNumber) | | 매장 내 테이블 번호 유일 |

### Category (메뉴 카테고리)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 카테고리 고유 ID |
| storeId | INTEGER | FK → Store.id, NOT NULL | 소속 매장 |
| name | TEXT | NOT NULL | 카테고리명 |
| displayOrder | INTEGER | NOT NULL, DEFAULT 0 | 노출 순서 |
| createdAt | TEXT | NOT NULL, DEFAULT NOW | 생성 시각 |

### MenuItem (메뉴 항목)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 메뉴 고유 ID |
| storeId | INTEGER | FK → Store.id, NOT NULL | 소속 매장 |
| categoryId | INTEGER | FK → Category.id, NOT NULL | 소속 카테고리 |
| name | TEXT | NOT NULL | 메뉴명 |
| price | INTEGER | NOT NULL, CHECK >= 0 | 가격 (원, 정수) |
| description | TEXT | | 메뉴 설명 |
| imageUrl | TEXT | | 이미지 경로 |
| displayOrder | INTEGER | NOT NULL, DEFAULT 0 | 노출 순서 |
| createdAt | TEXT | NOT NULL, DEFAULT NOW | 생성 시각 |

### TableSession (테이블 세션)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 세션 고유 ID |
| tableId | INTEGER | FK → TableInfo.id, NOT NULL | 테이블 |
| storeId | INTEGER | FK → Store.id, NOT NULL | 매장 |
| startedAt | TEXT | NOT NULL, DEFAULT NOW | 세션 시작 시각 |
| endedAt | TEXT | | 세션 종료 시각 (NULL = 활성) |

### Order (주문)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 주문 고유 ID |
| storeId | INTEGER | FK → Store.id, NOT NULL | 매장 |
| tableId | INTEGER | FK → TableInfo.id, NOT NULL | 테이블 |
| sessionId | INTEGER | FK → TableSession.id, NOT NULL | 세션 |
| totalAmount | INTEGER | NOT NULL, CHECK >= 0 | 총 주문 금액 (원) |
| status | TEXT | NOT NULL, DEFAULT 'pending' | 상태: pending/preparing/completed |
| orderedAt | TEXT | NOT NULL, DEFAULT NOW | 주문 시각 |

### OrderItem (주문 항목)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 주문 항목 고유 ID |
| orderId | INTEGER | FK → Order.id, NOT NULL | 소속 주문 |
| menuItemId | INTEGER | FK → MenuItem.id, NOT NULL | 메뉴 항목 |
| menuName | TEXT | NOT NULL | 주문 시점 메뉴명 (스냅샷) |
| quantity | INTEGER | NOT NULL, CHECK >= 1 | 수량 |
| unitPrice | INTEGER | NOT NULL, CHECK >= 0 | 주문 시점 단가 (스냅샷) |

### OrderHistory (과거 주문 이력)
| 필드 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | INTEGER | PK, AUTO | 이력 고유 ID |
| storeId | INTEGER | FK → Store.id, NOT NULL | 매장 |
| tableId | INTEGER | FK → TableInfo.id, NOT NULL | 테이블 |
| sessionId | INTEGER | NOT NULL | 원본 세션 ID |
| orderData | TEXT | NOT NULL | 주문 데이터 JSON (주문+항목 전체) |
| completedAt | TEXT | NOT NULL, DEFAULT NOW | 이용 완료 시각 |
