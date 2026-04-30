# 컴포넌트 의존성 - Black Marble Table

---

## Backend 의존성 매트릭스

```
                    Auth   Admin  Menu   Order  Table  SSE    Store  Admin  Menu   Order  Table
                    Svc    Svc    Svc    Svc    Svc    Svc    Repo   Repo   Repo   Repo   Repo
AuthController      ✓
AdminController     ✓      ✓
MenuController      ✓             ✓
OrderController     ✓                    ✓
TableController     ✓                           ✓
SSEController       ✓                                  ✓

AuthService                                                   ✓      ✓                    ✓
AdminService        ✓                                                 ✓
MenuService                                                                  ✓
OrderService                              ✓*    ✓      ✓                     ✓      ✓
TableService                                           ✓                            ✓      ✓

✓ = 직접 의존
✓* = TableService.getOrCreateSession() 호출
```

## Frontend 의존성

```
Pages                          Hooks              Services         Components
─────                          ─────              ────────         ──────────
CustomerMenuPage          ──→  useOrderList   ──→  menuApi     ──→  MenuCard
                               useTableAuth        orderApi         CategoryNav
                                                                    QuantityControl

CustomerOrderListPage     ──→  useOrderList   ──→  orderApi    ──→  OrderItemRow
                               useTableAuth                         ConfirmDialog

CustomerOrderHistoryPage  ──→  useSSE         ──→  orderApi    ──→  OrderStatusBadge
                               useTableAuth

AdminLoginPage            ──→  useAuth        ──→  authApi

AdminDashboardPage        ──→  useSSE         ──→  orderApi    ──→  TableCard
                               useAuth             tableApi         OrderStatusBadge
                                                                    ConfirmDialog

AdminMenuManagePage       ──→  useAuth        ──→  menuApi     ──→  MenuCard
                                                                    ConfirmDialog
                                                                    Toast

AdminTableManagePage      ──→  useAuth        ──→  tableApi    ──→  TableCard
                                                                    ConfirmDialog
                                                                    Toast

AdminAccountPage          ──→  useAuth        ──→  adminApi    ──→  ConfirmDialog
                                                                    Toast
```

## 데이터 흐름 다이어그램

```
+------------------+          +------------------+
|   Customer UI    |          |    Admin UI      |
|                  |          |                  |
| Menu ──→ Order   |          | Dashboard        |
| List ──→ Create  |          | ├─ Order Monitor |
| History ← SSE   |          | ├─ Table Manage  |
+--------+---------+          | ├─ Menu Manage   |
         |                    | └─ Account       |
         |                    +--------+---------+
         |                             |
    REST API + SSE               REST API + SSE
         |                             |
         +─────────────+───────────────+
                       |
               +-------+-------+
               |   Express     |
               |   Server      |
               +-------+-------+
                       |
          +────────────+────────────+
          |            |            |
    +-----+----+ +----+-----+ +----+-----+
    | Auth     | | Business | | SSE      |
    | Layer    | | Layer    | | Layer    |
    | (JWT,    | | (Order,  | | (Event   |
    |  bcrypt) | |  Table,  | |  Broker) |
    +-----+----+ |  Menu)   | +----------+
          |      +----+-----+
          |           |
          +─────+─────+
                |
         +------+------+
         | Drizzle ORM |
         +------+------+
                |
         +------+------+
         |   SQLite    |
         |   (file)    |
         +-------------+
```

## 라우팅 구조

### Frontend 라우팅

| 경로 | 페이지 | 사용자 |
|---|---|---|
| `/` | CustomerMenuPage | 고객 (자동 로그인 후) |
| `/order-list` | CustomerOrderListPage | 고객 |
| `/orders` | CustomerOrderHistoryPage | 고객 |
| `/setup` | TableSetupPage | 관리자 (태블릿 초기 설정) |
| `/admin/login` | AdminLoginPage | 관리자 |
| `/admin/dashboard` | AdminDashboardPage | 관리자 |
| `/admin/menus` | AdminMenuManagePage | 관리자 |
| `/admin/tables` | AdminTableManagePage | 관리자 |
| `/admin/accounts` | AdminAccountPage | 관리자 |
