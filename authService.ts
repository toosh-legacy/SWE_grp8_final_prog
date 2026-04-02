/**
 * authService.ts — Campus Connect
 * Authentication Subsystem
 *
 * Implements the Authentication class from the Design Class Diagram (DCD).
 * All method signatures match the DCD exactly:
 *
 *   + login(email: String, pw: String) : String
 *   + register(email: String, pw: String) : Student
 *   + validateToken(token: String) : Boolean
 *
 * Backed by Supabase Auth.
 */

import { supabase } from '../supabaseClient';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Student {
  studentId: string;
  email: string | undefined;
  name: string;
  campus: string;
  major: string;
  bio: string;
  avatarUrl: string;
  passwordHash: string;
}

// ─── Validation Helpers ────────────────────────────────────────────────────────

/**
 * Checks that an email is non-null, non-empty, and matches a basic RFC format.
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (email === null || email === undefined) return false;
  const trimmed = String(email).trim();
  if (trimmed.length === 0) return false;
  // Basic RFC 5322 simplified pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Checks that a password is non-null, non-empty, and at least 8 characters.
 * Supabase enforces its own minimum on the server; this is the client-side guard.
 */
export function isValidPassword(password: string | null | undefined): boolean {
  if (password === null || password === undefined) return false;
  return String(password).length >= 8;
}

// ─── Authentication Class (DCD) ────────────────────────────────────────────────

/**
 * login(email, pw) : String
 *
 * Pre-condition : An account with the given email exists in the database.
 * Post-condition: Returns the Supabase access token (String) on success.
 *                 Throws an Error on invalid credentials or validation failure.
 */
export async function login(
  email: string | null | undefined,
  pw: string | null | undefined,
): Promise<string> {
  // Client-side validation (exceptional / invalid inputs)
  if (!isValidEmail(email)) {
    throw new Error('INVALID_EMAIL: Email must be a valid email address.');
  }
  if (!isValidPassword(pw)) {
    throw new Error('INVALID_PASSWORD: Password must be at least 8 characters.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email as string).trim(),
    password: pw as string,
  });

  if (error) {
    // Normalize Supabase error messages for the UI layer
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('AUTH_FAILED: Invalid email or password.');
    }
    throw new Error(`AUTH_ERROR: ${error.message}`);
  }

  // Return the access token string — matches DCD return type String
  return data.session!.access_token;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * register(email, pw) : Student
 *
 * Pre-condition : The email is unique and not already in the database.
 * Post-condition: Creates a new account; returns a Student-shaped object.
 *                 Throws an Error on duplicate email or validation failure.
 */
export async function register(
  email: string | null | undefined,
  pw: string | null | undefined,
): Promise<Student> {
  if (!isValidEmail(email)) {
    throw new Error('INVALID_EMAIL: Email must be a valid email address.');
  }
  if (!isValidPassword(pw)) {
    throw new Error('INVALID_PASSWORD: Password must be at least 8 characters.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: (email as string).trim(),
    password: pw as string,
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('DUPLICATE_EMAIL: An account with this email already exists.');
    }
    throw new Error(`REGISTER_ERROR: ${error.message}`);
  }

  // Return a Student-shaped object matching the DCD Student class
  return {
    studentId: data.user!.id,
    email: data.user!.email,
    name: '',          // Set during profile setup
    campus: '',        // Set during profile setup
    major: '',
    bio: '',
    avatarUrl: '',
    passwordHash: '[managed by Supabase Auth]',
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * validateToken(token) : Boolean
 *
 * Pre-condition : A token string is provided.
 * Post-condition: Returns true if the token corresponds to a valid, non-expired
 *                 session. Returns false otherwise.
 *
 * @param token — Supabase access token (JWT)
 */
export async function validateToken(token: string | null | undefined): Promise<boolean> {
  if (token === null || token === undefined || String(token).trim() === '') {
    return false;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return false;
  }

  return true;
}
