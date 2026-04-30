import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTableAuth } from '../../hooks/useTableAuth';
import { useOrderList } from '../../hooks/useOrderList';
import { useSSE } from '../../hooks/useSSE';
import { orderApi } from '../../services/order.api';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import type { Order } from '../../types';
import styles from './OrderHistoryPage.module.css';

export default function CustomerOrderHistoryPage() {
  const { storeId, tableId } = useTableAuth();
  const { totalItems } = useOrderList();
  const location = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId || !tableId) return;
    setIsLoading(true);
    orderApi
      .getOrdersByTable(storeId, tableId)
      .then((data) => {
        setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      })
      .catch(() => setError('주문 내역을 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, [storeId, tableId]);

  const handleSSEEvent = useCallback((event: { type: string; data: unknown }) => {
    if (event.type === 'order:statusChanged') {
      const updated = event.data as Order;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
    }
  }, []);

  useSSE({
    url: storeId && tableId ? `/api/stores/${storeId}/sse/table/${tableId}` : '',
    onEvent: handleSSEEvent,
    enabled: !!storeId && !!tableId,
  });

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>주문 내역</h1>
      </header>

      {isLoading ? (
        <div className={styles.loading}>불러오는 중...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : orders.length > 0 ? (
        <div className={styles.list}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard} data-testid={`order-history-${order.id}`}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderId}>주문 #{order.id}</span>
                  <span className={styles.orderTime}>{formatTime(order.createdAt)}</span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className={styles.orderItems}>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <span className={styles.itemName}>{item.menuName}</span>
                    <span className={styles.itemDetail}>×{item.quantity} ₩{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <span className={styles.orderTotal}>₩{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>주문 내역이 없습니다.</div>
      )}

      <nav className={styles.bottomBar} aria-label="메인 네비게이션">
        <Link to="/" className={styles.tab} data-testid="tab-menu">
          <span className={styles.tabIcon}>🍽</span><span>메뉴</span>
        </Link>
        <Link to="/order-list" className={styles.tab} data-testid="tab-order-list">
          <span className={styles.tabIcon}>📋</span><span>주문 목록</span>
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>
        <Link to="/orders" className={`${styles.tab} ${location.pathname === '/orders' ? styles.tabActive : ''}`} data-testid="tab-orders">
          <span className={styles.tabIcon}>📜</span><span>주문 내역</span>
        </Link>
      </nav>
    </div>
  );
}
