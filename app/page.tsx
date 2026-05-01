import { Suspense } from 'react';

import LoginForm from '@/components/LoginForm';

export default function Page() {
  return (
    <Suspense fallback={<p style={{ padding: 28 }}>Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
