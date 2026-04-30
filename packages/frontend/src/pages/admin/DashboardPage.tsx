import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSSE } from '../../hooks/useSSE';
import { orderApi } from '../../services/order.api';
import { tableApi } from '../../services/table.api';
import TableCard from '../../components/TableCard';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import type { Table, Order, OrderHistory, ToastMessage, OrderStatus } from '../../types';
import styles from './DashboardPage.module.css';

export default function AdminDashboardPage() {
  const { storeId, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTableId, setFilterTableId] = useState<number | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [highlightedTables, setHighlightedTables] = useState<Set<number>>(new Set());
  const [showDropdown, setShowDropdown] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: number; tableId?: number } | null>(null);

  // History modal
  const [historyTableId, setHistoryTableId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<OrderHistory[]>([]);
  const [historyDate, setHistoryDate] = useState('');

  useEffect(() => {
    if (!storeId) return;
    setIsLoading(true);
    Promise.all([tableApi.getTables(storeId), orderApi.getOrdersByStore(storeId)])
      .then(([t, o]) => { setTables(t); setOrders(o); })
      .catch(() => addToast('error', '데이터를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, [storeId]);

  const handleSSEEvent = useCallback((event: { type: string; data: unknown }) => {
    const data = event.data as Order & { orderId?: number; tableId?: number };
    switch (event.type) {
      case 'order:new':
        setOrders((prev) => [data as Order, ...prev]);
        setHighlightedTables((prev) => new Set(prev).add((data as Order).tableId));
        setTimeout(() => {
          setHighlightedTables((prev) => { const n = new Set(prev); n.delete((data as Order).tableId); return n; });
        }, 2000);
        break;
      case 'order:updated':
        setOrders((prev) => prev.map((o) => o.id === (data as Order).id ? (data as Order) : o));
        break;
      case 'order:deleted':
        setOrders((prev) => prev.filter((o) => o.id !== data.orderId));
        break;
      case 'table:completed':
        setOrders((prev) => prev.filter((o) => o.tableId !== data.tableId));
        break;
    }
  }, []);

  const { isConnected } = useSSE({
    url: storeId ? `/api/stores/${storeId}/sse/admin` : '',
    onEvent: handleSSEEvent,
    enabled: !!storeId,
  });

  function addToast(type: ToastMessage['type'], message: string) {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  }

  function getTableOrders(tableId: number) {
    return orders.filter((o) => o.tableId === tableId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function getTableTotal(tableId: number) {
    return getTableOrders(tableId).reduce((sum, o) => sum + o.totalAmount, 0);
  }

  const displayTables = filterTableId ? tables.filter((t) => t.id === filterTableId) : tables;

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    if (!storeId) return;
    try {
      const updated = await orderApi.updateOrderStatus(storeId, orderId, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? updated : o));
      addToast('success', '주문 상태가 변경되었습니다.');
    } catch { addToast('error', '상태 변경에 실패했습니다.'); }
  }

  async function handleDeleteOrder(orderId: number) {
    if (!storeId) return;
    try {
      await orderApi.deleteOrder(storeId, orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      addToast('success', '주문이 삭제되었습니다.');
    } catch { addToast('error', '주문 삭제에 실패했습니다.'); }
    setConfirmAction(null);
  }

  async function handleCompleteTable(tableId: number) {
    if (!storeId) return;
    try {
      await tableApi.completeTable(storeId, tableId);
      setOrders((prev) => prev.filter((o) => o.tableId !== tableId));
      addToast('success', '이용 완료 처리되었습니다.');
      setSelectedTableId(null);
    } catch { addToast('error', '이용 완료 처리에 실패했습니다.'); }
    setConfirmAction(null);
  }

  async function loadHistory(tableId: number) {
    if (!storeId) return;
    setHistoryTableId(tableId);
    try {
      const data = await tableApi.getTableHistory(storeId, tableId, historyDate || undefined);
      setHistoryData(data);
    } catch { addToast('error', '과거 내역을 불러오는데 실패했습니다.'); }
  }

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedOrders = selectedTableId ? getTableOrders(selectedTableId) : [];

  return (
    <div className={styles.page}>
      {/* Nav Bar */}
      <nav className={styles.navbar}>
        <span className={styles.navBrand}>Black Marble Table</span>
        <Link to="/admin/dashboard" className={`${styles.navLink} ${location.pathname === '/admin/dashboard' ? styles.navActive : ''}`}>대시보드</Link>
        <Link to="/admin/menus" className={`${styles.navLink} ${location.pathname === '/admin/menus' ? styles.navActive : ''}`}>메뉴 관리</Link>
        <Link to="/admin/tables" className={`${styles.navLink} ${location.pathname === '/admin/tables' ? styles.navActive : ''}`}>테이블 관리</Link>
        <div className={styles.navSpacer} />
        <span className={`${styles.sseStatus} ${isConnected ? styles.sseConnected : styles.sseDisconnected}`}>
          {isConnected ? '● 연결됨' : '○ 연결 끊김'}
        </span>
        <div className={styles.navDropdown}>
          <button className={styles.navDropdownBtn} onClick={() => setShowDropdown(!showDropdown)}>▼ 더보기</button>
          {showDropdown && (
            <div className={styles.navDropdownMenu} onMouseLeave={() => setShowDropdown(false)}>
              <Link to="/admin/accounts" className={styles.navDropdownItem} onClick={() => setShowDropdown(false)}>계정 관리</Link>
              <button className={`${styles.navDropdownItem} ${styles.logoutItem}`} onClick={() => { logout(); navigate('/admin/login'); }}>로그아웃</button>
            </div>
          )}
        </div>
      </nav>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>테이블:</span>
          <select className={styles.filterSelect} value={filterTableId ?? ''} onChange={(e) => setFilterTableId(e.target.value ? Number(e.target.value) : null)} data-testid="table-filter">
            <option value="">전체</option>
            {tables.map((t) => <option key={t.id} value={t.id}>테이블 {t.tableNumber}</option>)}
          </select>
        </div>
        <div className={styles.viewToggle}>
          <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')} data-testid="view-grid">▦</button>
          <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')} data-testid="view-list">☰</button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.loading}>불러오는 중...</div>
      ) : displayTables.length === 0 ? (
        <div className={styles.empty}>테이블이 없습니다.</div>
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {displayTables.map((t) => (
            <TableCard key={t.id} table={t} orders={getTableOrders(t.id)} totalAmount={getTableTotal(t.id)} isHighlighted={highlightedTables.has(t.id)} onClick={setSelectedTableId} />
          ))}
        </div>
      ) : (
        <table className={styles.listTable}>
          <thead><tr><th>테이블</th><th>총 주문액</th><th>주문 수</th><th>상태</th></tr></thead>
          <tbody>
            {displayTables.map((t) => {
              const tOrders = getTableOrders(t.id);
              return (
                <tr key={t.id} className={styles.listRow} onClick={() => setSelectedTableId(t.id)}>
                  <td>테이블 {t.tableNumber}</td>
                  <td>₩{getTableTotal(t.id).toLocaleString()}</td>
                  <td>{tOrders.length}건</td>
                  <td>{tOrders.length > 0 ? '이용중' : '비어있음'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Table Detail Modal */}
      {selectedTable && (
        <div className={styles.detailOverlay} onClick={() => setSelectedTableId(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailTitle}>테이블 {selectedTable.tableNumber}</h2>
                <span className={styles.detailTotal}>총 ₩{getTableTotal(selectedTable.id).toLocaleString()}</span>
              </div>
              <button className={styles.detailCloseBtn} onClick={() => setSelectedTableId(null)}>✕</button>
            </div>
            <div className={styles.detailOrders}>
              {selectedOrders.length > 0 ? selectedOrders.map((order) => (
                <div key={order.id} className={styles.detailOrderCard}>
                  <div className={styles.detailOrderHeader}>
                    <span className={styles.detailOrderId}>주문 #{order.id} · {new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className={styles.detailOrderItems}>
                    {order.items.map((item) => (
                      <div key={item.id} className={styles.detailOrderItem}>
                        <span>{item.menuName} ×{item.quantity}</span>
                        <span>₩{item.subtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.detailOrderActions}>
                    {order.status === 'pending' && <button className={`${styles.statusBtn} ${styles.statusBtnPreparing}`} onClick={() => handleStatusChange(order.id, 'preparing')}>준비중으로</button>}
                    {order.status === 'preparing' && <button className={`${styles.statusBtn} ${styles.statusBtnCompleted}`} onClick={() => handleStatusChange(order.id, 'completed')}>완료로</button>}
                    <button className={styles.deleteOrderBtn} onClick={() => setConfirmAction({ type: 'deleteOrder', id: order.id, tableId: selectedTable.id })}>삭제</button>
                  </div>
                </div>
              )) : <div className={styles.empty}>주문이 없습니다.</div>}
            </div>
            <div className={styles.detailFooter}>
              <button className={styles.completeBtn} onClick={() => setConfirmAction({ type: 'completeTable', id: selectedTable.id })} data-testid="complete-table-btn">이용 완료</button>
              <button className={styles.historyBtn} onClick={() => loadHistory(selectedTable.id)} data-testid="history-btn">과거 내역</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyTableId !== null && (
        <div className={styles.historyOverlay} onClick={() => setHistoryTableId(null)}>
          <div className={styles.historyModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>과거 주문 내역</h3>
              <input type="date" className={styles.historyFilter} value={historyDate} onChange={(e) => { setHistoryDate(e.target.value); if (storeId) loadHistory(historyTableId); }} />
            </div>
            <div className={styles.historyList}>
              {historyData.length > 0 ? historyData.map((h) => (
                <div key={h.id} className={styles.historyCard}>
                  <div className={styles.historyCardHeader}>
                    <span>주문 #{h.orderId}</span>
                    <span>{new Date(h.orderedAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className={styles.historyCardItems}>
                    {h.items.map((item) => `${item.menuName} ×${item.quantity}`).join(', ')}
                  </div>
                  <div className={styles.historyCardFooter}>
                    <span>완료: {new Date(h.completedAt).toLocaleString('ko-KR')}</span>
                    <span className={styles.historyAmount}>₩{h.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )) : <div className={styles.empty}>과거 내역이 없습니다.</div>}
            </div>
            <button className={styles.historyCloseBtn} onClick={() => setHistoryTableId(null)}>닫기</button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.type === 'deleteOrder' ? '주문 삭제' : '이용 완료'}
        message={confirmAction?.type === 'deleteOrder' ? '이 주문을 삭제하시겠습니까?' : '테이블 이용 완료 처리하시겠습니까? 현재 주문이 모두 과거 내역으로 이동됩니다.'}
        confirmText={confirmAction?.type === 'deleteOrder' ? '삭제' : '이용 완료'}
        variant={confirmAction?.type === 'deleteOrder' ? 'danger' : 'default'}
        onConfirm={() => {
          if (confirmAction?.type === 'deleteOrder') handleDeleteOrder(confirmAction.id);
          else if (confirmAction?.type === 'completeTable') handleCompleteTable(confirmAction.id);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <Toast messages={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
