import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';

const TOKEN_KEY = 'devmeet.token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

export const api = axios.create({
  baseURL: `${env.API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Unwrap the API envelope and throw a normalised Error on failure.
 */
export const request = async <T>(fn: () => Promise<{ data: { data: T } }>): Promise<T> => {
  try {
    const res = await fn();
    return res.data.data;
  } catch (err) {
    const e = err as AxiosError<{ error?: { message?: string; code?: string } }>;
    const message = e.response?.data?.error?.message || e.message || 'Request failed';
    const wrapped = new Error(message) as Error & { code?: string; status?: number };
    wrapped.code = e.response?.data?.error?.code;
    wrapped.status = e.response?.status;
    throw wrapped;
  }
};

// Global 401 handling — logout on unauthorized.
api.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      const path = window.location.pathname;
      if (
        !path.startsWith('/login') &&
        !path.startsWith('/register') &&
        !path.startsWith('/auth')
      ) {
        setToken(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
