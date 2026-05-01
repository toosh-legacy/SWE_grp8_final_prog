/**
 * supabaseClient.ts — Campus Connect
 *
 * Next.js exposes only variables prefixed with `NEXT_PUBLIC_*` to the browser.
 * Set them in `.env.local` (local) or your hosting provider’s env (production).
 */

import { createClient } from '@supabase/supabase-js';

/** Static `process.env.NEXT_PUBLIC_*` access — required so Next.js inlines vars into client bundles (dynamic lookups are not inlined). */
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const missingEnvMessage =
  'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
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
        },
      } as any);
