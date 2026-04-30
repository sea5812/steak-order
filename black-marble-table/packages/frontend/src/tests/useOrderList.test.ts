import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderList } from '../hooks/useOrderList';

describe('useOrderList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 상태는 빈 배열이다', () => {
    const { result } = renderHook(() => useOrderList());
    expect(result.current.items).toEqual([]);
    expect(result.current.totalPrice).toBe(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('항목을 추가할 수 있다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.menuName).toBe('스테이크');
    expect(result.current.items[0]!.quantity).toBe(1);
    expect(result.current.totalPrice).toBe(50000);
  });

  it('동일 메뉴 추가 시 수량이 증가한다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
    });
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000, quantity: 2 });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.quantity).toBe(3);
    expect(result.current.totalPrice).toBe(150000);
  });

  it('수량을 변경할 수 있다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
    });
    act(() => {
      result.current.updateQuantity(1, 5);
    });
    expect(result.current.items[0]!.quantity).toBe(5);
    expect(result.current.totalPrice).toBe(250000);
  });

  it('수량 0으로 변경 시 항목이 삭제된다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
    });
    act(() => {
      result.current.updateQuantity(1, 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('항목을 삭제할 수 있다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
      result.current.addItem({ menuId: 2, menuName: '와인', price: 30000 });
    });
    act(() => {
      result.current.removeItem(1);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.menuId).toBe(2);
  });

  it('전체 비우기가 동작한다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
      result.current.addItem({ menuId: 2, menuName: '와인', price: 30000 });
    });
    act(() => {
      result.current.clearAll();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('localStorage에 저장되고 복원된다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
    });

    const saved = JSON.parse(localStorage.getItem('orderList') || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].menuName).toBe('스테이크');
  });

  it('최대 수량 99를 초과하지 않는다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000 });
    });
    act(() => {
      result.current.updateQuantity(1, 150);
    });
    expect(result.current.items[0]!.quantity).toBe(99);
  });

  it('totalItems는 수량 합산이다', () => {
    const { result } = renderHook(() => useOrderList());
    act(() => {
      result.current.addItem({ menuId: 1, menuName: '스테이크', price: 50000, quantity: 2 });
      result.current.addItem({ menuId: 2, menuName: '와인', price: 30000, quantity: 3 });
    });
    expect(result.current.totalItems).toBe(5);
  });
});
