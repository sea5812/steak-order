// Unit 3: Order Domain - Route Registration
// This file registers all Unit 3 routes on the Express app.
// In integration with Unit 1, this will be imported in the main server entry point.

import type { Express } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { TableController } from '../controllers/table.controller.js';
import { SSEController } from '../controllers/sse.controller.js';
import { createOrderRoutes, createTableOrderRoutes } from './order.routes.js';
import { createTableRoutes } from './table.routes.js';
import { createSSERoutes } from './sse.routes.js';

export interface Unit3Controllers {
  orderController: OrderController;
  tableController: TableController;
  sseController: SSEController;
}

/**
 * Register Unit 3 routes on the Express app.
 *
 * Auth middleware should be applied at the app level or per-route group
 * by Unit 1's server setup. This function only defines route handlers.
 *
 * Routes registered:
 * - POST   /api/stores/:storeId/orders              (Table auth)
 * - GET    /api/stores/:storeId/orders              (Admin auth)
 * - PUT    /api/stores/:storeId/orders/:id/status   (Admin auth)
 * - DELETE /api/stores/:storeId/orders/:id          (Admin auth)
 * - GET    /api/stores/:storeId/tables/:tableId/orders (Table auth)
 * - GET    /api/stores/:storeId/tables              (Admin auth)
 * - POST   /api/stores/:storeId/tables              (Admin auth)
 * - PUT    /api/stores/:storeId/tables/:id          (Admin auth)
 * - POST   /api/stores/:storeId/tables/:id/complete (Admin auth)
 * - GET    /api/stores/:storeId/tables/:id/history  (Admin auth)
 * - GET    /api/stores/:storeId/sse/admin           (Admin auth)
 * - GET    /api/stores/:storeId/sse/table/:tableId  (Table auth)
 */
export function registerUnit3Routes(app: Express, controllers: Unit3Controllers): void {
  const { orderController, tableController, sseController } = controllers;

  // Order routes
  app.use('/api/stores/:storeId/orders', createOrderRoutes(orderController));

  // Table-specific order routes
  app.use('/api/stores/:storeId/tables/:tableId/orders', createTableOrderRoutes(orderController));

  // Table management routes
  app.use('/api/stores/:storeId/tables', createTableRoutes(tableController));

  // SSE routes
  app.use('/api/stores/:storeId/sse', createSSERoutes(sseController));
}
