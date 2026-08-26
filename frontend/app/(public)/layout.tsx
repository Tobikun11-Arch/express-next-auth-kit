import Link from 'next/link';

export default function PublicLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Express Next Auth Kit
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-gray-500 transition-colors hover:text-black"
            >
              Docs
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-gray-500 transition-colors hover:text-black"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
