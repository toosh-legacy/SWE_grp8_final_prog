/**
 * supabaseClient.ts — Campus Connect
 * Supabase client initialization
 *
 * Initializes the Supabase client with your project URL and API key.
 */

import { createClient } from '@supabase/supabase-js';

const viteEnv = (import.meta as any).env ?? {};
const nodeEnv = (globalThis as any).process?.env ?? {};

const SUPABASE_URL =
  viteEnv.VITE_SUPABASE_URL ||
  nodeEnv.VITE_SUPABASE_URL ||
  nodeEnv.REACT_APP_SUPABASE_URL ||
  '';
const SUPABASE_ANON_KEY =
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  nodeEnv.VITE_SUPABASE_ANON_KEY ||
  nodeEnv.REACT_APP_SUPABASE_ANON_KEY ||
  '';

const missingEnvMessage =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.';

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : ({
        auth: {
          signInWithPassword: async () => ({ data: {}, error: { message: missingEnvMessage } }),
          signInWithOAuth: async () => ({ data: {}, error: { message: missingEnvMessage } }),
          signUp: async () => ({ data: {}, error: { message: missingEnvMessage } }),
          signOut: async () => ({ error: { message: missingEnvMessage } }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: { message: missingEnvMessage } }),
        },
      } as any);
