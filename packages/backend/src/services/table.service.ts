// TableService - Business logic for table and session management

import type Database from 'better-sqlite3';
import { TableRepository } from '../repositories/table.repository.js';
import { OrderRepository } from '../repositories/order.repository.js';
import { SSEService } from './sse.service.js';
import { AppError } from '../errors/app-error.js';
import { withRetry } from '../utils/retry.js';
import { getNowISO } from '../utils/order-number.js';
import type {
  TableInfo,
  TableSession,
  TableWithSession,
  CompleteResult,
  OrderHistoryItem,
  ParsedOrderItem,
  NewOrderHistory,
  NewTableSession,
} from '../types/order.types.js';

export class TableService {
  constructor(
    private db: Database.Database,
    private tableRepository: TableRepository,
    private orderRepository: OrderRepository,
    private sseService: SSEService
  ) {}

  // ============================================================
  // Table CRUD (US-A04)
  // ============================================================

  createTable(storeId: number, tableNumber: number, passwordHash: string): TableInfo {
    // Check duplicate
    const existing = this.tableRepository.findByTableNumber(storeId, tableNumber);
    if (existing) {
      throw new AppError(409, 'TABLE_NUMBER_DUPLICATE', `테이블 번호 ${tableNumber}이(가) 이미 존재합니다`);
    }

    return withRetry(() => {
      return this.tableRepository.create({
        store_id: storeId,
        table_number: tableNumber,
        password_hash: passwordHash,
      });
    });
  }

  updateTable(
    storeId: number,
    tableId: number,
    data: { table_number?: number; password_hash?: string }
  ): TableInfo {
    const table = this.tableRepository.findByIdAndStore(tableId, storeId);
    if (!table) {
      throw new AppError(404, 'TABLE_NOT_FOUND', '테이블을 찾을 수 없습니다');
    }

    // Check duplicate table number if changing
    if (data.table_number !== undefined && data.table_number !== table.table_number) {
      const existing = this.tableRepository.findByTableNumber(storeId, data.table_number);
      if (existing) {
        throw new AppError(409, 'TABLE_NUMBER_DUPLICATE', `테이블 번호 ${data.table_number}이(가) 이미 존재합니다`);
      }
    }

    const updated = withRetry(() => {
      return this.tableRepository.update(tableId, data);
    });

    if (!updated) {
      throw new AppError(500, 'INTERNAL_ERROR', '테이블 수정 중 오류가 발생했습니다');
    }

    return updated;
  }

  // ============================================================
  // Table List with Session Info (US-A03, US-A04)
  // ============================================================

  getTablesByStore(storeId: number): TableWithSession[] {
    const tables = this.tableRepository.findByStoreId(storeId);
    const activeSessions = this.tableRepository.findActiveSessionByStore(storeId);

    const sessionByTableId = new Map<number, TableSession>();
    for (const session of activeSessions) {
      sessionByTableId.set(session.table_id, session);
    }

    // Get orders for active sessions
    const sessionIds = activeSessions.map((s) => s.session_id);
    const orders = sessionIds.length > 0
      ? this.orderRepository.findBySessionIds(storeId, sessionIds)
      : [];

    const ordersBySessionId = new Map<number, { totalAmount: number; orderCount: number }>();
    for (const order of orders) {
      const existing = ordersBySessionId.get(order.session_id) || { totalAmount: 0, orderCount: 0 };
      existing.totalAmount += order.total_amount;
      existing.orderCount += 1;
      ordersBySessionId.set(order.session_id, existing);
    }

    return tables.map((table) => {
      const session = sessionByTableId.get(table.table_id) || null;
      const stats = session ? ordersBySessionId.get(session.session_id) : undefined;
      return {
        table,
        activeSession: session,
        totalAmount: stats?.totalAmount || 0,
        orderCount: stats?.orderCount || 0,
      };
    });
  }

  // ============================================================
  // Session Management (US-C01, US-C04)
  // ============================================================

  getOrCreateSession(storeId: number, tableId: number): TableSession {
    const existing = this.tableRepository.findActiveSession(tableId);
    if (existing) return existing;

    const now = getNowISO();
    const newSession: NewTableSession = {
      table_id: tableId,
      store_id: storeId,
      status: 'active',
      started_at: now,
    };

    return withRetry(() => {
      return this.tableRepository.createSession(newSession);
    });
  }

  getActiveSession(tableId: number): TableSession | undefined {
    return this.tableRepository.findActiveSession(tableId);
  }

  // ============================================================
  // Complete Table (US-A04)
  // ============================================================

  completeTable(storeId: number, tableId: number): CompleteResult {
    const table = this.tableRepository.findByIdAndStore(tableId, storeId);
    if (!table) {
      throw new AppError(404, 'TABLE_NOT_FOUND', '테이블을 찾을 수 없습니다');
    }

    const session = this.tableRepository.findActiveSession(tableId);
    if (!session) {
      throw new AppError(400, 'SESSION_ALREADY_COMPLETED', '이미 이용 완료된 테이블입니다');
    }

    const now = getNowISO();

    const result = withRetry(() => {
      return this.db.transaction(() => {
        // Get all orders for this session
        const orders = this.orderRepository.findBySession(storeId, session.session_id);
        let historyCount = 0;

        for (const order of orders) {
          // Get order items
          const items = this.orderRepository.findItemsByOrderId(order.order_id);

          // Create history record
          const itemsJson: ParsedOrderItem[] = items.map((item) => ({
            menu_name: item.menu_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
          }));

          const historyData: NewOrderHistory = {
            original_order_id: order.order_id,
            order_number: order.order_number,
            store_id: storeId,
            table_id: tableId,
            session_id: session.session_id,
            total_amount: order.total_amount,
            status: order.status,
            ordered_at: order.ordered_at,
            completed_at: now,
            items_json: JSON.stringify(itemsJson),
          };

          this.orderRepository.createHistory(historyData);
          historyCount++;
        }

        // Delete all orders and items for this session
        this.orderRepository.deleteBySessionId(session.session_id);

        // Complete session
        this.tableRepository.completeSession(session.session_id, now);

        return historyCount;
      })();
    });

    // SSE notification
    this.sseService.notifyTableCompleted(storeId, tableId, session.session_id);

    return {
      message: '이용 완료 처리되었습니다',
      historyCount: result,
    };
  }

  // ============================================================
  // Order History (US-A04)
  // ============================================================

  getTableHistory(
    storeId: number,
    tableId: number,
    startDate?: string,
    endDate?: string
  ): OrderHistoryItem[] {
    const table = this.tableRepository.findByIdAndStore(tableId, storeId);
    if (!table) {
      throw new AppError(404, 'TABLE_NOT_FOUND', '테이블을 찾을 수 없습니다');
    }

    // Default: last 90 days
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const defaultEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const start = startDate ? `${startDate}T00:00:00.000Z` : defaultStart;
    const end = endDate ? `${endDate}T23:59:59.999Z` : defaultEnd;

    const histories = this.orderRepository.findHistoryByTable(storeId, tableId, start, end);

    return histories.map((history) => {
      let items: ParsedOrderItem[] = [];
      try {
        items = JSON.parse(history.items_json) as ParsedOrderItem[];
      } catch {
        items = [];
      }
      return { history, items };
    });
  }
}
