import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel} data-testid="confirm-dialog-overlay">
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h3 id="confirm-dialog-title" className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.cancelBtn}`}
            onClick={onCancel}
            data-testid="confirm-dialog-cancel"
          >
            {cancelText}
          </button>
          <button
            className={`${styles.btn} ${variant === 'danger' ? styles.dangerBtn : styles.confirmBtn}`}
            onClick={onConfirm}
            data-testid="confirm-dialog-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
