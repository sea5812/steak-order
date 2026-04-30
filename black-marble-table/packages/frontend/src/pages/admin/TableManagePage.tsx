import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { tableApi } from '../../services/table.api';
import { orderApi } from '../../services/order.api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import type { Table, Order, OrderHistory, ToastMessage } from '../../types';
import dashStyles from './DashboardPage.module.css';
import styles from './TableManagePage.module.css';

export default function AdminTableManagePage() {
  const { storeId, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [tables, setTables] = useState<Table[]>([]);
  const [tableOrders, setTableOrders] = useState<Record<number, Order[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formTableNumber, setFormTableNumber] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState<{ type: string; id: number } | null>(null);

  // History
  const [historyTableId, setHistoryTableId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<OrderHistory[]>([]);

  useEffect(() => {
    if (!storeId) return;
    loadData();
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const [t, o] = await Promise.all([tableApi.getTables(storeId), orderApi.getOrdersByStore(storeId)]);
      setTables(t);
      const grouped: Record<number, Order[]> = {};
      o.forEach((order) => {
        if (!grouped[order.tableId]) grouped[order.tableId] = [];
        grouped[order.tableId]!.push(order);
      });
      setTableOrders(grouped);
    } catch { addToast('error', '데이터를 불러오는데 실패했습니다.'); }
    finally { setIsLoading(false); }
  }

  function addToast(type: ToastMessage['type'], message: string) {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  }

  async function handleCreateTable(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !formTableNumber || !formPassword) return;
    setIsSaving(true);
    try {
      await tableApi.createTable(storeId, { tableNumber: Number(formTableNumber), password: formPassword });
      addToast('success', '테이블이 추가되었습니다.');
      setFormOpen(false);
      setFormTableNumber(''); setFormPassword('');
      loadData();
    } catch (err) { addToast('error', err instanceof Error ? err.message : '테이블 추가에 실패했습니다.'); }
    finally { setIsSaving(false); }
  }

  async function handleCompleteTable(tableId: number) {
    if (!storeId) return;
    try {
      await tableApi.completeTable(storeId, tableId);
      addToast('success', '이용 완료 처리되었습니다.');
      loadData();
    } catch { addToast('error', '이용 완료 처리에 실패했습니다.'); }
    setConfirmAction(null);
  }

  async function handleDeleteOrder(orderId: number) {
    if (!storeId) return;
    try {
      await orderApi.deleteOrder(storeId, orderId);
      addToast('success', '주문이 삭제되었습니다.');
      loadData();
    } catch { addToast('error', '주문 삭제에 실패했습니다.'); }
    setConfirmAction(null);
  }

  async function loadHistory(tableId: number) {
    if (!storeId) return;
    setHistoryTableId(tableId);
    try {
      setHistoryData(await tableApi.getTableHistory(storeId, tableId));
    } catch { addToast('error', '과거 내역을 불러오는데 실패했습니다.'); }
  }

  function getTableTotal(tableId: number) {
    return (tableOrders[tableId] || []).reduce((sum, o) => sum + o.totalAmount, 0);
  }

  return (
    <div className={styles.page}>
      <nav className={dashStyles.navbar}>
        <span className={dashStyles.navBrand}>Black Marble Table</span>
        <Link to="/admin/dashboard" className={dashStyles.navLink}>대시보드</Link>
        <Link to="/admin/menus" className={dashStyles.navLink}>메뉴 관리</Link>
        <Link to="/admin/tables" className={`${dashStyles.navLink} ${location.pathname === '/admin/tables' ? dashStyles.navActive : ''}`}>테이블 관리</Link>
        <div className={dashStyles.navSpacer} />
        <div className={dashStyles.navDropdown}>
          <button className={dashStyles.navDropdownBtn} onClick={() => setShowDropdown(!showDropdown)}>▼ 더보기</button>
          {showDropdown && (
            <div className={dashStyles.navDropdownMenu} onMouseLeave={() => setShowDropdown(false)}>
              <Link to="/admin/accounts" className={dashStyles.navDropdownItem} onClick={() => setShowDropdown(false)}>계정 관리</Link>
              <button className={`${dashStyles.navDropdownItem} ${dashStyles.logoutItem}`} onClick={() => { logout(); navigate('/admin/login'); }}>로그아웃</button>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <span />
          <button className={styles.addBtn} onClick={() => setFormOpen(true)} data-testid="table-add-btn">+ 테이블 추가</button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : tables.length > 0 ? (
          <div className={styles.tableList}>
            {tables.map((table) => {
              const orders = tableOrders[table.id] || [];
              return (
                <div key={table.id} className={styles.tableRow}>
                  <div className={styles.tableRowHeader}>
                    <span className={styles.tableNumber}>테이블 {table.tableNumber}</span>
                    <span className={styles.tableTotal}>₩{getTableTotal(table.id).toLocaleString()}</span>
                  </div>
                  <div className={styles.tableActions}>
                    <button className={`${styles.actionBtn} ${styles.completeBtn}`} onClick={() => setConfirmAction({ type: 'complete', id: table.id })} data-testid={`table-complete-${table.tableNumber}`}>이용 완료</button>
                    <button className={`${styles.actionBtn} ${styles.historyBtn}`} onClick={() => loadHistory(table.id)} data-testid={`table-history-${table.tableNumber}`}>과거 내역</button>
                  </div>
                  {orders.length > 0 && (
                    <div className={styles.tableOrders}>
                      {orders.map((order) => (
                        <div key={order.id} className={styles.orderRow}>
                          <span className={styles.orderInfo}>#{order.id} · {order.items.map((i) => `${i.menuName}×${i.quantity}`).join(', ')}</span>
                          <OrderStatusBadge status={order.status} />
                          <span className={styles.orderAmount}>₩{order.totalAmount.toLocaleString()}</span>
                          <button className={styles.deleteOrderBtn} onClick={() => setConfirmAction({ type: 'deleteOrder', id: order.id })}>삭제</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.empty}>테이블이 없습니다.</div>
        )}
      </div>

      {/* Create Table Form */}
      {formOpen && (
        <div className={styles.formOverlay} onClick={() => setFormOpen(false)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.formTitle}>테이블 추가</h3>
            <form className={styles.form} onSubmit={handleCreateTable}>
              <div className={styles.field}>
                <label className={styles.label}>테이블 번호</label>
                <input className={styles.input} type="number" min="1" value={formTableNumber} onChange={(e) => setFormTableNumber(e.target.value)} required data-testid="table-form-number" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>비밀번호</label>
                <input className={styles.input} type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required data-testid="table-form-password" />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setFormOpen(false)}>취소</button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving} data-testid="table-form-save">{isSaving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyTableId !== null && (
        <div className={dashStyles.historyOverlay} onClick={() => setHistoryTableId(null)}>
          <div className={dashStyles.historyModal} onClick={(e) => e.stopPropagation()}>
            <div className={dashStyles.historyHeader}>
              <h3 className={dashStyles.historyTitle}>과거 주문 내역</h3>
            </div>
            <div className={dashStyles.historyList}>
              {historyData.length > 0 ? historyData.map((h) => (
                <div key={h.id} className={dashStyles.historyCard}>
                  <div className={dashStyles.historyCardHeader}>
                    <span>주문 #{h.orderId}</span>
                    <span>{new Date(h.orderedAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className={dashStyles.historyCardItems}>
                    {h.items.map((item) => `${item.menuName} ×${item.quantity}`).join(', ')}
                  </div>
                  <div className={dashStyles.historyCardFooter}>
                    <span>완료: {new Date(h.completedAt).toLocaleString('ko-KR')}</span>
                    <span className={dashStyles.historyAmount}>₩{h.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )) : <div className={styles.empty}>과거 내역이 없습니다.</div>}
            </div>
            <button className={dashStyles.historyCloseBtn} onClick={() => setHistoryTableId(null)}>닫기</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.type === 'deleteOrder' ? '주문 삭제' : '이용 완료'}
        message={confirmAction?.type === 'deleteOrder' ? '이 주문을 삭제하시겠습니까?' : '테이블 이용 완료 처리하시겠습니까?'}
        confirmText={confirmAction?.type === 'deleteOrder' ? '삭제' : '이용 완료'}
        variant={confirmAction?.type === 'deleteOrder' ? 'danger' : 'default'}
        onConfirm={() => {
          if (confirmAction?.type === 'deleteOrder') handleDeleteOrder(confirmAction.id);
          else if (confirmAction?.type === 'complete') handleCompleteTable(confirmAction.id);
        }}
        onCancel={() => setConfirmAction(null)}
      />
      <Toast messages={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
