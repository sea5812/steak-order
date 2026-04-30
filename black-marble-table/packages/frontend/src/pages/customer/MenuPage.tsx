import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTableAuth } from '../../hooks/useTableAuth';
import { useOrderList } from '../../hooks/useOrderList';
import { menuApi } from '../../services/menu.api';
import type { Category, MenuItem, ToastMessage } from '../../types';
import CategoryNav from '../../components/CategoryNav';
import MenuCard from '../../components/MenuCard';
import QuantityControl from '../../components/QuantityControl';
import Toast from '../../components/Toast';
import styles from './MenuPage.module.css';

export default function CustomerMenuPage() {
  const { storeId, tableNumber } = useTableAuth();
  const { addItem, totalItems } = useOrderList();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!storeId) return;
    setIsLoading(true);
    Promise.all([menuApi.getCategories(storeId), menuApi.getMenus(storeId)])
      .then(([cats, items]) => {
        setCategories(cats);
        setMenus(items);
        if (cats.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(cats[0]!.id);
        }
      })
      .catch(() => addToast('error', '메뉴를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredMenus = selectedCategoryId
    ? menus.filter((m) => m.categoryId === selectedCategoryId)
    : menus;

  const handleMenuClick = useCallback((menu: MenuItem) => {
    setSelectedMenu(menu);
    setModalQuantity(1);
  }, []);

  const handleAddToOrder = useCallback(() => {
    if (!selectedMenu) return;
    addItem({
      menuId: selectedMenu.id,
      menuName: selectedMenu.name,
      price: selectedMenu.price,
      imageUrl: selectedMenu.imageUrl || undefined,
      quantity: modalQuantity,
    });
    addToast('success', '주문 목록에 추가되었습니다.');
    setSelectedMenu(null);
  }, [selectedMenu, modalQuantity, addItem]);

  function addToast(type: ToastMessage['type'], message: string) {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.brand}>Black Marble Table</h1>
        {tableNumber && <span className={styles.tableInfo}>테이블 {tableNumber}</span>}
      </header>

      <CategoryNav categories={categories} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />

      {isLoading ? (
        <div className={styles.loading}>메뉴를 불러오는 중...</div>
      ) : filteredMenus.length > 0 ? (
        <div className={styles.menuGrid}>
          {filteredMenus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onClick={handleMenuClick} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>메뉴가 없습니다.</div>
      )}

      {selectedMenu && (
        <div className={styles.modalOverlay} onClick={() => setSelectedMenu(null)} data-testid="menu-detail-modal">
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selectedMenu.imageUrl && (
              <img src={selectedMenu.imageUrl} alt={selectedMenu.name} className={styles.modalImage} loading="lazy" />
            )}
            <h2 className={styles.modalName}>{selectedMenu.name}</h2>
            <p className={styles.modalPrice}>₩{selectedMenu.price.toLocaleString()}</p>
            {selectedMenu.description && <p className={styles.modalDesc}>{selectedMenu.description}</p>}
            <div className={styles.modalActions}>
              <QuantityControl value={modalQuantity} onChange={setModalQuantity} />
              <button className={styles.addBtn} onClick={handleAddToOrder} data-testid="menu-add-to-order">주문 목록에 추가</button>
            </div>
          </div>
        </div>
      )}

      <nav className={styles.bottomBar} aria-label="메인 네비게이션">
        <Link to="/" className={`${styles.tab} ${location.pathname === '/' ? styles.tabActive : ''}`} data-testid="tab-menu">
          <span className={styles.tabIcon}>🍽</span><span>메뉴</span>
        </Link>
        <Link to="/order-list" className={`${styles.tab} ${location.pathname === '/order-list' ? styles.tabActive : ''}`} data-testid="tab-order-list">
          <span className={styles.tabIcon}>📋</span><span>주문 목록</span>
          {totalItems > 0 && <span className={styles.badge}>{totalItems}</span>}
        </Link>
        <Link to="/orders" className={`${styles.tab} ${location.pathname === '/orders' ? styles.tabActive : ''}`} data-testid="tab-orders">
          <span className={styles.tabIcon}>📜</span><span>주문 내역</span>
        </Link>
      </nav>

      <Toast messages={toasts} onDismiss={dismissToast} />
    </div>
  );
}
