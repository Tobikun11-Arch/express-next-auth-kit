'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

export default function PublicLayout({children}: {children: React.ReactNode}) {
  const router = useRouter();

  return (
    <>
      <div>
        <button onClick={() => router.push('/sign-in')}>Sign in</button>
      </div>
      <main className="min-h-screen bg-amber-50">{children}</main>
      <span>Footer</span>
    </>
  );
}
