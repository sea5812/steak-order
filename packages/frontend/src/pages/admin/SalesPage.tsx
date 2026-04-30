import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api-client';
import dashStyles from './DashboardPage.module.css';
import styles from './SalesPage.module.css';

interface SalesData {
  date: string;
  orders: { count: number; totalSales: number };
  completedHistory: { count: number; totalSales: number };
  statusBreakdown: Array<{ status: string; count: number }>;
  menuRanking: Array<{ menuName: string; totalQuantity: number; totalSales: number }>;
  hourlyBreakdown: Array<{ hour: string; orderCount: number; totalSales: number }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  preparing: '준비중',
  completed: '완료',
};

export default function AdminSalesPage() {
  const { storeId, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    setIsLoading(true);
    apiClient
      .get<SalesData>(`/stores/${storeId}/sales/summary?date=${date}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, [storeId, date]);

  const totalRevenue = (data?.orders.totalSales ?? 0) + (data?.completedHistory.totalSales ?? 0);
  const totalOrderCount = (data?.orders.count ?? 0) + (data?.completedHistory.count ?? 0);
  const maxHourly = data?.hourlyBreakdown.reduce((max, h) => Math.max(max, h.totalSales), 0) ?? 1;

  return (
    <div className={styles.page}>
      {/* Nav Bar */}
      <nav className={dashStyles.navbar}>
        <span className={dashStyles.navBrand}>Black Marble Table</span>
        <Link to="/admin/dashboard" className={dashStyles.navLink}>대시보드</Link>
        <Link to="/admin/menus" className={dashStyles.navLink}>메뉴 관리</Link>
        <Link to="/admin/tables" className={dashStyles.navLink}>테이블 관리</Link>
        <Link to="/admin/sales" className={`${dashStyles.navLink} ${location.pathname === '/admin/sales' ? dashStyles.navActive : ''}`}>매출</Link>
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
          <h2 className={styles.title}>매출 현황</h2>
          <input type="date" className={styles.dateInput} value={date} onChange={(e) => setDate(e.target.value)} data-testid="sales-date" />
        </div>

        {isLoading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : !data ? (
          <div className={styles.empty}>데이터를 불러올 수 없습니다.</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>총 매출</div>
                <div className={styles.summaryValue}>₩{totalRevenue.toLocaleString()}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>총 주문 수</div>
                <div className={styles.summarySubValue}>{totalOrderCount}건</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>현재 진행 주문</div>
                <div className={styles.summarySubValue}>{data.orders.count}건</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>평균 주문 금액</div>
                <div className={styles.summarySubValue}>₩{totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount).toLocaleString() : 0}</div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>주문 상태</h3>
              <div className={styles.statusGrid}>
                {['pending', 'preparing', 'completed'].map((status) => {
                  const stat = data.statusBreakdown.find((s) => s.status === status);
                  return (
                    <div key={status} className={styles.statusCard}>
                      <div className={styles.statusName}>{STATUS_LABELS[status]}</div>
                      <div className={`${styles.statusCount} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1)}` as keyof typeof styles]}`}>
                        {stat?.count ?? 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Chart */}
            {data.hourlyBreakdown.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>시간대별 매출</h3>
                <div className={styles.hourlyGrid}>
                  {data.hourlyBreakdown.map((h) => (
                    <div key={h.hour} className={styles.hourlyBar}>
                      <div className={styles.barValue}>₩{(h.totalSales / 1000).toFixed(0)}K</div>
                      <div
                        className={`${styles.bar} ${h.totalSales > 0 ? styles.barActive : ''}`}
                        style={{ height: `${maxHourly > 0 ? (h.totalSales / maxHourly) * 120 : 2}px` }}
                      />
                      <div className={styles.hourLabel}>{h.hour}시</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Ranking */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>메뉴별 판매 순위</h3>
              {data.menuRanking.length > 0 ? (
                <table className={styles.rankTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>메뉴명</th>
                      <th style={{ textAlign: 'center' }}>판매 수량</th>
                      <th style={{ textAlign: 'right' }}>매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.menuRanking.map((menu, idx) => (
                      <tr key={menu.menuName}>
                        <td className={styles.rankNumber}>{idx + 1}</td>
                        <td className={styles.rankName}>{menu.menuName}</td>
                        <td className={styles.rankQty}>{menu.totalQuantity}개</td>
                        <td className={styles.rankSales}>₩{menu.totalSales.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.empty}>판매 데이터가 없습니다.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
