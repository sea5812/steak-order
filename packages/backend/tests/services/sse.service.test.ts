import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SSEService } from '../../src/services/sse.service.js';
import { SSEManager } from '../../src/sse/sse-manager.js';
import type { OrderWithItems } from '../../src/types/order.types.js';

describe('SSEService', () => {
  let sseService: SSEService;
  let mockManager: SSEManager;

  beforeEach(() => {
    mockManager = {
      broadcastToAdmin: vi.fn(),
      broadcastToTable: vi.fn(),
      addAdminClient: vi.fn(),
      removeAdminClient: vi.fn(),
      addTableClient: vi.fn(),
      removeTableClient: vi.fn(),
      startHeartbeat: vi.fn(),
      stopHeartbeat: vi.fn(),
    } as any;
    sseService = new SSEService(mockManager);
  });

  const mockOrderWithItems: OrderWithItems = {
    order: {
      order_id: 1,
      order_number: '20260430-001',
      store_id: 1,
      table_id: 5,
      session_id: 10,
      total_amount: 50000,
      status: 'pending',
      ordered_at: '2026-04-30T12:00:00Z',
      updated_at: '2026-04-30T12:00:00Z',
    },
    items: [],
  };

  it('should notify new order to admin', () => {
    sseService.notifyNewOrder(1, mockOrderWithItems);
    expect(mockManager.broadcastToAdmin).toHaveBeenCalledWith(1, 'order:new', mockOrderWithItems);
  });

  it('should notify order updated to admin', () => {
    sseService.notifyOrderUpdated(1, mockOrderWithItems);
    expect(mockManager.broadcastToAdmin).toHaveBeenCalledWith(1, 'order:updated', mockOrderWithItems);
  });

  it('should notify order deleted to admin', () => {
    sseService.notifyOrderDeleted(1, 42, 5);
    expect(mockManager.broadcastToAdmin).toHaveBeenCalledWith(1, 'order:deleted', { orderId: 42, tableId: 5 });
  });

  it('should notify table completed to admin', () => {
    sseService.notifyTableCompleted(1, 5, 10);
    expect(mockManager.broadcastToAdmin).toHaveBeenCalledWith(1, 'table:completed', { tableId: 5, sessionId: 10 });
  });

  it('should notify table order status changed', () => {
    sseService.notifyTableOrderStatusChanged(1, 5, mockOrderWithItems);
    expect(mockManager.broadcastToTable).toHaveBeenCalledWith(1, 5, 'order:statusChanged', mockOrderWithItems);
  });

  it('should notify table order deleted', () => {
    sseService.notifyTableOrderDeleted(1, 5, 42);
    expect(mockManager.broadcastToTable).toHaveBeenCalledWith(1, 5, 'order:deleted', { orderId: 42 });
  });

  it('should delegate connection management to manager', () => {
    const res = {} as any;
    sseService.addAdminClient(1, res);
    expect(mockManager.addAdminClient).toHaveBeenCalledWith(1, res);

    sseService.removeAdminClient(1, res);
    expect(mockManager.removeAdminClient).toHaveBeenCalledWith(1, res);

    sseService.addTableClient(1, 5, res);
    expect(mockManager.addTableClient).toHaveBeenCalledWith(1, 5, res);

    sseService.removeTableClient(1, 5);
    expect(mockManager.removeTableClient).toHaveBeenCalledWith(1, 5);
  });
});
