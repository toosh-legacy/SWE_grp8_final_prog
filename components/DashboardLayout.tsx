'use client';

/**
 * DashboardLayout.tsx — Campus Connect
 * Authenticated App Shell (sidebar, masthead, main outlet)
 *
 * Gates dashboard routes on Supabase session; redirects unauthenticated users to /login.
 * Exposes `useDashboardUserId` for child pages that need the current user id.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from '@/supabaseClient';

// ─── Context & hook ────────────────────────────────────────────────────────────

const DashboardUserContext = createContext<string | undefined>(undefined);

export function useDashboardUserId(): string {
  const id = useContext(DashboardUserContext);
  if (!id)
    throw new Error('useDashboardUserId must be used within DashboardLayout.');
  return id;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ─── Constants ───────────────────────────────────────────────────────────────────

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'Home', href: '/home' },
  { label: 'Study Groups', href: '/study-groups' },
  { label: 'Direct Messages', href: '/messages' },
  { label: 'Profile', href: '/profile' },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // ── Auth: session load + listener ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const applySession = (session: { user: { id: string } } | null) => {
      if (cancelled) return;
      const id = session?.user?.id;
      if (!id) {
        setUserId(null);
        router.replace('/login');
        return;
      }
      setUserId(id);
    };

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        applySession(data.session);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        applySession(session);
      }
    );

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // ── Early returns ────────────────────────────────────────────────────────────

  if (!ready)
    return (
      <div className="dashboard-auth-gate">
        <p className="dashboard-auth-gate__text">Loading…</p>
      </div>
    );

  if (!userId) return null;

  const pageHeading = pageTitleForPath(pathname);

  // ── Render ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function pageTitleForPath(pathname: string): string {
  if (pathname.startsWith('/study-groups')) return 'Study Groups';
  if (pathname.startsWith('/messages')) return 'Direct Messages';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Home';
}
