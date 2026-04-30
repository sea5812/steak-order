import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderListItem } from '../types';

const STORAGE_KEY = 'orderList';

export function useOrderList() {
  const [items, setItems] = useState<OrderListItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as OrderListItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (item: Omit<OrderListItem, 'quantity'> & { quantity?: number }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.menuId === item.menuId);
        if (existing) {
          return prev.map((i) =>
            i.menuId === item.menuId
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i,
          );
        }
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      });
    },
    [],
  );

  const removeItem = useCallback((menuId: number) => {
    setItems((prev) => prev.filter((i) => i.menuId !== menuId));
  }, []);

  const updateQuantity = useCallback((menuId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menuId !== menuId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuId === menuId ? { ...i, quantity: Math.min(quantity, 99) } : i)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  return { items, addItem, removeItem, updateQuantity, clearAll, totalPrice, totalItems };
}
