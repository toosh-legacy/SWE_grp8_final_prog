/**
 * LoginForm.tsx — Campus Connect
 * Authentication UI Component
 *
 * Handles:
 *   - Email/Password login  (calls authService.login)
 *   - Google OAuth login    (Supabase OAuth)
 *   - Discord OAuth login   (Supabase OAuth)
 *   - Link to registration page
 *
 * Aligned with the Login use case sequence diagram (Tushaar's diagram):
 *   LoginGUI → LoginController → DBMgr → User
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { supabase } from '../supabaseClient';

// ─── Validation (mirrors authService.ts guards for instant UI feedback) ────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidPassword(password: string): boolean {
  return String(password).length >= 8;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormErrors {
  email?: string;
  password?: string;
}

type OAuthProvider = 'google' | 'discord';

// ─── Component ─────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail]       = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // UI state
  const [errors, setErrors]       = useState<FormErrors>({});  // field-level errors
  const [authError, setAuthError] = useState<string>('');      // server-level error
  const [loading, setLoading]     = useState<boolean>(false);

  // ── Field-level validation ──────────────────────────────────────────────────

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    return newErrors;
  }

  // ── Email / Password submit ─────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setAuthError('');

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      const message = (err as Error).message;
      // Surface a user-friendly message
      if (message.includes('AUTH_FAILED')) {
        setAuthError('Incorrect email or password. Please try again.');
      } else if (message.includes('INVALID_EMAIL')) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      } else if (message.includes('INVALID_PASSWORD')) {
        setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters.' }));
      } else {
        setAuthError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── OAuth ───────────────────────────────────────────────────────────────────

  async function handleOAuth(provider: OAuthProvider): Promise<void> {
    setAuthError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,                              // 'google' | 'discord'
        options: { redirectTo: `${window.location.origin}/home` },
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(`OAuth login failed: ${(err as Error).message}`);
      setLoading(false);
    }
    // On success Supabase redirects the browser — no further action needed here
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <h1 className="app-title">Campus Connect</h1>
          <p className="app-subtitle">Sign in to your account</p>
        </div>

        {/* Server-level auth error banner */}
        {authError && (
          <div className="error-banner" role="alert">
            {authError}
          </div>
        )}

        {/* Email / Password form */}
        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" className="field-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <span id="password-error" className="field-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Log In'}
          </button>

        </form>

        {/* Divider */}
        <div className="divider">
          <span>or continue with</span>
        </div>

        {/* OAuth buttons */}
        <div className="oauth-buttons">
          <button
            type="button"
            className="btn btn-oauth btn-google"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            aria-label="Sign in with Google"
          >
            <GoogleIcon />
            Google
          </button>

          <button
            type="button"
            className="btn btn-oauth btn-discord"
            onClick={() => handleOAuth('discord')}
            disabled={loading}
            aria-label="Sign in with Discord"
          >
            <DiscordIcon />
            Discord
          </button>
        </div>

        {/* Register link */}
        <p className="register-link">
          Don't have an account?{' '}
          <a href="/register">Sign up</a>
        </p>

      </div>
    </div>
  );
}

// ─── SVG Icon helpers (inline, no external dependency) ─────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}
