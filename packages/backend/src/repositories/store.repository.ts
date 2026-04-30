import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { stores } from '../db/schema.js';

export const storeRepository = {
  findBySlug(slug: string) {
    return db.select().from(stores).where(eq(stores.slug, slug)).get();
  },

  findById(id: number) {
    return db.select().from(stores).where(eq(stores.id, id)).get();
  },
};
