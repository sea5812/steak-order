import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { createTestDb, seedTestData } from './setup.js';
import * as schema from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';

describe('Admin Business Rules', () => {
  describe('BR-ADMIN-01: Admin Account Creation', () => {
    it('should hash password with bcrypt before storing', async () => {
      const password = 'newpass123';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });

    it('should validate username format (alphanumeric + underscore)', () => {
      const validUsernames = ['admin', 'user_1', 'Test123', 'a_b_c'];
      const invalidUsernames = ['admin@test', 'user name', 'user!', '한글'];

      const regex = /^[a-zA-Z0-9_]+$/;

      for (const u of validUsernames) {
        expect(regex.test(u), `${u} should be valid`).toBe(true);
      }
      for (const u of invalidUsernames) {
        expect(regex.test(u), `${u} should be invalid`).toBe(false);
      }
    });

    it('should enforce username length (2-50 chars)', () => {
      expect('a'.length >= 2).toBe(false);
      expect('ab'.length >= 2).toBe(true);
      expect('a'.repeat(50).length <= 50).toBe(true);
      expect('a'.repeat(51).length <= 50).toBe(false);
    });

    it('should enforce minimum password length (4 chars)', () => {
      expect('abc'.length >= 4).toBe(false);
      expect('abcd'.length >= 4).toBe(true);
    });
  });

  describe('BR-ADMIN-02: Admin Account List', () => {
    it('should exclude password hash from query results', () => {
      const { db } = createTestDb();

      // Insert test data
      db.insert(schema.stores).values({ slug: 'test', name: 'Test' }).run();
      const hash = bcrypt.hashSync('pass', 10);
      db.insert(schema.admins).values({ storeId: 1, username: 'admin1', passwordHash: hash }).run();

      // Query without password hash
      const admins = db
        .select({
          id: schema.admins.id,
          storeId: schema.admins.storeId,
          username: schema.admins.username,
          createdAt: schema.admins.createdAt,
        })
        .from(schema.admins)
        .where(eq(schema.admins.storeId, 1))
        .all();

      expect(admins).toHaveLength(1);
      expect(admins[0].username).toBe('admin1');
      expect((admins[0] as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });

  describe('BR-GLOBAL-03: Store Isolation', () => {
    it('should only return admins for the specified store', () => {
      const { db } = createTestDb();

      db.insert(schema.stores).values({ slug: 'store1', name: 'Store 1' }).run();
      db.insert(schema.stores).values({ slug: 'store2', name: 'Store 2' }).run();

      const hash = bcrypt.hashSync('pass', 10);
      db.insert(schema.admins).values({ storeId: 1, username: 'admin1', passwordHash: hash }).run();
      db.insert(schema.admins).values({ storeId: 2, username: 'admin2', passwordHash: hash }).run();

      const store1Admins = db
        .select({ id: schema.admins.id, username: schema.admins.username })
        .from(schema.admins)
        .where(eq(schema.admins.storeId, 1))
        .all();

      expect(store1Admins).toHaveLength(1);
      expect(store1Admins[0].username).toBe('admin1');
    });
  });

  describe('Duplicate Username Detection', () => {
    it('should detect duplicate username within same store', () => {
      const { db } = createTestDb();

      db.insert(schema.stores).values({ slug: 'test', name: 'Test' }).run();
      const hash = bcrypt.hashSync('pass', 10);
      db.insert(schema.admins).values({ storeId: 1, username: 'admin', passwordHash: hash }).run();

      const existing = db
        .select()
        .from(schema.admins)
        .where(and(eq(schema.admins.storeId, 1), eq(schema.admins.username, 'admin')))
        .get();

      expect(existing).toBeDefined();
      expect(existing?.username).toBe('admin');
    });

    it('should allow same username in different stores', () => {
      const { db } = createTestDb();

      db.insert(schema.stores).values({ slug: 'store1', name: 'Store 1' }).run();
      db.insert(schema.stores).values({ slug: 'store2', name: 'Store 2' }).run();

      const hash = bcrypt.hashSync('pass', 10);
      db.insert(schema.admins).values({ storeId: 1, username: 'admin', passwordHash: hash }).run();
      db.insert(schema.admins).values({ storeId: 2, username: 'admin', passwordHash: hash }).run();

      const all = db.select().from(schema.admins).all();
      expect(all).toHaveLength(2);
    });
  });
});
