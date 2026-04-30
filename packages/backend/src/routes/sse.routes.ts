// SSE Routes

import { Router } from 'express';
import { SSEController } from '../controllers/sse.controller.js';

export function createSSERoutes(sseController: SSEController): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stores/:storeId/sse/admin — Admin SSE stream
  router.get('/admin', sseController.adminStream);

  // GET /api/stores/:storeId/sse/table/:tableId — Table SSE stream
  router.get('/table/:tableId', sseController.tableStream);

  return router;
}
