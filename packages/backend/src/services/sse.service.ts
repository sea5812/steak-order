// SSEService - Business event wrapper for SSEManager

import type { Response } from 'express';
import { SSEManager } from '../sse/sse-manager.js';
import type { OrderWithItems } from '../types/order.types.js';

export class SSEService {
  constructor(private sseManager: SSEManager) {}

  // ============================================================
  // Admin Events
  // ============================================================

  notifyNewOrder(storeId: number, orderWithItems: OrderWithItems): void {
    this.sseManager.broadcastToAdmin(storeId, 'order:new', orderWithItems);
  }

  notifyOrderUpdated(storeId: number, orderWithItems: OrderWithItems): void {
    this.sseManager.broadcastToAdmin(storeId, 'order:updated', orderWithItems);
  }

  notifyOrderDeleted(storeId: number, orderId: number, tableId: number): void {
    this.sseManager.broadcastToAdmin(storeId, 'order:deleted', { orderId, tableId });
  }

  notifyTableCompleted(storeId: number, tableId: number, sessionId: number): void {
    this.sseManager.broadcastToAdmin(storeId, 'table:completed', { tableId, sessionId });
  }

  // ============================================================
  // Table Events
  // ============================================================

  notifyTableOrderStatusChanged(storeId: number, tableId: number, orderWithItems: OrderWithItems): void {
    this.sseManager.broadcastToTable(storeId, tableId, 'order:statusChanged', orderWithItems);
  }

  notifyTableOrderDeleted(storeId: number, tableId: number, orderId: number): void {
    this.sseManager.broadcastToTable(storeId, tableId, 'order:deleted', { orderId });
  }

  // ============================================================
  // Connection Management (delegated to SSEManager)
  // ============================================================

  addAdminClient(storeId: number, res: Response): void {
    this.sseManager.addAdminClient(storeId, res);
  }

  removeAdminClient(storeId: number, res: Response): void {
    this.sseManager.removeAdminClient(storeId, res);
  }

  addTableClient(storeId: number, tableId: number, res: Response): void {
    this.sseManager.addTableClient(storeId, tableId, res);
  }

  removeTableClient(storeId: number, tableId: number): void {
    this.sseManager.removeTableClient(storeId, tableId);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  startHeartbeat(): void {
    this.sseManager.startHeartbeat();
  }

  stopHeartbeat(): void {
    this.sseManager.stopHeartbeat();
  }
}
