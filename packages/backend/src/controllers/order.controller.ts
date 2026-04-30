// OrderController - HTTP request handlers for order endpoints

import type { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { AppError } from '../errors/app-error.js';
import { validatePositiveInteger, validateEnum, validateDateString } from '../utils/validators.js';
import { ORDER_STATUSES } from '../types/order.types.js';
import type { OrderStatus } from '../types/order.types.js';
import { TableRepository } from '../repositories/table.repository.js';
import { sqlite } from '../db/index.js';

export class OrderController {
  constructor(private orderService: OrderService) {}

  /**
   * POST /api/stores/:storeId/orders
   * Create a new order (Customer - US-C04)
   */
  create = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      // tableId comes from JWT payload via auth middleware
      const user = (req as any).user;
      const tableId = user?.tableId as number;

      if (!tableId) {
        throw new AppError(401, 'UNAUTHORIZED', '테이블 인증이 필요합니다');
      }

      const { items } = req.body;

      // Validate items
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'INVALID_ORDER_ITEMS', '주문 항목이 없습니다');
      }

      for (const item of items) {
        if (!item.menu_item_id || typeof item.menu_item_id !== 'number') {
          throw new AppError(400, 'INVALID_MENU_ITEM', '유효하지 않은 메뉴 항목입니다');
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
          throw new AppError(400, 'INVALID_QUANTITY', '수량은 1 이상이어야 합니다');
        }
      }

      // Auto-create session if not exists
      const tableRepo = new TableRepository(sqlite);
      let session = tableRepo.findActiveSession(tableId);
      if (!session) {
        session = tableRepo.createSession({
          table_id: tableId,
          store_id: storeId,
          started_at: new Date().toISOString(),
        });
      }

      const result = this.orderService.createOrder(storeId, tableId, session.id, items);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stores/:storeId/tables/:tableId/orders
   * Get orders for current table session (Customer - US-C05)
   */
  getByTable = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const tableId = Number(req.params.tableId);

      // Find active session for this table
      const tableRepo = new TableRepository(sqlite);
      const session = tableRepo.findActiveSession(tableId);

      if (!session) {
        res.json([]);
        return;
      }

      const result = this.orderService.getOrdersByTable(storeId, session.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stores/:storeId/orders
   * Get all orders for the store (Admin - US-A03)
   */
  getByStore = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const date = req.query.date as string | undefined;

      if (date) {
        validateDateString(date, 'date');
      }

      const result = this.orderService.getOrdersByStore(storeId, date);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/stores/:storeId/orders/:id/status
   * Update order status (Admin - US-A03)
   */
  updateStatus = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const orderId = validatePositiveInteger(req.params.id, 'order_id');
      const status = validateEnum<OrderStatus>(req.body.status, [...ORDER_STATUSES], 'status');

      const result = this.orderService.updateOrderStatus(storeId, orderId, status);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/stores/:storeId/orders/:id
   * Delete an order (Admin - US-A04)
   */
  delete = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const storeId = Number(req.params.storeId);
      const orderId = validatePositiveInteger(req.params.id, 'order_id');

      this.orderService.deleteOrder(storeId, orderId);
      res.json({ message: '주문이 삭제되었습니다' });
    } catch (error) {
      next(error);
    }
  };
}
