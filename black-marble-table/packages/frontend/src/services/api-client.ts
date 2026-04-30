const BASE_URL = '/api';

type TokenType = 'admin' | 'table';

function getToken(type: TokenType = 'admin'): string | null {
  const key = type === 'admin' ? 'adminToken' : 'tableToken';
  return localStorage.getItem(key);
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  tokenType: TokenType = 'admin',
): Promise<T> {
  const token = getToken(tokenType);

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  }).catch(() => {
    throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
  });

  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('tableToken');
    window.location.href = '/admin/login';
    throw new Error('인증이 만료되었습니다.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '' }));
    throw new Error(
      (errorData as { message?: string }).message ||
        '요청 처리 중 오류가 발생했습니다.',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get<T>(url: string, tokenType?: TokenType): Promise<T> {
    return request<T>(url, { method: 'GET' }, tokenType);
  },

  post<T>(url: string, body?: unknown, tokenType?: TokenType): Promise<T> {
    return request<T>(
      url,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      tokenType,
    );
  },

  put<T>(url: string, body?: unknown, tokenType?: TokenType): Promise<T> {
    return request<T>(
      url,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      tokenType,
    );
  },

  delete<T>(url: string, tokenType?: TokenType): Promise<T> {
    return request<T>(url, { method: 'DELETE' }, tokenType);
  },

  upload<T>(url: string, formData: FormData, tokenType?: TokenType): Promise<T> {
    return request<T>(
      url,
      {
        method: 'POST',
        body: formData,
      },
      tokenType,
    );
  },

  uploadPut<T>(url: string, formData: FormData, tokenType?: TokenType): Promise<T> {
    return request<T>(
      url,
      {
        method: 'PUT',
        body: formData,
      },
      tokenType,
    );
  },
};
