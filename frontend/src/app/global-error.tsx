'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
          <p style={{ color: '#374151' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
