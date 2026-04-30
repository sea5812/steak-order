// TableService - Aligned with Unit 1 schema

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

  createTable(storeId: number, tableNumber: number, passwordHash: string): TableInfo {
    const existing = this.tableRepository.findByStoreAndNumber(storeId, tableNumber);
    if (existing) {
      throw new AppError(409, 'TABLE_NUMBER_DUPLICATE', `테이블 번호 ${tableNumber}이(가) 이미 존재합니다`);
    }
    return withRetry(() => this.tableRepository.create(storeId, tableNumber, passwordHash));
  }

  updateTable(storeId: number, tableId: number, data: { table_number?: number; password_hash?: string }): TableInfo {
    const table = this.tableRepository.findByIdAndStore(tableId, storeId);
    if (!table) throw new AppError(404, 'TABLE_NOT_FOUND', '테이블을 찾을 수 없습니다');

    if (data.table_number !== undefined && data.table_number !== table.table_number) {
      const existing = this.tableRepository.findByStoreAndNumber(storeId, data.table_number);
      if (existing) throw new AppError(409, 'TABLE_NUMBER_DUPLICATE', `테이블 번호 ${data.table_number}이(가) 이미 존재합니다`);
    }

    const updated = withRetry(() => this.tableRepository.update(tableId, data));
    if (!updated) throw new AppError(500, 'INTERNAL_ERROR', '테이블 수정 중 오류가 발생했습니다');
    return updated;
  }

  getTablesByStore(storeId: number): TableWithSession[] {
    const tables = this.tableRepository.findByStoreId(storeId);
    const activeSessions = this.tableRepository.findActiveSessionsByStore(storeId);

    const sessionByTableId = new Map<number, TableSession>();
    for (const session of activeSessions) {
      sessionByTableId.set(session.table_id, session);
    }

    const sessionIds = activeSessions.map((s) => s.id);
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
      const session = sessionByTableId.get(table.id) || null;
      const stats = session ? ordersBySessionId.get(session.id) : undefined;
      return {
        table,
        activeSession: session,
        totalAmount: stats?.totalAmount || 0,
        orderCount: stats?.orderCount || 0,
      };
    });
  }

  getOrCreateSession(storeId: number, tableId: number): TableSession {
    const existing = this.tableRepository.findActiveSession(tableId);
    if (existing) return existing;

    const now = getNowISO();
    const newSession: NewTableSession = {
      table_id: tableId,
      store_id: storeId,
      started_at: now,
    };

    return withRetry(() => this.tableRepository.createSession(newSession));
  }

  getActiveSession(tableId: number): TableSession | undefined {
    return this.tableRepository.findActiveSession(tableId);
  }

  completeTable(storeId: number, tableId: number): CompleteResult {
    const table = this.tableRepository.findByIdAndStore(tableId, storeId);
    if (!table) throw new AppError(404, 'TABLE_NOT_FOUND', '테이블을 찾을 수 없습니다');

    const session = this.tableRepository.findActiveSession(tableId);
    if (!session) throw new AppError(400, 'SESSION_ALREADY_COMPLETED', '이미 이용 완료된 테이블입니다');

    const now = getNowISO();

    const result = withRetry(() => {
      return this.db.transaction(() => {
        const orders = this.orderRepository.findBySession(storeId, session.id);
        let historyCount = 0;

        for (const order of orders) {
          const items = this.orderRepository.findItemsByOrderId(order.id);

          const orderData = {
            id: order.id,
            total_amount: order.total_amount,
            status: order.status,
            ordered_at: order.ordered_at,
            items: items.map((item) => ({
              menu_name: item.menu_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          };

          const historyData: NewOrderHistory = {
            store_id: storeId,
            table_id: tableId,
            session_id: session.id,
            order_data: JSON.stringify(orderData),
            completed_at: now,
          };

          this.orderRepository.createHistory(historyData);
          historyCount++;
        }

        this.orderRepository.deleteBySessionId(session.id);
        this.tableRepository.endSession(session.id, now);

        return historyCount;
      })();
    });

    this.sseService.notifyTableCompleted(storeId, tableId, session.id);

    return { message: '이용 완료 처리되었습니다', historyCount: result };
  }

  getTableHistory(storeId: number, tableId: number, startDate?: string, endDate?: string): OrderHistoryItem[] {
    const table = this.tableRepository.findByIdAndStore(tableId, storeId);
    if (!table) throw new AppError(404, 'TABLE_NOT_FOUND', '테이블을 찾을 수 없습니다');

    const histories = this.orderRepository.findHistoryByTable(storeId, tableId, startDate, endDate);

    return histories.map((history) => {
      let items: ParsedOrderItem[] = [];
      try {
        const parsed = JSON.parse(history.order_data);
        items = (parsed.items || []).map((item: ParsedOrderItem) => ({
          menu_name: item.menu_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.unit_price * item.quantity,
        }));
      } catch {
        items = [];
      }
      return { history, items };
    });
  }
}
