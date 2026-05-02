'use client';

/**
 * RegisterForm.tsx — Campus Connect
 * Create Account page (split layout aligned with LoginForm).
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { register } from '@/login';
import { supabase } from '@/supabaseClient';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidPassword(password: string): boolean {
  return String(password).length >= 8;
}

interface FieldErrors {
  username?: string;
  campus?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

const CAMPUSES = [
  'UT Dallas',
  'UT Arlington',
  'UT Austin',
  'Texas A&M',
  'Other',
];

export default function RegisterForm() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [campus, setCampus] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};

    if (!username.trim()) {
      next.username = 'Username is required.';
    }

    if (!campus) {
      next.campus = 'Please select a campus.';
    }

    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!isValidEmail(email)) {
      next.email = 'Please enter a valid email address.';
    }

    if (!password) {
      next.password = 'Password is required.';
    } else if (!isValidPassword(password)) {
      next.password = 'Password must be at least 8 characters.';
    }

    if (!passwordConfirm) {
      next.passwordConfirm = 'Please re-enter your password.';
    } else if (password !== passwordConfirm) {
      next.passwordConfirm = 'Passwords do not match.';
    }

    return next;
  }

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
      await register(email, password, {
        username: username.trim(),
        campus,
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/home');
      } else {
        router.push('/login?registered=1');
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('DUPLICATE_EMAIL')) {
        setAuthError('An account with this email already exists.');
      } else if (message.includes('INVALID_EMAIL')) {
        setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address.' }));
      } else if (message.includes('INVALID_PASSWORD')) {
        setErrors((prev) => ({
          ...prev,
          password: 'Password must be at least 8 characters.',
        }));
      } else if (
        message.includes('Supabase is not configured') ||
        message.includes('NEXT_PUBLIC_SUPABASE')
      ) {
        setAuthError(
          'Cannot create an account until Supabase is configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
        );
      } else {
        setAuthError('Something went wrong. Please try again later.');
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
          <h1 className="app-title register-title">Create Account</h1>
        </div>

        {authError && (
          <div className="error-banner" role="alert">
            {authError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className="form-group">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Value"
              autoComplete="username"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'reg-username-error' : undefined}
            />
            {errors.username && (
              <span id="reg-username-error" className="field-error" role="alert">
                {errors.username}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-campus">Campus</label>
            <div className="select-wrap">
              <select
                id="reg-campus"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                aria-invalid={!!errors.campus}
                aria-describedby={errors.campus ? 'reg-campus-error' : undefined}
              >
                <option value="">Select campus</option>
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {errors.campus && (
              <span id="reg-campus-error" className="field-error" role="alert">
                {errors.campus}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Value"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
            />
            {errors.email && (
              <span id="reg-email-error" className="field-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Value"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
            />
            {errors.password && (
              <span id="reg-password-error" className="field-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password-confirm">Re-enter Password</label>
            <input
              id="reg-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Value"
              autoComplete="new-password"
              aria-invalid={!!errors.passwordConfirm}
              aria-describedby={
                errors.passwordConfirm ? 'reg-password-confirm-error' : undefined
              }
            />
            {errors.passwordConfirm && (
              <span id="reg-password-confirm-error" className="field-error" role="alert">
                {errors.passwordConfirm}
              </span>
            )}
          </div>

          <div className="register-actions">
            <Link href="/login" className="btn btn-return">
              Return
            </Link>
            <button type="submit" className="btn btn-confirm" disabled={loading}>
              {loading ? 'Creating…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
