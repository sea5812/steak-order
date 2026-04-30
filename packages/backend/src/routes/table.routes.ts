// Table Routes

import { Router } from 'express';
import { TableController } from '../controllers/table.controller.js';

export function createTableRoutes(tableController: TableController): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stores/:storeId/tables — Get all tables (Admin auth)
  router.get('/', tableController.getByStore);

  // POST /api/stores/:storeId/tables — Create table (Admin auth)
  router.post('/', tableController.create);

  // PUT /api/stores/:storeId/tables/:id — Update table (Admin auth)
  router.put('/:id', tableController.update);

  // POST /api/stores/:storeId/tables/:id/complete — Complete table session (Admin auth)
  router.post('/:id/complete', tableController.complete);

  // GET /api/stores/:storeId/tables/:id/history — Get table order history (Admin auth)
  router.get('/:id/history', tableController.getHistory);

  return router;
}
