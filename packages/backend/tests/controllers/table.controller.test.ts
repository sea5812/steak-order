import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableController } from '../../src/controllers/table.controller.js';
import type { NextFunction } from 'express';

function createMockReqRes(overrides: any = {}) {
  const req = {
    params: { storeId: '1' },
    query: {},
    body: {},
    ...overrides,
  } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as any;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: { hashSync: vi.fn().mockReturnValue('hashed_password') },
  hashSync: vi.fn().mockReturnValue('hashed_password'),
}));

describe('TableController', () => {
  let controller: TableController;
  let mockTableService: any;

  beforeEach(() => {
    mockTableService = {
      createTable: vi.fn(),
      updateTable: vi.fn(),
      getTablesByStore: vi.fn(),
      completeTable: vi.fn(),
      getTableHistory: vi.fn(),
    };
    controller = new TableController(mockTableService);
  });

  describe('create', () => {
    it('should create table and return 201 without password_hash', () => {
      mockTableService.createTable.mockReturnValue({
        table_id: 1, store_id: 1, table_number: 5, password_hash: 'hashed',
      });

      const { req, res, next } = createMockReqRes({
        body: { table_number: 5, password: 'test1234' },
      });

      controller.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.table_number).toBe(5);
      expect(jsonArg.password_hash).toBeUndefined();
    });
  });

  describe('getByStore', () => {
    it('should return tables without password_hash', () => {
      mockTableService.getTablesByStore.mockReturnValue([
        {
          table: { table_id: 1, store_id: 1, table_number: 1, password_hash: 'h1' },
          activeSession: null,
          totalAmount: 0,
          orderCount: 0,
        },
      ]);

      const { req, res, next } = createMockReqRes();
      controller.getByStore(req, res, next);

      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg[0].table.password_hash).toBeUndefined();
      expect(jsonArg[0].table.table_number).toBe(1);
    });
  });

  describe('complete', () => {
    it('should complete table and return result', () => {
      mockTableService.completeTable.mockReturnValue({
        message: '이용 완료 처리되었습니다',
        historyCount: 3,
      });

      const { req, res, next } = createMockReqRes({
        params: { storeId: '1', id: '5' },
      });

      controller.complete(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        message: '이용 완료 처리되었습니다',
        historyCount: 3,
      });
    });
  });

  describe('getHistory', () => {
    it('should return history', () => {
      mockTableService.getTableHistory.mockReturnValue([]);

      const { req, res, next } = createMockReqRes({
        params: { storeId: '1', id: '5' },
        query: { startDate: '2026-04-01', endDate: '2026-04-30' },
      });

      controller.getHistory(req, res, next);

      expect(mockTableService.getTableHistory).toHaveBeenCalledWith(1, 5, '2026-04-01', '2026-04-30');
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});
