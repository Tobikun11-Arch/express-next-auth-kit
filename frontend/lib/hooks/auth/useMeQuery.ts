import {useQuery} from '@tanstack/react-query';
import {getMe} from '@/lib/api/authApi';

export const meQueryKey = ['auth', 'me'] as const;

export function useMeQuery() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: getMe,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000
  });
}