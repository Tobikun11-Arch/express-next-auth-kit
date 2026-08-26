'use client';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useLogout} from '@/lib/hooks/auth/useLogout';
import {Home, Settings, LogOut, LayoutDashboard} from 'lucide-react';

const TABS = [
  {
    label: 'Overview',
    tab: null,
    icon: LayoutDashboard,
    href: '/admin/dashboard'
  },
  {
    label: 'Settings',
    tab: 'settings',
    icon: Settings,
    href: '/admin/dashboard?tab=settings'
  },
  {
    label: 'Profile',
    tab: 'profile',
    icon: Home,
    href: '/admin/dashboard?tab=profile'
  }
];

type AdminDashboardLayoutProps = {
  children: React.ReactNode;
  home?: React.ReactNode;
  settings?: React.ReactNode;
  profile?: React.ReactNode;
};

export default function AdminDashboardLayout({
  children,
  home,
  settings,
  profile
}: AdminDashboardLayoutProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const router = useRouter();
  const logoutMutation = useLogout();

  const slotByTab: Record<string, React.ReactNode | undefined> = {
    settings,
    profile
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.replace('/sign-in');
  };

  const isActive = (itemTab: string | null) =>
    itemTab === null ? !tab : tab === itemTab;

  const content = tab && slotByTab[tab] ? slotByTab[tab] : (home ?? children);

  return (
    <div className="flex h-screen cursor-default bg-gray-50">
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-black shadow-xl z-40">
        <div className="flex items-center justify-center py-6 px-4 border-b border-gray-800">
          <Image
            src="/assets/logo.png"
            alt="App logo"
            width={130}
            height={130}
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>

        <div className="px-4 pt-4 pb-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-2 overflow-y-auto">
          {TABS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.tab);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  text-sm font-semibold tracking-wide
                  transition-all duration-200
                  ${
                    active
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon size={20} className="shrink-0" />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-5 pt-2 border-t border-gray-800">
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-sm font-semibold tracking-wide
              text-gray-400 hover:bg-gray-800 hover:text-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <LogOut size={20} className="shrink-0" />
            <span>{logoutMutation.isPending ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50 pb-24 md:pb-0">
        <div className="p-4 md:p-6">{content}</div>
      </main>

      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-black border-t border-gray-800
          flex items-center justify-around
          px-2 pt-3 pb-[env(safe-area-inset-bottom,10px)]
        "
      >
        {TABS.map(item => {
          const Icon = item.icon;
          const active = isActive(item.tab);
          const label = (
            'mobileLabel' in item ? item.mobileLabel : item.label
          ) as string;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-3 py-1 min-w-15 transition-all duration-200"
            >
              <Icon
                size={22}
                className={`transition-colors duration-200 ${
                  active ? 'text-white' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-[10px] font-bold leading-none transition-colors duration-200 ${
                  active ? 'text-white' : 'text-gray-500'
                }`}
              >
                {label}
              </span>

              <span
                className={`
                  mt-1 h-0.5 w-6 rounded-full bg-white
                  transition-all duration-300 ease-out
                  ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                `}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
