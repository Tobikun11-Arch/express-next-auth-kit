import {useQuery} from '@tanstack/react-query';
import {getMe} from '@/lib/api/authApi';
import {isAuthError} from '@/lib/api/isAuthError';

export const meQueryKey = ['auth', 'me'] as const;

export function useMeQuery() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: getMe,
    // Only a definitive 401 (after the interceptor's one refresh attempt)
    // means signed out. Network errors and 5xx are retried with backoff.
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 3,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  });
}
