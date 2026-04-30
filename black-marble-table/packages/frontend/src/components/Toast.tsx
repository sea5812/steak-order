import { useEffect } from 'react';
import type { ToastMessage } from '../types';
import styles from './Toast.module.css';

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className={styles.container} aria-live="polite">
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, message.duration || 3000);
    return () => clearTimeout(timer);
  }, [message.id, message.duration, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[message.type]}`} data-testid={`toast-${message.type}`}>
      <span className={styles.message}>{message.message}</span>
      <button
        className={styles.closeBtn}
        onClick={() => onDismiss(message.id)}
        aria-label="닫기"
        data-testid="toast-close"
      >
        ✕
      </button>
    </div>
  );
}
