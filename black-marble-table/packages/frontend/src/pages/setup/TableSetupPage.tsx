import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableAuth } from '../../hooks/useTableAuth';
import styles from './TableSetupPage.module.css';

export default function TableSetupPage() {
  const { setup, isAuthenticated } = useTableAuth();
  const navigate = useNavigate();

  const [storeId, setStoreId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !tableNumber || !password) return;

    setError(null);
    setIsLoading(true);

    try {
      await setup({ storeId, tableNumber: Number(tableNumber), password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.brand}>Black Marble Table</h1>
        <p className={styles.subtitle}>태블릿 초기 설정</p>

        <form className={styles.form} onSubmit={handleSubmit} data-testid="table-setup-form">
          {error && <div className={styles.error} data-testid="setup-error">{error}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="setupStoreId">매장 식별자</label>
            <input id="setupStoreId" className={styles.input} type="text" value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="예: black-marble" required data-testid="setup-store-id" />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="setupTableNumber">테이블 번호</label>
            <input id="setupTableNumber" className={styles.input} type="number" min="1" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="예: 1" required data-testid="setup-table-number" />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="setupPassword">비밀번호</label>
            <input id="setupPassword" className={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required data-testid="setup-password" />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isLoading || !storeId || !tableNumber || !password} data-testid="setup-submit">
            {isLoading ? '설정 중...' : '설정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
}
