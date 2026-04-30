import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !username || !password) return;
    setError(null);
    setIsLoading(true);
    try {
      await login({ storeId, username, password });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.brand}>Black Marble Table</h1>
        <p className={styles.subtitle}>관리자 로그인</p>
        <form className={styles.form} onSubmit={handleSubmit} data-testid="admin-login-form">
          {error && <div className={styles.error} data-testid="login-error">{error}</div>}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="storeId">매장 식별자</label>
            <input id="storeId" className={styles.input} type="text" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="예: black-marble" required data-testid="login-store-id" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">사용자명</label>
            <input id="username" className={styles.input} type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="사용자명" required data-testid="login-username" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">비밀번호</label>
            <input id="password" className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required data-testid="login-password" />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isLoading || !storeId || !username || !password} data-testid="login-submit">
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
