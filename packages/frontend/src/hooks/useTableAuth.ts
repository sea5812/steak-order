import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/auth.api';
import type { TableLoginRequest } from '../types';

interface TableAuthState {
  token: string | null;
  storeId: string | null;
  tableId: number | null;
  tableNumber: number | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useTableAuth() {
  const [state, setState] = useState<TableAuthState>({
    token: null,
    storeId: null,
    tableId: null,
    tableNumber: null,
    sessionId: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const tryAutoLogin = useCallback(async () => {
    const savedToken = localStorage.getItem('tableToken');

    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]!));
        const exp = payload.exp * 1000;

        if (Date.now() < exp) {
          const info = localStorage.getItem('tableInfo');
          if (info) {
            const tableInfo = JSON.parse(info);
            setState({
              token: savedToken,
              storeId: tableInfo.storeId,
              tableId: tableInfo.tableId,
              tableNumber: tableInfo.tableNumber,
              sessionId: tableInfo.sessionId,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return;
          }
        }
      } catch {
        // Token invalid, try re-login
      }
    }

    const credStr = localStorage.getItem('tableCredentials');
    if (credStr) {
      try {
        const creds = JSON.parse(credStr) as TableLoginRequest;
        const response = await authApi.tableLogin(creds);
        localStorage.setItem('tableToken', response.token);
        localStorage.setItem(
          'tableInfo',
          JSON.stringify({
            storeId: response.table.storeId,
            tableId: response.table.id,
            tableNumber: response.table.tableNumber,
            sessionId: response.table.sessionId,
          }),
        );
        setState({
          token: response.token,
          storeId: response.table.storeId,
          tableId: response.table.id,
          tableNumber: response.table.tableNumber,
          sessionId: response.table.sessionId,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      } catch {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: '관리자에게 재설정을 요청해주세요.',
        }));
        return;
      }
    }

    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  useEffect(() => {
    tryAutoLogin();
  }, [tryAutoLogin]);

  const setup = useCallback(async (data: TableLoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.tableLogin(data);
      localStorage.setItem('tableToken', response.token);
      localStorage.setItem('tableCredentials', JSON.stringify(data));
      localStorage.setItem(
        'tableInfo',
        JSON.stringify({
          storeId: response.table.storeId,
          tableId: response.table.id,
          tableNumber: response.table.tableNumber,
          sessionId: response.table.sessionId,
        }),
      );
      setState({
        token: response.token,
        storeId: response.table.storeId,
        tableId: response.table.id,
        tableNumber: response.table.tableNumber,
        sessionId: response.table.sessionId,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : '설정에 실패했습니다.',
      }));
      throw err;
    }
  }, []);

  return { ...state, setup };
}
