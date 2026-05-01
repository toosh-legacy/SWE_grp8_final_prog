import { Suspense } from 'react';

import LoginForm from '@/components/LoginForm';

/** Same UI as `/` — supports direct links to `/login`. */

export default function LoginPage() {
  return (
    <Suspense fallback={<p style={{ padding: 28 }}>Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
