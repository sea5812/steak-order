import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderController } from '../../src/controllers/order.controller.js';
import { AppError } from '../../src/errors/app-error.js';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(overrides: Partial<Request> = {}) {
  const req = {
    params: { storeId: '1' },
    query: {},
    body: {},
    tableId: 5,
    sessionId: 10,
    ...overrides,
  } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as any;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('OrderController', () => {
  let controller: OrderController;
  let mockOrderService: any;

  beforeEach(() => {
    mockOrderService = {
      createOrder: vi.fn(),
      getOrdersByTable: vi.fn(),
      getOrdersByStore: vi.fn(),
      updateOrderStatus: vi.fn(),
      deleteOrder: vi.fn(),
    };
    controller = new OrderController(mockOrderService);
  });

  describe('create', () => {
    it('should create order and return 201', () => {
      const mockResult = { order: { order_id: 1 }, items: [] };
      mockOrderService.createOrder.mockReturnValue(mockResult);

      const { req, res, next } = createMockReqRes({
        body: { items: [{ menu_item_id: 1, quantity: 2 }] },
      } as any);

      controller.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should call next with error for empty items', () => {
      const { req, res, next } = createMockReqRes({
        body: { items: [] },
      } as any);

      controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with error for invalid quantity', () => {
      const { req, res, next } = createMockReqRes({
        body: { items: [{ menu_item_id: 1, quantity: 0 }] },
      } as any);

      controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should call next with error when no session', () => {
      const { req, res, next } = createMockReqRes({
        body: { items: [{ menu_item_id: 1, quantity: 1 }] },
      } as any);
      req.sessionId = undefined;

      controller.create(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getByStore', () => {
    it('should return orders for store', () => {
      const mockResult = [{ order: { order_id: 1 }, items: [] }];
      mockOrderService.getOrdersByStore.mockReturnValue(mockResult);

      const { req, res, next } = createMockReqRes();
      controller.getByStore(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should pass date filter', () => {
      mockOrderService.getOrdersByStore.mockReturnValue([]);
      const { req, res, next } = createMockReqRes({ query: { date: '2026-04-30' } } as any);

      controller.getByStore(req, res, next);

      expect(mockOrderService.getOrdersByStore).toHaveBeenCalledWith(1, '2026-04-30');
    });
  });

  describe('updateStatus', () => {
    it('should update status and return result', () => {
      const mockResult = { order: { order_id: 1, status: 'preparing' }, items: [] };
      mockOrderService.updateOrderStatus.mockReturnValue(mockResult);

      const { req, res, next } = createMockReqRes({
        params: { storeId: '1', id: '1' },
        body: { status: 'preparing' },
      } as any);

      controller.updateStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('delete', () => {
    it('should delete order and return message', () => {
      mockOrderService.deleteOrder.mockReturnValue(undefined);

      const { req, res, next } = createMockReqRes({
        params: { storeId: '1', id: '1' },
      } as any);

      controller.delete(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: '주문이 삭제되었습니다' });
    });
  });
});
