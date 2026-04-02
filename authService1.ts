/**
 * authService.ts — Campus Connect
 * Authentication Subsystem (logout)
 *
 * Implements the Authentication class from the Design Class Diagram (DCD).
 * Method covered here:
 *
 *   + logout(authId: String) : Boolean
 *
 * Backed by Supabase Auth (`signOut`).
 */

import { supabase } from '../supabaseClient';

// ─── Validation Helpers ────────────────────────────────────────────────────────

/**
 * Non-empty trimmed string (used for Supabase user UUID / student auth id).
 */
export function isValidAuthId(authId: string | null | undefined): boolean {
  if (authId === null || authId === undefined) return false;
  return String(authId).trim().length > 0;
}

// ─── Authentication ────────────────────────────────────────────────────────────

/**
 * logout(authId) : Boolean
 *
 * Pre-condition : authId is a non-empty string (typically `session.user.id`).
 * Post-condition: Local/global Supabase session is cleared. Returns true on success.
 *                 Throws on invalid authId or Supabase sign-out failure.
 *
 * @param authId — the studentId / Supabase user UUID
 */
export async function logout(authId: string | null | undefined): Promise<boolean> {
  if (!isValidAuthId(authId)) {
    throw new Error('INVALID_AUTH_ID: authId must be a non-empty string.');
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`LOGOUT_ERROR: ${error.message}`);
  }

  return true;
}
