import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import type {ApiErrorPayload, NormalizedApiError} from './types';

function normalizeApiBaseUrl(rawValue: string | undefined): string | undefined {
  const trimmed = (rawValue ?? '').trim().replace(/\/+$/, '');
  if (trimmed.length === 0) return undefined;

  if (trimmed.startsWith('/')) return trimmed;

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  if (hasProtocol) return trimmed;

  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(trimmed);
  return `${isLocalhost ? 'http' : 'https'}://${trimmed}`;
}

const resolvedBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

let refreshPromise: Promise<void> | null = null;

let csrfToken: string | null = null;
let httpClientRef: ReturnType<typeof axios.create>;

const refreshClient = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return csrfToken;
  const res = await httpClientRef.get<{csrfToken: string}>('/auth/csrf');
  csrfToken = res.data.csrfToken;
  return csrfToken;
}

function attachCsrfInterceptor(client: ReturnType<typeof axios.create>) {
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const method = (config.method ?? 'get').toUpperCase();
      if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
        try {
          const token = await ensureCsrfToken();
          if (token) {
            config.headers.set('x-csrf-token', token);
          }
        } catch {}
      }
      return config;
    }
  );
}

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

  httpClientRef = client;
  attachCsrfInterceptor(client);

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
          const isDefinitiveAuthFailure =
            axios.isAxiosError(refreshError) &&
            refreshError.response?.status === 401;

          if (isDefinitiveAuthFailure) {
            return Promise.reject(normalizeAxiosError(refreshError));
          }

          return Promise.reject(normalizeAxiosError(axiosError));
        }
      }

      return Promise.reject(normalizeAxiosError(axiosError));
    }
  );

  return client;
})();

attachCsrfInterceptor(refreshClient);
