import { Router } from 'express';
import type { Response } from 'express';
import { adminAuth, verifyStoreAccess } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { sqlite } from '../db/index.js';

const router = Router();

// GET /api/stores/:storeId/sales/summary?date=YYYY-MM-DD
router.get(
  '/stores/:storeId/sales/summary',
  adminAuth,
  verifyStoreAccess,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const storeId = Number(req.params.storeId);
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    // 오늘 주문 통계
    const todayOrders = sqlite.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
      FROM orders WHERE store_id = ? AND ordered_at LIKE ?
    `).get(storeId, `${date}%`) as { count: number; total: number };

    // 주문 상태별 통계
    const statusStats = sqlite.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders WHERE store_id = ? AND ordered_at LIKE ?
      GROUP BY status
    `).all(storeId, `${date}%`) as Array<{ status: string; count: number }>;

    // 메뉴별 판매 통계 (인기 메뉴)
    const menuStats = sqlite.prepare(`
      SELECT oi.menu_name, SUM(oi.quantity) as totalQuantity, SUM(oi.quantity * oi.unit_price) as totalSales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = ? AND o.ordered_at LIKE ?
      GROUP BY oi.menu_name
      ORDER BY totalQuantity DESC
    `).all(storeId, `${date}%`) as Array<{ menu_name: string; totalQuantity: number; totalSales: number }>;

    // 시간대별 주문 통계
    const hourlyStats = sqlite.prepare(`
      SELECT substr(ordered_at, 12, 2) as hour, COUNT(*) as count, SUM(total_amount) as total
      FROM orders WHERE store_id = ? AND ordered_at LIKE ?
      GROUP BY hour ORDER BY hour
    `).all(storeId, `${date}%`) as Array<{ hour: string; count: number; total: number }>;

    // 과거 이력 매출 (이용 완료된 주문)
    const historyTotal = sqlite.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(
        json_extract(order_data, '$.total_amount')
      ), 0) as total
      FROM order_history WHERE store_id = ? AND completed_at LIKE ?
    `).get(storeId, `${date}%`) as { count: number; total: number };

    res.json({
      date,
      orders: {
        count: todayOrders.count,
        totalSales: todayOrders.total,
      },
      completedHistory: {
        count: historyTotal.count,
        totalSales: historyTotal.total,
      },
      statusBreakdown: statusStats,
      menuRanking: menuStats.map((m) => ({
        menuName: m.menu_name,
        totalQuantity: m.totalQuantity,
        totalSales: m.totalSales,
      })),
      hourlyBreakdown: hourlyStats.map((h) => ({
        hour: h.hour,
        orderCount: h.count,
        totalSales: h.total,
      })),
    });
  }),
);

export const salesController = router;
