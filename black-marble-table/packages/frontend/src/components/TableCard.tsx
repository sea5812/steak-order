import type { Table, Order } from '../types';
import styles from './TableCard.module.css';

interface TableCardProps {
  table: Table;
  orders: Order[];
  totalAmount: number;
  isHighlighted?: boolean;
  onClick: (tableId: number) => void;
}

export default function TableCard({ table, orders, totalAmount, isHighlighted, onClick }: TableCardProps) {
  const recentOrders = orders.slice(0, 3);

  return (
    <div
      className={`${styles.card} ${isHighlighted ? styles.highlighted : ''}`}
      onClick={() => onClick(table.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(table.id); }}
      data-testid={`table-card-${table.tableNumber}`}
    >
      <div className={styles.header}>
        <span className={styles.tableNumber}>테이블 {table.tableNumber}</span>
        <span className={styles.totalAmount}>₩{totalAmount.toLocaleString()}</span>
      </div>
      <div className={styles.preview}>
        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <div key={order.id} className={styles.previewItem}>
              {order.items.map((item) => `${item.menuName} ×${item.quantity}`).join(', ')}
            </div>
          ))
        ) : (
          <span className={styles.empty}>주문 없음</span>
        )}
      </div>
    </div>
  );
}
