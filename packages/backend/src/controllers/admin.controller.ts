import { Router } from 'express';
import { z } from 'zod';
import { adminService } from '../services/admin.service.js';
import { adminAuth, verifyStoreAccess } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

const createAdminSchema = z.object({
  username: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores'),
  password: z.string().min(4),
});

// GET /api/stores/:storeId/admins
router.get(
  '/stores/:storeId/admins',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const admins = adminService.getAdminsByStore(storeId);
    res.json({ data: admins });
  }),
);

// POST /api/stores/:storeId/admins
router.post(
  '/stores/:storeId/admins',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const { username, password } = createAdminSchema.parse(req.body);
    const admin = await adminService.createAdmin(storeId, username, password);
    res.status(201).json({ data: admin });
  }),
);

export const adminController = router;
