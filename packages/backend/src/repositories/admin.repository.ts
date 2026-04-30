import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { admins } from '../db/schema.js';

export const adminRepository = {
  findByStoreAndUsername(storeId: number, username: string) {
    return db
      .select()
      .from(admins)
      .where(and(eq(admins.storeId, storeId), eq(admins.username, username)))
      .get();
  },

  findAllByStore(storeId: number) {
    return db
      .select({
        id: admins.id,
        storeId: admins.storeId,
        username: admins.username,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .where(eq(admins.storeId, storeId))
      .all();
  },

  create(data: { storeId: number; username: string; passwordHash: string }) {
    return db.insert(admins).values(data).returning({
      id: admins.id,
      storeId: admins.storeId,
      username: admins.username,
      createdAt: admins.createdAt,
    }).get();
  },
};
