'use client';

import {useEffect} from 'react';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useMeQuery} from '@/lib/hooks/auth/useMeQuery';
import {getDashboardPath} from '@/lib/auth/redirects';
import Loading from '../loading';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({children}: AuthLayoutProps) => {
  const router = useRouter();
  const {data, isLoading, isFetching, isSuccess} = useMeQuery();

  useEffect(() => {
    if (!isSuccess) return;
    router.replace(getDashboardPath(data.user.type));
  }, [data, isSuccess, router]);

  if (isLoading || isFetching) return <Loading />;

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/assets/auth_img2.JPG"
          loading="eager"
          alt="App background image"
          className="absolute inset-0 w-full h-full object-cover"
          width={800}
          height={1200}
        />
        <div className="absolute inset-0 bg-primary/78" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <h1 className="text-4xl font-bold mb-3">APP name</h1>
          <p className="text-lg opacity-90">
            App description goes here. This is a sample description to fill the space and give an idea of how the layout looks with text content.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;