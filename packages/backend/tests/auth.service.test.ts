import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// We test the core auth logic directly since the service depends on the real DB module.
// These tests validate the business rules: hashing, JWT, and attempt limiting.

describe('Auth Business Rules', () => {
  describe('Password Hashing (BR-AUTH-01, BR-AUTH-02)', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'admin1234';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare('wrong', hash)).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'test123';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('JWT Token (BR-AUTH-01, BR-AUTH-04)', () => {
    const secret = 'test-secret';

    it('should sign and verify admin token', () => {
      const payload = { storeId: 1, adminId: 1, role: 'admin' as const };
      const token = jwt.sign(payload, secret, { expiresIn: '16h' });

      const decoded = jwt.verify(token, secret) as typeof payload;
      expect(decoded.storeId).toBe(1);
      expect(decoded.adminId).toBe(1);
      expect(decoded.role).toBe('admin');
    });

    it('should sign and verify table token', () => {
      const payload = { storeId: 1, tableId: 5, tableNumber: 5, role: 'table' as const };
      const token = jwt.sign(payload, secret, { expiresIn: '16h' });

      const decoded = jwt.verify(token, secret) as typeof payload;
      expect(decoded.storeId).toBe(1);
      expect(decoded.tableId).toBe(5);
      expect(decoded.tableNumber).toBe(5);
      expect(decoded.role).toBe('table');
    });

    it('should reject expired token', () => {
      const payload = { storeId: 1, adminId: 1, role: 'admin' as const };
      const token = jwt.sign(payload, secret, { expiresIn: '0s' });

      expect(() => jwt.verify(token, secret)).toThrow();
    });

    it('should reject token with wrong secret', () => {
      const payload = { storeId: 1, adminId: 1, role: 'admin' as const };
      const token = jwt.sign(payload, secret);

      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });

  describe('Login Attempt Limiting (BR-AUTH-03)', () => {
    // Simulate the in-memory attempt tracking logic
    const attempts = new Map<string, { count: number; lockedUntil: number | null }>();
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION_MS = 15 * 60 * 1000;

    beforeEach(() => {
      attempts.clear();
    });

    function recordFailure(key: string) {
      const entry = attempts.get(key) || { count: 0, lockedUntil: null };
      entry.count++;
      if (entry.count >= MAX_ATTEMPTS) {
        entry.lockedUntil = Date.now() + LOCK_DURATION_MS;
      }
      attempts.set(key, entry);
    }

    function isLocked(key: string): boolean {
      const entry = attempts.get(key);
      return !!(entry?.lockedUntil && entry.lockedUntil > Date.now());
    }

    function resetAttempts(key: string) {
      attempts.delete(key);
    }

    it('should not lock after fewer than 5 failures', () => {
      const key = 'test:admin';
      for (let i = 0; i < 4; i++) {
        recordFailure(key);
      }
      expect(isLocked(key)).toBe(false);
    });

    it('should lock after 5 failures', () => {
      const key = 'test:admin';
      for (let i = 0; i < 5; i++) {
        recordFailure(key);
      }
      expect(isLocked(key)).toBe(true);
    });

    it('should reset attempts on success', () => {
      const key = 'test:admin';
      for (let i = 0; i < 3; i++) {
        recordFailure(key);
      }
      resetAttempts(key);
      expect(attempts.has(key)).toBe(false);
      expect(isLocked(key)).toBe(false);
    });
  });
});
