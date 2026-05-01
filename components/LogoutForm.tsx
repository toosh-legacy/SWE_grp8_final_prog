'use client';

/**
 * LogoutForm.tsx — Campus Connect
 * Sign-out UI Component
 *
 * Handles:
 *   - Session check via Supabase
 *   - Log out (calls authService.logout with current user id)
 *   - Redirect to login after success
 *
 * Aligned with the Logout use case sequence diagram:
 *   LogoutGUI → AuthController → Supabase Auth → clear session
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/logout';
import { supabase } from '@/supabaseClient';

// ─── Validation (mirrors authService.ts guards for instant UI feedback) ─────

function isValidAuthId(authId: string | null | undefined): boolean {
  if (authId === null || authId === undefined) return false;
  return String(authId).trim().length > 0;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LogoutForm() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function handleLogout(): Promise<void> {
    setAuthError('');

    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const userId = session?.user?.id;
      if (!isValidAuthId(userId)) {
        setAuthError('You are not signed in.');
        return;
      }

      await logout(userId);
      router.push('/login');
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      if (message.includes('INVALID_AUTH_ID')) {
        setAuthError('Could not determine your account. Please try again.');
      } else if (message.includes('LOGOUT_ERROR')) {
        setAuthError('Sign out failed. Please try again.');
      } else {
        setAuthError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="logout-container">
      <div className="logout-card">
        <div className="logout-header">
          <h1 className="app-title">Campus Connect</h1>
          <p className="app-subtitle">Sign out of your account</p>
        </div>

        {authError && (
          <div className="error-banner" role="alert">
            {authError}
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handleLogout()}
          disabled={loading}
          aria-label="Sign out"
        >
          {loading ? 'Signing out…' : 'Log Out'}
        </button>

        <p className="register-link">
          <Link href="/home">Back to home</Link>
        </p>
      </div>
    </div>
  );
}
