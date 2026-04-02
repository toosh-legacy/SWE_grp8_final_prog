/**
 * authService.test.ts — Campus Connect
 * Test Class for the Authentication Subsystem
 *
 * Testing Framework : Vitest
 * Module Under Test : src/services/authService.ts
 *
 * Covers all DCD methods:
 *   login(email, pw)         → String (access token)
 *   register(email, pw)      → Student object
 *   validateToken(token)     → Boolean
 *   logout(authId)           → Boolean
 * 
 * STEP 1 — INPUT VALUE ANALYSIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Method: login(email: String, pw: String)
 * ┌──────────────┬─────────┬───────────────────────────┬──────────────────────────┬────────────────────────────┐
 * │ Variable     │ Type    │ Valid                     │ Invalid                  │ Exceptional                │
 * ├──────────────┼─────────┼───────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ email        │ String  │ "user@utdallas.edu"       │ "notanemail", "a@b"      │ null, undefined, ""        │
 * │ pw           │ String  │ "SecurePass1!" (≥8 chars) │ "abc" (<8 chars)         │ null, undefined, ""        │
 * └──────────────┴─────────┴───────────────────────────┴──────────────────────────┴────────────────────────────┘
 *
 *  Method: register(email: String, pw: String)
 * ┌──────────────┬─────────┬───────────────────────────┬──────────────────────────┬────────────────────────────┐
 * │ Variable     │ Type    │ Valid                     │ Invalid                  │ Exceptional                │
 * ├──────────────┼─────────┼───────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ email        │ String  │ "new@utdallas.edu"        │ "bademail", duplicate    │ null, undefined, ""        │
 * │ pw           │ String  │ "StrongPass9!" (≥8 chars) │ "1234567" (7 chars)      │ null, undefined, ""        │
 * └──────────────┴─────────┴───────────────────────────┴──────────────────────────┴────────────────────────────┘
 *
 *  Method: validateToken(token: String)
 * ┌──────────────┬─────────┬───────────────────────────┬──────────────────────────┬────────────────────────────┐
 * │ Variable     │ Type    │ Valid                     │ Invalid                  │ Exceptional                │
 * ├──────────────┼─────────┼───────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ token        │ String  │ valid non-expired JWT     │ expired JWT, random str  │ null, undefined, ""        │
 * └──────────────┴─────────┴───────────────────────────┴──────────────────────────┴────────────────────────────┘
 *
 *  Method: logout(authId: String)  [authService1.ts]
 * ┌──────────────┬─────────┬───────────────────────────┬──────────────────────────┬────────────────────────────┐
 * │ Variable     │ Type    │ Valid                     │ Invalid                  │ Exceptional                │
 * ├──────────────┼─────────┼───────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ authId       │ String  │ non-empty UUID / id       │ signOut returns error    │ null, undefined, ""        │
 * └──────────────┴─────────┴───────────────────────────┴──────────────────────────┴────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 2 — TEST CASE SCENARIOS  (fig 20.14, pg 521)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  login() — 8 scenarios identified, narrowed to 6
 * ┌──────┬──────────────────────┬──────────────────────┬─────────────────────────────────────────┐
 * │ TC # │ email                │ pw                   │ Expected Output                         │
 * ├──────┼──────────────────────┼──────────────────────┼─────────────────────────────────────────┤
 * │ L1   │ valid registered     │ correct              │ resolves → String (access token)        │
 * │ L2   │ valid registered     │ wrong password       │ throws Error("AUTH_FAILED…")            │
 * │ L3   │ invalid format       │ valid                │ throws Error("INVALID_EMAIL…")          │
 * │ L4   │ empty string ""      │ valid                │ throws Error("INVALID_EMAIL…")          │
 * │ L5   │ valid unregistered   │ valid                │ throws Error("AUTH_FAILED…")            │
 * │ L6   │ null                 │ valid                │ throws Error("INVALID_EMAIL…")          │
 * │ L7*  │ valid                │ too short (<8)       │ throws Error("INVALID_PASSWORD…")       │
 * │ L8*  │ valid                │ null                 │ throws Error("INVALID_PASSWORD…")       │
 * └──────┴──────────────────────┴──────────────────────┴─────────────────────────────────────────┘
 * * L7 merged into L8 (both test the same code path); narrowed to 6 coded tests.
 *
 *  register() — 6 scenarios, narrowed to 5
 * ┌──────┬──────────────────────┬──────────────────────┬─────────────────────────────────────────┐
 * │ TC # │ email                │ pw                   │ Expected Output                         │
 * ├──────┼──────────────────────┼──────────────────────┼─────────────────────────────────────────┤
 * │ R1   │ valid unique email   │ strong (≥8 chars)    │ resolves → Student object (has fields)  │
 * │ R2   │ already registered   │ strong               │ throws Error("DUPLICATE_EMAIL…")        │
 * │ R3   │ invalid format       │ strong               │ throws Error("INVALID_EMAIL…")          │
 * │ R4   │ valid                │ too short (<8 chars) │ throws Error("INVALID_PASSWORD…")       │
 * │ R5   │ null                 │ null                 │ throws Error("INVALID_EMAIL…")          │
 * └──────┴──────────────────────┴──────────────────────┴─────────────────────────────────────────┘
 *
 *  validateToken() — 4 scenarios
 * ┌──────┬──────────────────────┬─────────────────────────────────────────┐
 * │ TC # │ token                │ Expected Output                         │
 * ├──────┼──────────────────────┼─────────────────────────────────────────┤
 * │ V1   │ valid JWT            │ resolves → true                         │
 * │ V2   │ expired/invalid JWT  │ resolves → false                        │
 * │ V3   │ empty string ""      │ resolves → false                        │
 * │ V4   │ null                 │ resolves → false                        │
 * └──────┴──────────────────────┴─────────────────────────────────────────┘
 *
 *  isValidAuthId() — 5 scenarios  [authService1.ts]
 * ┌──────┬──────────────────────┬─────────────────────────────────────────┐
 * │ TC # │ authId               │ Expected Output                         │
 * ├──────┼──────────────────────┼─────────────────────────────────────────┤
 * │ A1   │ valid UUID string    │ true                                    │
 * │ A2   │ empty string ""      │ false                                   │
 * │ A3   │ whitespace only      │ false                                   │
 * │ A4   │ null                 │ false                                   │
 * │ A5   │ undefined            │ false                                   │
 * └──────┴──────────────────────┴─────────────────────────────────────────┘
 *
 *  logout() — 4 scenarios  [authService1.ts]
 * ┌──────┬──────────────────────┬─────────────────────────────────────────┐
 * │ TC # │ authId               │ Expected Output                         │
 * ├──────┼──────────────────────┼─────────────────────────────────────────┤
 * │ O1   │ valid id             │ resolves → true                         │
 * │ O2   │ empty string ""      │ throws Error("INVALID_AUTH_ID…")        │
 * │ O3   │ null                 │ throws Error("INVALID_AUTH_ID…")        │
 * │ O4   │ valid id, signOut err│ throws Error("LOGOUT_ERROR…")           │
 * └──────┴──────────────────────┴─────────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STEP 3 — CONCRETE TEST CASE VALUES  (fig 20.15, pg 522)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  login() concrete values
 * ┌──────┬────────────────────────────┬────────────────────┬────────────────────────────────────────┐
 * │ TC # │ email (concrete)           │ pw (concrete)      │ Expected Output (concrete)             │
 * ├──────┼────────────────────────────┼────────────────────┼────────────────────────────────────────┤
 * │ L1   │ "alice@utdallas.edu"       │ "Password1!"       │ string starting with "mock_token_"     │
 * │ L2   │ "alice@utdallas.edu"       │ "WrongPass9!"      │ Error message includes "AUTH_FAILED"   │
 * │ L3   │ "not-an-email"             │ "Password1!"       │ Error message includes "INVALID_EMAIL" │
 * │ L4   │ ""                         │ "Password1!"       │ Error message includes "INVALID_EMAIL" │
 * │ L5   │ "ghost@utdallas.edu"       │ "Password1!"       │ Error message includes "AUTH_FAILED"   │
 * │ L6   │ null                       │ "Password1!"       │ Error message includes "INVALID_EMAIL" │
 * └──────┴────────────────────────────┴────────────────────┴────────────────────────────────────────┘
 *
 *  register() concrete values
 * ┌──────┬────────────────────────────┬────────────────────┬─────────────────────────────────────────────────┐
 * │ TC # │ email (concrete)           │ pw (concrete)      │ Expected Output (concrete)                      │
 * ├──────┼────────────────────────────┼────────────────────┼─────────────────────────────────────────────────┤
 * │ R1   │ "newuser@utdallas.edu"     │ "NewPass99!"       │ object with studentId:"uuid-001", email matches │
 * │ R2   │ "taken@utdallas.edu"       │ "NewPass99!"       │ Error includes "DUPLICATE_EMAIL"                │
 * │ R3   │ "bademail@@"              │ "NewPass99!"       │ Error includes "INVALID_EMAIL"                  │
 * │ R4   │ "newuser@utdallas.edu"     │ "short"            │ Error includes "INVALID_PASSWORD"               │
 * │ R5   │ null                       │ null               │ Error includes "INVALID_EMAIL"                  │
 * └──────┴────────────────────────────┴────────────────────┴─────────────────────────────────────────────────┘
 *
 *  validateToken() concrete values
 * ┌──────┬──────────────────────────────────┬────────────────────────────────┐
 * │ TC # │ token (concrete)                 │ Expected Output (concrete)     │
 * ├──────┼──────────────────────────────────┼────────────────────────────────┤
 * │ V1   │ "valid.jwt.token"                │ true                           │
 * │ V2   │ "expired.jwt.token"              │ false                          │
 * │ V3   │ ""                               │ false                          │
 * │ V4   │ null                             │ false                          │
 * └──────┴──────────────────────────────────┴────────────────────────────────┘
 *
 *  logout() concrete values  [authService1.ts]
 * ┌──────┬──────────────────────────────────────┬─────────────────────────────────────┐
 * │ TC # │ authId (concrete)                    │ Expected Output (concrete)          │
 * ├──────┼──────────────────────────────────────┼─────────────────────────────────────┤
 * │ O1   │ "550e8400-e29b-41d4-a716-446655440000"│ true                               │
 * │ O2   │ ""                                   │ Error includes "INVALID_AUTH_ID"    │
 * │ O3   │ null                                 │ Error includes "INVALID_AUTH_ID"    │
 * │ O4   │ "550e8400-e29b-41d4-a716-446655440000"│ Error includes "LOGOUT_ERROR"      │
 * └──────┴──────────────────────────────────────┴─────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  login,
  register,
  validateToken,
  isValidEmail,
  isValidPassword,
} from './authService';
import { logout, isValidAuthId } from './authService1';

// ─── Mock Supabase ─────────────────────────────────────────────────────────────
//
// We mock the entire supabase client so no real network calls are made.
// Each test configures what the mock returns via mockResolvedValueOnce.
//
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

// Import the mocked supabase AFTER vi.mock so we get the spy references
import { supabase } from '../supabaseClient';

// ─── Helper: reset all mocks before each test ──────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Helper / Validation Unit Tests
// =============================================================================

describe('isValidEmail()', () => {
  it('returns true for a well-formed email', () => {
    expect(isValidEmail('alice@utdallas.edu')).toBe(true);
  });

  it('returns false for an email with no domain', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidEmail(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe('isValidPassword()', () => {
  it('returns true for a password with 8 characters', () => {
    expect(isValidPassword('abcdefgh')).toBe(true);
  });

  it('returns true for a password with more than 8 characters', () => {
    expect(isValidPassword('SecurePass1!')).toBe(true);
  });

  it('returns false for a password shorter than 8 characters', () => {
    expect(isValidPassword('short')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidPassword(null)).toBe(false);
  });
});

// =============================================================================
// login(email, pw) : String
// =============================================================================

describe('login()', () => {

  // ── TC L1: valid email + correct password → returns access token string ─────
  it('L1 | valid credentials → resolves with an access token string', async () => {
    // Arrange
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { session: { access_token: 'mock_token_abc123' } },
      error: null,
    } as any);

    // Act
    const result = await login('alice@utdallas.edu', 'Password1!');

    // Assert
    expect(typeof result).toBe('string');
    expect(result).toBe('mock_token_abc123');
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledOnce();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'alice@utdallas.edu',
      password: 'Password1!',
    });
  });

  // ── TC L2: valid email + wrong password → throws AUTH_FAILED ────────────────
  it('L2 | correct email but wrong password → throws AUTH_FAILED error', async () => {
    // Arrange
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {},
      error: { message: 'Invalid login credentials' },
    } as any);

    // Act & Assert
    await expect(login('alice@utdallas.edu', 'WrongPass9!')).rejects.toThrow(
      'AUTH_FAILED'
    );
  });

  // ── TC L3: invalid email format → throws INVALID_EMAIL (no Supabase call) ───
  it('L3 | invalid email format → throws INVALID_EMAIL without calling Supabase', async () => {
    // Act & Assert
    await expect(login('not-an-email', 'Password1!')).rejects.toThrow(
      'INVALID_EMAIL'
    );
    // Supabase should never be called for a format-invalid email
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  // ── TC L4: empty email string → throws INVALID_EMAIL ────────────────────────
  it('L4 | empty string email → throws INVALID_EMAIL', async () => {
    await expect(login('', 'Password1!')).rejects.toThrow('INVALID_EMAIL');
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  // ── TC L5: unregistered email → throws AUTH_FAILED ──────────────────────────
  it('L5 | unregistered email → throws AUTH_FAILED from Supabase', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {},
      error: { message: 'Invalid login credentials' },
    } as any);

    await expect(login('ghost@utdallas.edu', 'Password1!')).rejects.toThrow(
      'AUTH_FAILED'
    );
  });

  // ── TC L6: null email → throws INVALID_EMAIL ────────────────────────────────
  it('L6 | null email → throws INVALID_EMAIL', async () => {
    await expect(login(null, 'Password1!')).rejects.toThrow('INVALID_EMAIL');
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  // ── TC L7+L8 (merged): password too short or null → throws INVALID_PASSWORD ─
  it('L7 | password shorter than 8 chars → throws INVALID_PASSWORD', async () => {
    await expect(login('alice@utdallas.edu', 'short')).rejects.toThrow(
      'INVALID_PASSWORD'
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('L8 | null password → throws INVALID_PASSWORD', async () => {
    await expect(login('alice@utdallas.edu', null)).rejects.toThrow(
      'INVALID_PASSWORD'
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

// =============================================================================
// register(email, pw) : Student
// =============================================================================

describe('register()', () => {

  // ── TC R1: valid unique email + strong password → returns Student object ─────
  it('R1 | valid unique credentials → resolves with a Student object', async () => {
    // Arrange
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: {
        user: {
          id: 'uuid-001',
          email: 'newuser@utdallas.edu',
        },
      },
      error: null,
    } as any);

    // Act
    const student = await register('newuser@utdallas.edu', 'NewPass99!');

    // Assert — check every DCD Student field is present
    expect(student).toBeDefined();
    expect(student.studentId).toBe('uuid-001');
    expect(student.email).toBe('newuser@utdallas.edu');
    expect(typeof student.name).toBe('string');
    expect(typeof student.campus).toBe('string');
    expect(typeof student.major).toBe('string');
    expect(typeof student.bio).toBe('string');
    expect(typeof student.avatarUrl).toBe('string');
  });

  // ── TC R2: duplicate email → throws DUPLICATE_EMAIL ─────────────────────────
  it('R2 | duplicate email → throws DUPLICATE_EMAIL error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: {},
      error: { message: 'User already registered' },
    } as any);

    await expect(register('taken@utdallas.edu', 'NewPass99!')).rejects.toThrow(
      'DUPLICATE_EMAIL'
    );
  });

  // ── TC R3: invalid email format → throws INVALID_EMAIL ──────────────────────
  it('R3 | malformed email → throws INVALID_EMAIL without calling Supabase', async () => {
    await expect(register('bademail@@', 'NewPass99!')).rejects.toThrow(
      'INVALID_EMAIL'
    );
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  // ── TC R4: password too short → throws INVALID_PASSWORD ─────────────────────
  it('R4 | password shorter than 8 chars → throws INVALID_PASSWORD', async () => {
    await expect(register('newuser@utdallas.edu', 'short')).rejects.toThrow(
      'INVALID_PASSWORD'
    );
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  // ── TC R5: both null → throws INVALID_EMAIL (email checked first) ────────────
  it('R5 | null email and null password → throws INVALID_EMAIL', async () => {
    await expect(register(null, null)).rejects.toThrow('INVALID_EMAIL');
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });
});

// =============================================================================
// validateToken(token) : Boolean
// =============================================================================

describe('validateToken()', () => {

  // ── TC V1: valid active JWT → returns true ───────────────────────────────────
  it('V1 | valid non-expired token → resolves with true', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'uuid-001', email: 'alice@utdallas.edu' } },
      error: null,
    } as any);

    const result = await validateToken('valid.jwt.token');

    expect(result).toBe(true);
    expect(supabase.auth.getUser).toHaveBeenCalledWith('valid.jwt.token');
  });

  // ── TC V2: expired / invalid JWT → returns false ────────────────────────────
  it('V2 | expired or invalid token → resolves with false', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'JWT expired' },
    } as any);

    const result = await validateToken('expired.jwt.token');

    expect(result).toBe(false);
  });

  // ── TC V3: empty string token → returns false (no Supabase call) ─────────────
  it('V3 | empty string token → resolves with false without calling Supabase', async () => {
    const result = await validateToken('');

    expect(result).toBe(false);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  // ── TC V4: null token → returns false (no Supabase call) ────────────────────
  it('V4 | null token → resolves with false without calling Supabase', async () => {
    const result = await validateToken(null);

    expect(result).toBe(false);
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });
});

// =============================================================================
// isValidAuthId(authId) : boolean  [authService1.ts]
// =============================================================================

describe('isValidAuthId()', () => {
  it('A1 | non-empty id → true', () => {
    expect(isValidAuthId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('A2 | empty string → false', () => {
    expect(isValidAuthId('')).toBe(false);
  });

  it('A3 | whitespace-only → false', () => {
    expect(isValidAuthId('   ')).toBe(false);
  });

  it('A4 | null → false', () => {
    expect(isValidAuthId(null)).toBe(false);
  });

  it('A5 | undefined → false', () => {
    expect(isValidAuthId(undefined)).toBe(false);
  });
});

// =============================================================================
// logout(authId) : Boolean  [authService1.ts]
// =============================================================================

describe('logout()', () => {

  // ── TC O1: valid authId → returns true ──────────────────────────────────────
  it('O1 | valid authId → resolves with true', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any);

    const result = await logout('550e8400-e29b-41d4-a716-446655440000');

    expect(result).toBe(true);
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  // ── TC O2: empty authId → throws INVALID_AUTH_ID ────────────────────────────
  it('O2 | empty string authId → throws INVALID_AUTH_ID without calling Supabase', async () => {
    await expect(logout('')).rejects.toThrow('INVALID_AUTH_ID');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  // ── TC O3: null authId → throws INVALID_AUTH_ID ─────────────────────────────
  it('O3 | null authId → throws INVALID_AUTH_ID', async () => {
    await expect(logout(null)).rejects.toThrow('INVALID_AUTH_ID');
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  // ── TC O4: Supabase signOut error → throws LOGOUT_ERROR ─────────────────────
  it('O4 | Supabase signOut error → throws LOGOUT_ERROR', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
      error: { message: 'network' },
    } as any);

    await expect(logout('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
      'LOGOUT_ERROR',
    );
  });
});