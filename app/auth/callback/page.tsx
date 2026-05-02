'use client';

/**
 * app/auth/callback/page.tsx — Campus Connect
 *
 * Supabase PKCE OAuth callback handler.
 *
 * After Google/Discord redirect back to the app, Supabase appends ?code=XXX to
 * this URL. We exchange that code for a session here, then send the user to /home.
 * Without this page, the DashboardLayout calls getSession() before the code is
 * exchanged and finds no session, kicking the user back to /login.
 */

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/supabaseClient';

// ─── Inner handler (needs Suspense boundary because of useSearchParams) ─────────

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code  = searchParams.get('code');
    const error = searchParams.get('error');
    const desc  = searchParams.get('error_description');
    const next  = searchParams.get('next') ?? '/home';

    // Provider returned an error (e.g. user denied, provider not configured)
    if (error) {
      const msg = desc ?? error;
      router.replace(`/login?oauth_error=${encodeURIComponent(msg)}`);
      return;
    }

    // No code — already signed in or direct navigation
    if (!code) {
      router.replace(next);
      return;
    }

    // Exchange code → session
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchErr }) => {
      if (exchErr) {
        router.replace(`/login?oauth_error=${encodeURIComponent(exchErr.message)}`);
      } else {
        router.replace(next);
      }
    });
  }, [router, searchParams]);

  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuthCallbackPage() {
  return (
    <div className="dashboard-auth-gate">
      <p className="dashboard-auth-gate__text">Completing sign-in…</p>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
