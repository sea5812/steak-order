import type { MenuItem } from '../types';
import styles from './MenuCard.module.css';

interface MenuCardProps {
  menu: MenuItem;
  onClick?: (menu: MenuItem) => void;
  showActions?: boolean;
  onEdit?: (menu: MenuItem) => void;
  onDelete?: (menuId: number) => void;
}

export default function MenuCard({ menu, onClick, showActions, onEdit, onDelete }: MenuCardProps) {
  const formattedPrice = `₩${menu.price.toLocaleString()}`;

  return (
    <div
      className={styles.card}
      onClick={() => onClick?.(menu)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(menu); }}
      data-testid={`menu-card-${menu.id}`}
    >
      {menu.imageUrl && (
        <div className={styles.imageWrapper}>
          <img
            src={menu.imageUrl}
            alt={menu.name}
            className={styles.image}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}
      <span className={styles.name}>{menu.name}</span>
      <span className={styles.price}>{formattedPrice}</span>
      {menu.description && <p className={styles.description}>{menu.description}</p>}
      {showActions && (
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={(e) => { e.stopPropagation(); onEdit?.(menu); }}
            data-testid={`menu-edit-${menu.id}`}
            aria-label={`${menu.name} 수정`}
          >
            수정
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={(e) => { e.stopPropagation(); onDelete?.(menu.id); }}
            data-testid={`menu-delete-${menu.id}`}
            aria-label={`${menu.name} 삭제`}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
