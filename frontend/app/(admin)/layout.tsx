'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useMeQuery} from '@/lib/hooks/auth/useMeQuery';
import {getDashboardPath} from '@/lib/auth/redirects';
import {isAuthError} from '@/lib/api/isAuthError';
import Loading from '../loading';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const {data, isLoading, isFetching, isError, isSuccess, error} = useMeQuery();

  const isSignedOut = isError && isAuthError(error);

  const isRedirecting =
    isSignedOut || (isSuccess && data.user.type !== 'admin');

  useEffect(() => {
    if (isSignedOut) {
      router.replace('/sign-in');
      return;
    }

    if (!isSuccess) return;

    if (data.user.type !== 'admin') {
      router.replace(getDashboardPath(data.user.type));
    }
  }, [data, isSignedOut, isSuccess, router]);

  if (isLoading || isFetching || isError || isRedirecting) return <Loading />;

  return <>{children}</>;
}