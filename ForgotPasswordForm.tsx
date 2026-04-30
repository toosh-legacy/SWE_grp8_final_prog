/**
 * ForgotPasswordForm.tsx — Campus Connect
 * Request a Supabase Auth password-reset email (split layout aligned with RegisterForm).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [authError, setAuthError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setAuthError('');

    if (!email.trim()) {
      setErrors({ email: 'Email is required.' });
      return;
    }
    if (!isValidEmail(email)) {
      setErrors({ email: 'Please enter a valid email address.' });
      return;
    }
    setErrors({});

    const origin =
      typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
    if (!origin) {
      setAuthError('Cannot send reset email in this environment.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/login`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      const message = (err as Error).message ?? '';
      if (
        message.includes('Supabase is not configured') ||
        message.includes('VITE_SUPABASE')
      ) {
        setAuthError(
          'Cannot send email until Supabase is configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
        );
      } else {
        setAuthError(message || 'Could not send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <div className="register-marketing">
        <div className="brand-pill brand-pill-register">Campus Connect</div>
        <p className="marketing-copy marketing-copy-register">
          Connect with friends and other students. Be part of study groups to help you get
          through your courses.
        </p>
      </div>

      <div className="register-card">
        <div className="register-header">
          <h1 className="app-title register-title">Forgot password</h1>
        </div>

        <p className="auth-form-helper">
          Enter the email for your account. We will send a link you can use to reset your password.
        </p>

        {sent && (
          <div className="success-banner" role="status">
            If an account exists for that email, we have sent instructions to reset your password.
          </div>
        )}

        {!sent && authError && (
          <div className="error-banner" role="alert">
            {authError}
          </div>
        )}

        {!sent ? (
          <form onSubmit={(e) => void handleSubmit(e)} noValidate>
            <div className="form-group">
              <label htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Value"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'fp-email-error' : undefined}
              />
              {errors.email && (
                <span id="fp-email-error" className="field-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="register-actions">
              <Link to="/login" className="btn btn-return">
                Return
              </Link>
              <button type="submit" className="btn btn-confirm" disabled={loading}>
                {loading ? 'Sending…' : 'Confirm'}
              </button>
            </div>
          </form>
        ) : (
          <div className="register-actions">
            <Link to="/login" className="btn btn-return">
              Return to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
