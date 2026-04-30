import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import type {ApiErrorPayload, NormalizedApiError} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const resolvedBaseUrl = API_BASE_URL.length > 0 ? API_BASE_URL : undefined;

let refreshPromise: Promise<void> | null = null;

const refreshClient = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

function normalizeAxiosError(error: unknown): NormalizedApiError {
  const fallback: NormalizedApiError = {
    status: null,
    code: 'NETWORK_ERROR',
    message: 'Network error',
    details: undefined
  };

  if (!axios.isAxiosError(error)) return fallback;

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const status = axiosError.response?.status ?? null;

  const payload = axiosError.response?.data;
  if (payload && typeof payload === 'object') {
    const message = payload.message ?? axiosError.message ?? fallback.message;
    const code = payload.code ?? fallback.code;
    return {
      status,
      code,
      message,
      details: payload.details
    };
  }

  return {
    ...fallback,
    status,
    message: axiosError.message || fallback.message
  };
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshClient
    .post('/auth/refresh', {})
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export const httpClient = (() => {
  const client = axios.create({
    baseURL: resolvedBaseUrl,
    timeout: 20000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => config
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(normalizeAxiosError(error));
      }

      const axiosError: AxiosError<ApiErrorPayload> = error;
      const originalConfig = axiosError.config as
        | (AxiosRequestConfig & {_retry?: boolean})
        | undefined;
      const status = axiosError.response?.status;

      const url = originalConfig?.url ?? '';
      const isRefreshOrLoginEndpoint =
        url === '/auth/refresh' ||
        url === '/auth/login' ||
        url === '/auth/logout' ||
        url === '/auth/register' ||
        url === '/auth/verify' ||
        url === '/auth/resend-verification';

      if (
        status === 401 &&
        originalConfig &&
        !originalConfig._retry &&
        !isRefreshOrLoginEndpoint
      ) {
        originalConfig._retry = true;
        try {
          await refreshAccessToken();
          return client(originalConfig);
        } catch (refreshError) {
          // Reject here so your SignInPage catch runs
          return Promise.reject(normalizeAxiosError(refreshError));
        }
      }

      return Promise.reject(normalizeAxiosError(axiosError));
    }
  );

  return client;
})();
