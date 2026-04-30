import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthProvider } from '../contexts/AuthContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('초기 상태는 미인증이다', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.storeId).toBeNull();
  });

  it('localStorage에 토큰이 있으면 인증 상태이다', () => {
    // 만료되지 않은 JWT mock (exp: 2099년)
    const payload = btoa(JSON.stringify({ exp: 4102444800 }));
    const mockToken = `header.${payload}.signature`;
    localStorage.setItem('adminToken', mockToken);
    localStorage.setItem('adminStoreId', 'black-marble');
    localStorage.setItem('adminId', '1');
    localStorage.setItem('adminUsername', 'admin');

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.storeId).toBe('black-marble');
    expect(result.current.username).toBe('admin');
  });

  it('만료된 토큰은 자동 로그아웃된다', () => {
    const payload = btoa(JSON.stringify({ exp: 1000000000 })); // 과거
    const mockToken = `header.${payload}.signature`;
    localStorage.setItem('adminToken', mockToken);

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('AuthProvider 없이 사용하면 에러가 발생한다', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
