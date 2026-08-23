import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenantId = localStorage.getItem('tenantId');
  if (tenantId) {
    config.headers['x-tenant-id'] = tenantId;
  }
  return config;
});

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tenantId');
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
    const payload = res.data.data || res.data;
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
    return payload.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const nestedMessage = data?.error && typeof data.error === 'object'
      ? (data.error as Record<string, unknown>).message
      : undefined;
    if (typeof nestedMessage === 'string' && data && typeof data.message === 'undefined') {
      data.message = nestedMessage;
    }
    const original = error.config as RetryableRequest | undefined;
    const onLoginPage = window.location.pathname.startsWith('/login');
    if (error.response?.status === 401 && original && !original._retry && !onLoginPage) {
      const hadSession = Boolean(localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
      if (!hadSession) {
        return Promise.reject(error);
      }
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      try {
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } finally {
        refreshPromise = null;
      }
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
