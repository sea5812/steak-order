import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SSEManager } from '../../src/sse/sse-manager.js';

function createMockResponse() {
  return {
    write: vi.fn().mockReturnValue(true),
    end: vi.fn(),
    writeHead: vi.fn(),
  } as any;
}

describe('SSEManager', () => {
  let manager: SSEManager;

  beforeEach(() => {
    manager = new SSEManager();
  });

  describe('Admin Client Management', () => {
    it('should add and remove admin client', () => {
      const res = createMockResponse();
      manager.addAdminClient(1, res);
      expect(manager.getConnectionCount().admin).toBe(1);

      manager.removeAdminClient(1, res);
      expect(manager.getConnectionCount().admin).toBe(0);
    });

    it('should handle multiple admin clients for same store', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      manager.addAdminClient(1, res1);
      manager.addAdminClient(1, res2);
      expect(manager.getConnectionCount().admin).toBe(2);
    });
  });

  describe('Table Client Management', () => {
    it('should add and remove table client', () => {
      const res = createMockResponse();
      manager.addTableClient(1, 5, res);
      expect(manager.getConnectionCount().table).toBe(1);

      manager.removeTableClient(1, 5);
      expect(manager.getConnectionCount().table).toBe(0);
    });

    it('should replace existing table client', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      manager.addTableClient(1, 5, res1);
      manager.addTableClient(1, 5, res2);
      expect(manager.getConnectionCount().table).toBe(1);
      expect(res1.end).toHaveBeenCalled();
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast to admin clients', () => {
      const res1 = createMockResponse();
      const res2 = createMockResponse();
      manager.addAdminClient(1, res1);
      manager.addAdminClient(1, res2);

      manager.broadcastToAdmin(1, 'order:new', { id: 1 });

      expect(res1.write).toHaveBeenCalledWith(
        expect.stringContaining('event: order:new')
      );
      expect(res2.write).toHaveBeenCalledWith(
        expect.stringContaining('event: order:new')
      );
    });

    it('should broadcast to specific table client', () => {
      const res = createMockResponse();
      manager.addTableClient(1, 5, res);

      manager.broadcastToTable(1, 5, 'order:statusChanged', { id: 1 });

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('event: order:statusChanged')
      );
    });

    it('should remove failed admin clients on broadcast', () => {
      const res = createMockResponse();
      res.write.mockImplementation(() => { throw new Error('Connection closed'); });
      manager.addAdminClient(1, res);

      manager.broadcastToAdmin(1, 'test', {});
      expect(manager.getConnectionCount().admin).toBe(0);
    });

    it('should remove failed table client on broadcast', () => {
      const res = createMockResponse();
      res.write.mockImplementation(() => { throw new Error('Connection closed'); });
      manager.addTableClient(1, 5, res);

      manager.broadcastToTable(1, 5, 'test', {});
      expect(manager.getConnectionCount().table).toBe(0);
    });

    it('should not fail when broadcasting to non-existent store', () => {
      expect(() => manager.broadcastToAdmin(999, 'test', {})).not.toThrow();
    });

    it('should not fail when broadcasting to non-existent table', () => {
      expect(() => manager.broadcastToTable(999, 999, 'test', {})).not.toThrow();
    });
  });

  describe('Heartbeat', () => {
    it('should start and stop heartbeat', () => {
      vi.useFakeTimers();
      manager.startHeartbeat();

      const res = createMockResponse();
      manager.addAdminClient(1, res);

      vi.advanceTimersByTime(30_000);
      expect(res.write).toHaveBeenCalledWith(':heartbeat\n\n');

      manager.stopHeartbeat();
      vi.useRealTimers();
    });

    it('should remove failed clients during heartbeat', () => {
      vi.useFakeTimers();
      manager.startHeartbeat();

      const res = createMockResponse();
      res.write.mockImplementation(() => { throw new Error('closed'); });
      manager.addAdminClient(1, res);

      vi.advanceTimersByTime(30_000);
      expect(manager.getConnectionCount().admin).toBe(0);

      manager.stopHeartbeat();
      vi.useRealTimers();
    });
  });
});
