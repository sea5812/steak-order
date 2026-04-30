import type { OrderListItem } from '../types';
import QuantityControl from './QuantityControl';
import styles from './OrderItemRow.module.css';

interface OrderItemRowProps {
  item: OrderListItem;
  onQuantityChange: (menuId: number, quantity: number) => void;
  onRemove: (menuId: number) => void;
}

export default function OrderItemRow({ item, onQuantityChange, onRemove }: OrderItemRowProps) {
  const subtotal = item.price * item.quantity;

  return (
    <div className={styles.row} data-testid={`order-item-${item.menuId}`}>
      <div className={styles.info}>
        <div className={styles.name}>{item.menuName}</div>
        <div className={styles.price}>₩{item.price.toLocaleString()}</div>
      </div>
      <QuantityControl
        value={item.quantity}
        onChange={(qty) => onQuantityChange(item.menuId, qty)}
      />
      <span className={styles.subtotal}>₩{subtotal.toLocaleString()}</span>
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(item.menuId)}
        aria-label={`${item.menuName} 삭제`}
        data-testid={`order-item-remove-${item.menuId}`}
      >
        ✕
      </button>
    </div>
  );
}
