// Order Routes

import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { tableAuth, adminAuth, anyAuth } from '../middleware/auth.js';

export function createOrderRoutes(orderController: OrderController): Router {
  const router = Router({ mergeParams: true });

  // POST /api/stores/:storeId/orders — Create order (Table auth)
  router.post('/', tableAuth, orderController.create);

  // GET /api/stores/:storeId/orders — Get store orders (Admin auth)
  router.get('/', adminAuth, orderController.getByStore);

  // PUT /api/stores/:storeId/orders/:id/status — Update order status (Admin auth)
  router.put('/:id/status', adminAuth, orderController.updateStatus);

  // DELETE /api/stores/:storeId/orders/:id — Delete order (Admin auth)
  router.delete('/:id', adminAuth, orderController.delete);

  return router;
}

export function createTableOrderRoutes(orderController: OrderController): Router {
  const router = Router({ mergeParams: true });

  // GET /api/stores/:storeId/tables/:tableId/orders — Get table session orders (Table auth)
  router.get('/', anyAuth, orderController.getByTable);

  return router;
}
