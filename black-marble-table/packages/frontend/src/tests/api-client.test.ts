import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as Record<string, unknown>).fetch = mockFetch;

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    localStorage.clear();
  });

  it('GET 요청에 Content-Type 헤더를 포함한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const { apiClient } = await import('../services/api-client');
    await apiClient.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('토큰이 있으면 Authorization 헤더를 포함한다', async () => {
    localStorage.setItem('adminToken', 'test-token');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const { apiClient } = await import('../services/api-client');
    await apiClient.get('/test', 'admin');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('에러 응답 시 에러를 throw한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: '잘못된 요청입니다.' }),
    });

    const { apiClient } = await import('../services/api-client');
    await expect(apiClient.get('/test')).rejects.toThrow('잘못된 요청입니다.');
  });

  it('POST 요청에 body를 JSON으로 전송한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    });

    const { apiClient } = await import('../services/api-client');
    await apiClient.post('/test', { name: 'test' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      }),
    );
  });

  it('204 응답 시 undefined를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const { apiClient } = await import('../services/api-client');
    const result = await apiClient.delete('/test');
    expect(result).toBeUndefined();
  });
});
