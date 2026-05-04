'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useMeQuery} from '@/lib/hooks/auth/useMeQuery';
import {getDashboardPath} from '@/lib/auth/redirects';
import Loading from '../loading';

export default function CustomerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {data, isLoading, isFetching, isError, isSuccess} = useMeQuery();

  const isRedirecting = isError || (isSuccess && data.user.type !== 'user');

  useEffect(() => {
    if (isError) {
      router.replace('/sign-in');
      return;
    }

    if (!isSuccess) return;

    if (data.user.type !== 'user') {
      router.replace(getDashboardPath(data.user.type));
    }
  }, [data, isError, isSuccess, router]);

  if (isLoading || isFetching || isRedirecting) return <Loading />;

  return <>{children}</>;
}