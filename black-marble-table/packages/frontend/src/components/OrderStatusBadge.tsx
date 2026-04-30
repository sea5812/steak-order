import type { OrderStatus } from '../types';
import styles from './OrderStatusBadge.module.css';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '대기중',
  preparing: '준비중',
  completed: '완료',
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[status]}`}
      data-testid={`status-badge-${status}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
