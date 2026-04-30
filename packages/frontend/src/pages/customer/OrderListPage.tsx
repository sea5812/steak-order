import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTableAuth } from '../../hooks/useTableAuth';
import { useOrderList } from '../../hooks/useOrderList';
import { orderApi } from '../../services/order.api';
import OrderItemRow from '../../components/OrderItemRow';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import type { ToastMessage } from '../../types';
import styles from './OrderListPage.module.css';

export default function CustomerOrderListPage() {
  const { storeId, tableId, sessionId } = useTableAuth();
  const { items, updateQuantity, removeItem, clearAll, totalPrice, totalItems } = useOrderList();
  const navigate = useNavigate();
  const location = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function addToast(type: ToastMessage['type'], message: string) {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSubmitOrder() {
    if (!storeId || !tableId || items.length === 0) return;

    setShowConfirm(false);
    setIsSubmitting(true);

    try {
      const response = await orderApi.createOrder(storeId, {
        tableId,
        sessionId: sessionId || '',
        items: items.map((i) => ({ menuId: i.menuId, quantity: i.quantity })),
      });
      clearAll();
      setSuccessOrderId(response.order.id);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : '주문에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Success View
  if (successOrderId !== null) {
    return (
      <div className={styles.successView}>
        <div className={styles.successIcon}>✓</div>
        <h2 className={styles.successTitle}>주문이 접수되었습니다</h2>
        <p className={styles.successMessage}>
          잠시 후 서빙해 드리겠습니다.
        </p>
        <p className={styles.successOrderId}>주문 번호: #{successOrderId}</p>
        <button
          className={styles.successBtn}
          onClick={() => navigate('/')}
          data-testid="order-success-confirm"
        >
          확인
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>주문 목록</h1>
        {items.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={clearAll}
            data-testid="order-list-clear"
          >
            전체 비우기
          </button>
        )}
      </header>

      {items.length > 0 ? (
        <>
          <div className={styles.list}>
            {items.map((item) => (
              <OrderItemRow
                key={item.menuId}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>총 금액</span>
              <span className={styles.totalAmount}>₩{totalPrice.toLocaleString()}</span>
            </div>
            <button
              className={styles.orderBtn}
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              data-testid="order-submit-btn"
            >
              {isSubmitting ? '주문 중...' : `주문하기 (${totalItems}개)`}
            </button>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <p className={styles.emptyText}>주문 목록이 비어있습니다</p>
          <p className={styles.emptyHint}>메뉴에서 원하는 항목을 추가해주세요</p>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="주문 확정"
        message={`총 ${totalItems}개 항목, ₩${totalPrice.toLocaleString()}을 주문하시겠습니까?`}
        confirmText="주문하기"
        onConfirm={handleSubmitOrder}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Bottom Tab Bar */}
      <nav className={styles.bottomBar} aria-label="메인 네비게이션">
        <Link to="/" className={styles.tab} data-testid="tab-menu">
          <span className={styles.tabIcon}>🍽</span>
          <span>메뉴</span>
        </Link>
        <Link
          to="/order-list"
          className={`${styles.tab} ${location.pathname === '/order-list' ? styles.tabActive : ''}`}
          data-testid="tab-order-list"
        >
          <span className={styles.tabIcon}>📋</span>
          <span>주문 목록</span>
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>
        <Link to="/orders" className={styles.tab} data-testid="tab-orders">
          <span className={styles.tabIcon}>📜</span>
          <span>주문 내역</span>
        </Link>
      </nav>

      <Toast messages={toasts} onDismiss={dismissToast} />
    </div>
  );
}
