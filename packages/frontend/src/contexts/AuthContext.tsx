import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../services/auth.api';
import type { AdminLoginRequest } from '../types';

interface AuthContextValue {
  token: string | null;
  storeId: string | null;
  adminId: number | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (data: AdminLoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adminToken'));
  const [storeId, setStoreId] = useState<string | null>(() => localStorage.getItem('adminStoreId'));
  const [adminId, setAdminId] = useState<number | null>(() => {
    const id = localStorage.getItem('adminId');
    return id ? Number(id) : null;
  });
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('adminUsername'));

  const isAuthenticated = !!token;

  const login = useCallback(async (data: AdminLoginRequest) => {
    const response = await authApi.adminLogin(data);
    setToken(response.token);
    setStoreId(String(response.admin.storeId));
    setAdminId(response.admin.id);
    setUsername(response.admin.username);
    localStorage.setItem('adminToken', response.token);
    localStorage.setItem('adminStoreId', String(response.admin.storeId));
    localStorage.setItem('adminId', String(response.admin.id));
    localStorage.setItem('adminUsername', response.admin.username);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStoreId(null);
    setAdminId(null);
    setUsername(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminStoreId');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminUsername');
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]!));
        const exp = payload.exp * 1000;
        if (Date.now() >= exp) {
          logout();
        }
      } catch {
        logout();
      }
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ token, storeId, adminId, username, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
