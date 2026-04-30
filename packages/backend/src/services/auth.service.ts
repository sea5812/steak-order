import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../middleware/auth.js';
import { storeRepository } from '../repositories/store.repository.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { AppError } from '../middleware/error-handler.js';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tables } from '../db/schema.js';

// In-memory login attempt tracking
const loginAttempts = new Map<string, { count: number; lockedUntil: number | null }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkAttempts(key: string): void {
  const entry = loginAttempts.get(key);
  if (entry?.lockedUntil && entry.lockedUntil > Date.now()) {
    const retryAfterSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw new AppError(429, 'TOO_MANY_ATTEMPTS', `Too many attempts. Try again in ${retryAfterSec} seconds.`);
  }
}

function recordFailure(key: string): void {
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: null };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS;
  }
  loginAttempts.set(key, entry);
}

function resetAttempts(key: string): void {
  loginAttempts.delete(key);
}

export const authService = {
  async adminLogin(storeSlug: string, username: string, password: string) {
    const attemptKey = `${storeSlug}:${username}`;
    checkAttempts(attemptKey);

    const store = storeRepository.findBySlug(storeSlug);
    if (!store) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const admin = adminRepository.findByStoreAndUsername(store.id, username);
    if (!admin) {
      recordFailure(attemptKey);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      recordFailure(attemptKey);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    resetAttempts(attemptKey);

    const token = jwt.sign(
      { storeId: store.id, adminId: admin.id, role: 'admin' as const },
      getJwtSecret(),
      { expiresIn: '16h' },
    );

    return {
      token,
      admin: { id: admin.id, username: admin.username, storeId: store.id, storeName: store.name },
    };
  },

  async tableLogin(storeSlug: string, tableNumber: number, password: string) {
    const attemptKey = `${storeSlug}:table:${tableNumber}`;
    checkAttempts(attemptKey);

    const store = storeRepository.findBySlug(storeSlug);
    if (!store) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const table = db
      .select()
      .from(tables)
      .where(and(eq(tables.storeId, store.id), eq(tables.tableNumber, tableNumber)))
      .get();

    if (!table) {
      recordFailure(attemptKey);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, table.passwordHash);
    if (!valid) {
      recordFailure(attemptKey);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    resetAttempts(attemptKey);

    const token = jwt.sign(
      { storeId: store.id, tableId: table.id, tableNumber: table.tableNumber, role: 'table' as const },
      getJwtSecret(),
      { expiresIn: '16h' },
    );

    return {
      token,
      table: { id: table.id, tableNumber: table.tableNumber, storeId: store.id, storeName: store.name },
    };
  },

  // Exposed for testing
  _getAttempts: () => loginAttempts,
  _clearAttempts: () => loginAttempts.clear(),
};
