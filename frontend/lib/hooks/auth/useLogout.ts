import {useMutation, useQueryClient} from '@tanstack/react-query';
import {logout} from '@/lib/api/authApi';
import {meQueryKey} from './useMeQuery';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: meQueryKey});
      await queryClient.resetQueries({queryKey: meQueryKey});
    }
  });
}