'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { supabase } from '@/supabaseClient';

const DashboardUserContext = createContext<string | undefined>(undefined);

export function useDashboardUserId(): string {
  const id = useContext(DashboardUserContext);
  if (!id)
    throw new Error('useDashboardUserId must be used within DashboardLayout.');
  return id;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'Home', href: '/home' },
  { label: 'Study Groups', href: '/study-groups' },
  { label: 'Direct Messages', href: '/messages' },
  { label: 'Profile', href: '/profile' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (cancelled) return;
        if (!session?.user?.id) {
          router.replace('/login');
          return;
        }
        setUserId(session.user.id);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready)
    return (
      <div className="dashboard-auth-gate">
        <p className="dashboard-auth-gate__text">Loading…</p>
      </div>
    );

  if (!userId) return null;

  const pageHeading = pageTitleForPath(pathname);

  return (
    <DashboardUserContext.Provider value={userId}>
      <div className="app-shell">
        <aside className="app-shell__sidebar" aria-label="Main navigation">
          <nav className="app-shell__nav">
            {NAV_ITEMS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href
                    ? 'app-shell__nav-link app-shell__nav-link--active'
                    : 'app-shell__nav-link'
                }
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="app-shell__body">
          <div className="app-shell__masthead">
            <h1 className="shell-page-heading">{pageHeading}</h1>
            <div className="shell-toolbar" role="presentation">
              <span className="shell-brand-pill">Campus Connect</span>
              <div className="shell-toolbar__tools">
                <Link
                  href="/profile"
                  className="shell-icon-btn"
                  aria-label="Settings"
                >
                  <svg
                    className="shell-icon-btn__svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="3.25" />
                    <path d="M12 1v2.5M12 20.5V23M4.22 4.22l1.77 1.77M17.91 17.91l1.77 1.77M1 12h2.5M20.5 12H23M4.22 19.78l1.77-1.77M17.91 6.09l1.77-1.77" />
                  </svg>
                </Link>
                <Link href="/logout" className="shell-toolbar__logout">
                  Logout
                </Link>
              </div>
            </div>
          </div>

          <main className="app-shell__main">{children}</main>
        </div>
      </div>
    </DashboardUserContext.Provider>
  );
}

function pageTitleForPath(pathname: string): string {
  if (pathname.startsWith('/study-groups')) return 'Study Groups';
  if (pathname.startsWith('/messages')) return 'Direct Messages';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Home';
}
