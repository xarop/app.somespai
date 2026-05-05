'use client';

import { useEffect } from 'react';

export default function SpaceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[SpaceDetail] Error:', error.message, error.digest);
  }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>No s&apos;ha pogut carregar l&apos;espai</h2>
      <p style={{ color: 'var(--ink-mute)', marginTop: '0.5rem' }}>
        {error.digest ? `Error: ${error.digest}` : 'Intenta-ho de nou.'}
      </p>
      <button
        onClick={reset}
        style={{ marginTop: '1rem' }}
        data-variant="ghost"
      >
        Torna a intentar
      </button>
    </div>
  );
}
