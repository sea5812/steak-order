# Business Logic Model - Unit 1: Foundation

---

## 1. 관리자 로그인 플로우

```
Input: { storeSlug, username, password }

1. checkLoginAttempts(storeSlug + ":" + username)
   ├─ 잠금 상태 → return 429 "Too many attempts. Try again in X minutes."
   └─ 정상 → continue

2. Store = findStoreBySlug(storeSlug)
   └─ not found → return 401 "Invalid credentials"

3. Admin = findAdminByStoreAndUsername(Store.id, username)
   └─ not found → recordFailedAttempt() → return 401 "Invalid credentials"

4. bcrypt.compare(password, Admin.passwordHash)
   ├─ false → recordFailedAttempt() → return 401 "Invalid credentials"
   └─ true → resetAttempts() → continue

5. token = jwt.sign({ storeId, adminId, role: 'admin' }, SECRET, { expiresIn: '16h' })

6. return 200 { token, admin: { id, username, storeId, storeName } }
```

## 2. 테이블 태블릿 로그인 플로우

```
Input: { storeSlug, tableNumber, password }

1. checkLoginAttempts(storeSlug + ":table:" + tableNumber)
   ├─ 잠금 상태 → return 429
   └─ 정상 → continue

2. Store = findStoreBySlug(storeSlug)
   └─ not found → return 401 "Invalid credentials"

3. Table = findTableByStoreAndNumber(Store.id, tableNumber)
   └─ not found → recordFailedAttempt() → return 401 "Invalid credentials"

4. bcrypt.compare(password, Table.passwordHash)
   ├─ false → recordFailedAttempt() → return 401 "Invalid credentials"
   └─ true → resetAttempts() → continue

5. token = jwt.sign({ storeId, tableId, tableNumber, role: 'table' }, SECRET, { expiresIn: '16h' })

6. return 200 { token, table: { id, tableNumber, storeId, storeName } }
```

## 3. JWT 미들웨어 플로우

```
Request → authMiddleware / tableAuthMiddleware

1. header = req.headers.authorization
   └─ missing → return 401 "No token provided"

2. token = header.split('Bearer ')[1]
   └─ missing → return 401 "Invalid token format"

3. payload = jwt.verify(token, SECRET)
   └─ error (expired/invalid) → return 401 "Token expired or invalid"

4. [authMiddleware only] payload.role !== 'admin' → return 403 "Admin access required"
   [tableAuthMiddleware only] payload.role !== 'table' → return 403 "Table access required"

5. req.user = payload
6. next()
```

## 4. 매장 격리 검증 플로우

```
Request → storeId 검증 (미들웨어 또는 컨트롤러)

1. pathStoreId = req.params.storeId (URL 경로의 매장 ID)
2. tokenStoreId = req.user.storeId (JWT의 매장 ID)

3. pathStoreId !== tokenStoreId → return 403 "Store access denied"
4. continue
```

## 5. 관리자 계정 생성 플로우

```
Input: { username, password } (JWT에서 storeId 추출)

1. validate(username): 2~50자, /^[a-zA-Z0-9_]+$/
   └─ invalid → return 400 "Invalid username format"

2. validate(password): 4자 이상
   └─ invalid → return 400 "Password too short"

3. existingAdmin = findAdminByStoreAndUsername(storeId, username)
   └─ exists → return 409 "Username already exists"

4. passwordHash = bcrypt.hash(password, 10)

5. admin = createAdmin({ storeId, username, passwordHash })

6. return 201 { id, username, storeId, createdAt }
```

## 6. 로그인 시도 제한 로직

```
loginAttempts: Map<string, { count: number, lockedUntil: Date | null }>

checkLoginAttempts(key):
  entry = loginAttempts.get(key)
  if entry && entry.lockedUntil && entry.lockedUntil > now:
    return { locked: true, retryAfter: entry.lockedUntil - now }
  return { locked: false }

recordFailedAttempt(key):
  entry = loginAttempts.get(key) || { count: 0, lockedUntil: null }
  entry.count++
  if entry.count >= 5:
    entry.lockedUntil = now + 15 minutes
  loginAttempts.set(key, entry)

resetAttempts(key):
  loginAttempts.delete(key)
```
