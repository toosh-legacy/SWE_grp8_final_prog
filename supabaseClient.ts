/**
 * supabaseClient.ts — Campus Connect
 *
 * Next.js exposes only variables prefixed with `NEXT_PUBLIC_*` to the browser.
 * Set them in `.env.local` (local) or your hosting provider’s env (production).
 */

import { createClient } from '@supabase/supabase-js';

/** Static `process.env.NEXT_PUBLIC_*` access — required so Next.js inlines vars into client bundles (dynamic lookups are not inlined). */
function normalizeSupabaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/i, '');
  }
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

type AuthError = { message: string };
type AuthUser = { id: string };
type AuthSession = { user: AuthUser };
type AuthResult<TData> = { data: TData; error: AuthError | null };

interface BrowserSafeSupabaseClient {
  auth: {
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<AuthResult<Record<string, never>>>;
    signInWithOAuth: (options: { provider: string; options?: { redirectTo?: string } }) => Promise<AuthResult<Record<string, never>>>;
    signUp: (credentials: {
      email: string;
      password: string;
      options?: { emailRedirectTo?: string; data?: Record<string, string> };
    }) => Promise<AuthResult<Record<string, never>>>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPasswordForEmail: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<AuthResult<Record<string, never>>>;
    getSession: () => Promise<AuthResult<{ session: AuthSession | null }>>;
    getUser: (jwt?: string) => Promise<AuthResult<{ user: AuthUser | null }>>;
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
  };
}

function isBrowserOnSafeOrigin(): boolean {
  if (typeof window === 'undefined') return true;

  const origin = window.location?.origin;
  return Boolean(origin) && origin !== 'null';
}

const missingEnvMessage =
  'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY && isBrowserOnSafeOrigin()
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : ({
        auth: {
          signInWithPassword: async () => ({ data: {}, error: { message: missingEnvMessage } }),
          signInWithOAuth: async () => ({ data: {}, error: { message: missingEnvMessage } }),
          signUp: async () => ({ data: {}, error: { message: missingEnvMessage } }),
          signOut: async () => ({ error: { message: missingEnvMessage } }),
          resetPasswordForEmail: async () => ({
            data: {},
            error: { message: missingEnvMessage },
          }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: { message: missingEnvMessage } }),
          onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: () => {} } },
          }),
        },
      }) as BrowserSafeSupabaseClient;
