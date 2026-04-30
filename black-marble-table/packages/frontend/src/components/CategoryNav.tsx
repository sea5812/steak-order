import type { Category } from '../types';
import styles from './CategoryNav.module.css';

interface CategoryNavProps {
  categories: Category[];
  selectedId: number | null;
  onSelect: (categoryId: number) => void;
}

export default function CategoryNav({ categories, selectedId, onSelect }: CategoryNavProps) {
  return (
    <nav className={styles.nav} role="tablist" aria-label="메뉴 카테고리">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`${styles.tab} ${selectedId === cat.id ? styles.active : ''}`}
          onClick={() => onSelect(cat.id)}
          role="tab"
          aria-selected={selectedId === cat.id}
          data-testid={`category-tab-${cat.id}`}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
