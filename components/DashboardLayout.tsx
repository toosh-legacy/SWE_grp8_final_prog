'use client';

/**
 * DashboardLayout.tsx — Campus Connect
 * Logged-in shell: sidebar, page title, main content.
 *
 * Requires a Supabase session; sends anonymous users to /login.
 * Children can read the user id via useDashboardUserId().
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';
import { Home, Users, User, Settings, LogOut } from 'lucide-react';

// ─── Context ───────────────────────────────────────────────────────────────────

const DashboardUserContext = createContext<string | undefined>(undefined);

export function useDashboardUserId(): string {
  const id = useContext(DashboardUserContext);
  if (!id) throw new Error('useDashboardUserId must be used inside DashboardLayout.');
  return id;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: ReactNode;
}

// ─── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: 'Home',         href: '/home',          icon: <Home size={18} strokeWidth={2} /> },
  { label: 'Study Groups', href: '/study-groups',   icon: <Users size={18} strokeWidth={2} /> },
  { label: 'Profile',      href: '/profile',        icon: <User size={18} strokeWidth={2} /> },
  { label: 'Settings',     href: '/settings',       icon: <Settings size={18} strokeWidth={2} /> },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function applySession(session: { user?: { id?: string } } | null) {
      if (cancelled) return;
      const id = session?.user?.id;
      if (!id) {
        setUserId(null);
        router.replace('/login');
        return;
      }
      setUserId(id);
    }

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        applySession(data.session);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, session) => applySession(session)
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="dashboard-auth-gate">
        <p className="dashboard-auth-gate__text">Loading…</p>
      </div>
    );
  }

  if (!userId) return null;

  const heading = titleForPath(pathname);

  return (
    <DashboardUserContext.Provider value={userId}>
      <div className="app-shell">
        <aside className="app-shell__sidebar" aria-label="Main navigation">
          <div className="app-shell__sidebar-brand" aria-hidden>
            <div className="sidebar-brand__mark">CC</div>
            <span className="sidebar-brand__name">Campus Connect</span>
          </div>
          <nav className="app-shell__nav">
            {NAV_ITEMS.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href || (href !== '/home' && pathname.startsWith(href))
                    ? 'app-shell__nav-link app-shell__nav-link--active'
                    : 'app-shell__nav-link'
                }
              >
                <span className="nav-link__icon" aria-hidden>{icon}</span>
                <span className="nav-link__label">{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="app-shell__body">
          <div className="app-shell__masthead">
            <h1 className="shell-page-heading">{heading}</h1>
            <div className="shell-toolbar__tools">
              <Link href="/profile" className="shell-icon-btn" aria-label="Profile">
                <User size={20} strokeWidth={1.75} />
              </Link>
              <Link href="/logout" className="shell-toolbar__logout" aria-label="Logout">
                <LogOut size={16} strokeWidth={2} />
                <span>Logout</span>
              </Link>
            </div>
          </div>

          <main className="app-shell__main">{children}</main>
        </div>
      </div>
    </DashboardUserContext.Provider>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function titleForPath(pathname: string): string {
  if (pathname.startsWith('/study-group-messages/')) return 'Study Group';
  if (pathname.startsWith('/study-groups')) return 'Study Groups';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/users/')) return 'Profile';
  return 'Home';
}
