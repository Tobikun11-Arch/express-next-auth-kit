'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useMeQuery} from '@/lib/hooks/auth/useMeQuery';
import {getDashboardPath} from '@/lib/auth/redirects';

export default function OwnerLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const {data,isError, isSuccess} = useMeQuery();

  useEffect(() => {
    if (isError) {
      router.replace('/sign-in');
      return;
    }

    if (!isSuccess) return;

    if (data.user.type !== 'admin') {
      router.replace(getDashboardPath(data.user.type));
    }
  }, [data, isError, isSuccess, router]);

  return <>{children}</>;
}