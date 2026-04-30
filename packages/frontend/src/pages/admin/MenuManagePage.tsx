import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { menuApi } from '../../services/menu.api';
import CategoryNav from '../../components/CategoryNav';
import MenuCard from '../../components/MenuCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import type { Category, MenuItem, ToastMessage } from '../../types';
import dashStyles from './DashboardPage.module.css';
import styles from './MenuManagePage.module.css';

export default function AdminMenuManagePage() {
  const { storeId, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirm
  const [deleteMenuId, setDeleteMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (!storeId) return;
    loadData();
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const [cats, items] = await Promise.all([menuApi.getCategories(storeId), menuApi.getMenus(storeId)]);
      setCategories(cats);
      setMenus(items);
      if (cats.length > 0 && !selectedCategoryId) setSelectedCategoryId(cats[0]!.id);
    } catch { addToast('error', '데이터를 불러오는데 실패했습니다.'); }
    finally { setIsLoading(false); }
  }

  function addToast(type: ToastMessage['type'], message: string) {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }]);
  }

  function openCreateForm() {
    setEditingMenu(null);
    setFormName(''); setFormPrice(''); setFormDesc(''); setFormCategoryId(selectedCategoryId ?? ''); setFormImage(null); setFormErrors({});
    setFormOpen(true);
  }

  function openEditForm(menu: MenuItem) {
    setEditingMenu(menu);
    setFormName(menu.name); setFormPrice(String(menu.price)); setFormDesc(menu.description || ''); setFormCategoryId(menu.categoryId); setFormImage(null); setFormErrors({});
    setFormOpen(true);
  }

  function validateForm() {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = '메뉴명을 입력해주세요.';
    if (!formPrice || Number(formPrice) < 0) errors.price = '올바른 가격을 입력해주세요.';
    if (!formCategoryId) errors.categoryId = '카테고리를 선택해주세요.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm() || !storeId) return;
    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', formName.trim());
    formData.append('price', formPrice);
    if (formDesc.trim()) formData.append('description', formDesc.trim());
    formData.append('categoryId', String(formCategoryId));
    if (formImage) formData.append('image', formImage);

    try {
      if (editingMenu) {
        await menuApi.updateMenu(storeId, editingMenu.id, formData);
        addToast('success', '메뉴가 수정되었습니다.');
      } else {
        await menuApi.createMenu(storeId, formData);
        addToast('success', '메뉴가 등록되었습니다.');
      }
      setFormOpen(false);
      loadData();
    } catch { addToast('error', '저장에 실패했습니다.'); }
    finally { setIsSaving(false); }
  }

  async function handleDelete() {
    if (!storeId || deleteMenuId === null) return;
    try {
      await menuApi.deleteMenu(storeId, deleteMenuId);
      addToast('success', '메뉴가 삭제되었습니다.');
      loadData();
    } catch { addToast('error', '삭제에 실패했습니다.'); }
    setDeleteMenuId(null);
  }

  const filteredMenus = selectedCategoryId ? menus.filter((m) => m.categoryId === selectedCategoryId) : menus;

  return (
    <div className={styles.page}>
      {/* Nav Bar (reuse dashboard styles) */}
      <nav className={dashStyles.navbar}>
        <span className={dashStyles.navBrand}>Black Marble Table</span>
        <Link to="/admin/dashboard" className={dashStyles.navLink}>대시보드</Link>
        <Link to="/admin/menus" className={`${dashStyles.navLink} ${location.pathname === '/admin/menus' ? dashStyles.navActive : ''}`}>메뉴 관리</Link>
        <Link to="/admin/tables" className={dashStyles.navLink}>테이블 관리</Link>
        <Link to="/admin/sales" className={dashStyles.navLink}>매출</Link>
        <div className={dashStyles.navSpacer} />
        <div className={dashStyles.navDropdown}>
          <button className={dashStyles.navDropdownBtn} onClick={() => setShowDropdown(!showDropdown)}>▼ 더보기</button>
          {showDropdown && (
            <div className={dashStyles.navDropdownMenu} onMouseLeave={() => setShowDropdown(false)}>
              <Link to="/admin/accounts" className={dashStyles.navDropdownItem} onClick={() => setShowDropdown(false)}>계정 관리</Link>
              <button className={`${dashStyles.navDropdownItem} ${dashStyles.logoutItem}`} onClick={() => { logout(); navigate('/admin/login'); }}>로그아웃</button>
            </div>
          )}
        </div>
      </nav>

      <CategoryNav categories={categories} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <span />
          <button className={styles.addBtn} onClick={openCreateForm} data-testid="menu-add-btn">+ 메뉴 추가</button>
        </div>

        {isLoading ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : filteredMenus.length > 0 ? (
          <div className={styles.menuGrid}>
            {filteredMenus.map((menu) => (
              <MenuCard key={menu.id} menu={menu} showActions onEdit={openEditForm} onDelete={setDeleteMenuId} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>메뉴가 없습니다.</div>
        )}
      </div>

      {/* Form Modal */}
      {formOpen && (
        <div className={styles.formOverlay} onClick={() => setFormOpen(false)}>
          <div className={styles.formModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.formTitle}>{editingMenu ? '메뉴 수정' : '메뉴 등록'}</h3>
            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.field}>
                <label className={styles.label}>메뉴명 <span className={styles.required}>*</span></label>
                <input className={styles.input} value={formName} onChange={(e) => setFormName(e.target.value)} data-testid="menu-form-name" />
                {formErrors.name && <span className={styles.fieldError}>{formErrors.name}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>가격 <span className={styles.required}>*</span></label>
                <input className={styles.input} type="number" min="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} data-testid="menu-form-price" />
                {formErrors.price && <span className={styles.fieldError}>{formErrors.price}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>설명</label>
                <textarea className={styles.textarea} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} data-testid="menu-form-desc" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>카테고리 <span className={styles.required}>*</span></label>
                <select className={styles.select} value={formCategoryId} onChange={(e) => setFormCategoryId(Number(e.target.value))} data-testid="menu-form-category">
                  <option value="">선택</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.categoryId && <span className={styles.fieldError}>{formErrors.categoryId}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>이미지</label>
                <input className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFormImage(e.target.files?.[0] ?? null)} data-testid="menu-form-image" />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setFormOpen(false)}>취소</button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving} data-testid="menu-form-save">{isSaving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={deleteMenuId !== null} title="메뉴 삭제" message="이 메뉴를 삭제하시겠습니까?" confirmText="삭제" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteMenuId(null)} />
      <Toast messages={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
