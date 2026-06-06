/**
 * Configured Axios instance.
 *  • attaches the bearer access token to every request
 *  • on a 401, transparently refreshes the token once and replays the request
 *  • queues concurrent requests during a refresh so we refresh only once
 *  • unwraps the API envelope so callers receive `data` directly
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/lib/config';
import { tokenStorage } from '@/lib/storage';
import type { ApiEnvelope } from '@/types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Called when refresh fails — wired up by the auth store to force logout. */
let onAuthExpired: (() => void) | null = null;
export function setAuthExpiredHandler(fn: () => void) {
  onAuthExpired = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccess();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let isRefreshing = false;
let waiters: Array<(token: string | null) => void> = [];

function flushWaiters(token: string | null) {
  waiters.forEach((w) => w(token));
  waiters = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: REQUEST_TIMEOUT_MS },
    );
    const { accessToken, refreshToken: newRefresh } = res.data.data;
    await tokenStorage.save(accessToken, newRefresh);
    return accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Attempt a single transparent refresh on 401 (but never for the refresh call itself).
    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;

      if (isRefreshing) {
        const token = await new Promise<string | null>((resolve) => waiters.push(resolve));
        if (!token) return Promise.reject(toApiError(error));
        original.headers.set('Authorization', `Bearer ${token}`);
        return api(original);
      }

      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      flushWaiters(newToken);

      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
      await tokenStorage.clear();
      onAuthExpired?.();
    }

    return Promise.reject(toApiError(error));
  },
);

function toApiError(error: AxiosError<ApiEnvelope<unknown>>): ApiError {
  const body = error.response?.data;
  if (body?.error) return new ApiError(body.error.message, body.error.code, error.response?.status ?? 0, body.error.details);
  if (error.code === 'ECONNABORTED') return new ApiError('Request timed out. Check your connection.', 'TIMEOUT', 0);
  return new ApiError(error.message || 'Network error. Please try again.', 'NETWORK', error.response?.status ?? 0);
}

/** Helper that unwraps `{ success, data }` and returns the typed payload. */
export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

/** Variant that also returns meta (for paginated lists). */
export async function unwrapWithMeta<T>(
  promise: Promise<{ data: ApiEnvelope<T> }>,
): Promise<{ data: T; meta: ApiEnvelope<T>['meta'] }> {
  const res = await promise;
  return { data: res.data.data, meta: res.data.meta };
}
