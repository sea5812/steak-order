import styles from './QuantityControl.module.css';

interface QuantityControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export default function QuantityControl({ value, min = 1, max = 99, onChange }: QuantityControlProps) {
  return (
    <div className={styles.control}>
      <button
        className={styles.btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="수량 감소"
        data-testid="quantity-decrease"
      >
        −
      </button>
      <span className={styles.value} data-testid="quantity-value">{value}</span>
      <button
        className={styles.btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="수량 증가"
        data-testid="quantity-increase"
      >
        +
      </button>
    </div>
  );
}
