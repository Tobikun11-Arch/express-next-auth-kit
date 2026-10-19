import {useQuery} from '@tanstack/react-query';
import {getMe} from '@/lib/api/authApi';
import {isAuthError} from '@/lib/api/isAuthError';

export const meQueryKey = ['auth', 'me'] as const;

export function useMeQuery() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: getMe,
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 3,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  });
}
