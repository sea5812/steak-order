import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/error-handler.js';
import type { Request, Response } from 'express';

const router = Router();

const adminLoginSchema = z.object({
  storeSlug: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

const tableLoginSchema = z.object({
  storeSlug: z.string().min(1),
  tableNumber: z.number().int().positive(),
  password: z.string().min(1),
});

// POST /api/admin/login
router.post(
  '/admin/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, username, password } = adminLoginSchema.parse(req.body);
    const result = await authService.adminLogin(storeSlug, username, password);
    res.json({ data: result });
  }),
);

// POST /api/table/login
router.post(
  '/table/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, tableNumber, password } = tableLoginSchema.parse(req.body);
    const result = await authService.tableLogin(storeSlug, tableNumber, password);
    res.json({ data: result });
  }),
);

export const authController = router;
