import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/admin.api';
import Toast from '../../components/Toast';
import type { AdminAccount, ToastMessage } from '../../types';
import dashStyles from './DashboardPage.module.css';
import styles from './AccountPage.module.css';

export default function AdminAccountPage() {
  const { logout, storeId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    if (!storeId) return;
    setIsLoading(true);
    try {
      setAccounts(await adminApi.getAccounts(storeId));
    } catch { addToast('error', '계정 목록을 불러오는데 실패했습니다.'); }
    finally { setIsLoading(false); }
  }

  function addToast(type: ToastMessage['type'], message: string) {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formUsername.trim() || !formPassword) return;
    setFormError(null);
    setIsSaving(true);
    try {
      await adminApi.createAccount(storeId!, { username: formUsername.trim(), password: formPassword });
      addToast('success', '계정이 생성되었습니다.');
      setFormOpen(false);
      setFormUsername(''); setFormPassword('');
      loadAccounts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '계정 생성에 실패했습니다.');
    } finally { setIsSaving(false); }
  }

  return (
    <div className={styles.page}>
      <nav className={dashStyles.navbar}>
        <span className={dashStyles.navBrand}>Black Marble Table</span>
        <Link to="/admin/dashboard" className={dashStyles.navLink}>대시보드</Link>
        <Link to="/admin/menus" className={dashStyles.navLink}>메뉴 관리</Link>
        <Link to="/admin/tables" className={dashStyles.navLink}>테이블 관리</Link>
        <Link to="/admin/sales" className={dashStyles.navLink}>매출</Link>
        <div className={dashStyles.navSpacer} />
        <div className={dashStyles.navDropdown}>
          <button className={dashStyles.navDropdownBtn} onClick={() => setShowDropdown(!showDropdown)}>▼ 더보기</button>
          {showDropdown && (
            <div className={dashStyles.navDropdownMenu} onMouseLeave={() => setShowDropdown(false)}>
              <Link to="/admin/accounts" className={`${dashStyles.navDropdownItem} ${location.pathname === '/admin/accounts' ? dashStyles.navActive : ''}`} onClick={() => setShowDropdown(false)}>계정 관리</Link>
              <button className={`${dashStyles.navDropdownItem} ${dashStyles.logoutItem}`} onClick={() => { logout(); navigate('/admin/login'); }}>로그아웃</button>
            </div>
          )}
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <h2 className={styles.title}>계정 관리</h2>
          <button className={styles.addBtn} onClick={() => { setFormOpen(true); setFormError(null); }} data-testid="account-add-btn">+ 계정 추가</button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : accounts.length > 0 ? (
          <div className={styles.accountList}>
            {accounts.map((acc) => (
              <div key={acc.id} className={styles.accountRow} data-testid={`account-${acc.username}`}>
                <span className={styles.accountName}>{acc.username}</span>
                <span className={styles.accountDate}>{new Date(acc.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>등록된 계정이 없습니다.</div>
        )}
      </div>

      {formOpen && (
        <div className={styles.formOverlay} onClick={() => setFormOpen(false)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.formTitle}>계정 추가</h3>
            <form className={styles.form} onSubmit={handleCreate}>
              {formError && <div className={styles.error}>{formError}</div>}
              <div className={styles.field}>
                <label className={styles.label}>사용자명</label>
                <input className={styles.input} value={formUsername} onChange={(e) => setFormUsername(e.target.value)} required data-testid="account-form-username" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>비밀번호</label>
                <input className={styles.input} type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} required data-testid="account-form-password" />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setFormOpen(false)}>취소</button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving} data-testid="account-form-save">{isSaving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast messages={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
