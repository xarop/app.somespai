'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import type { ReverseGeocodeResponse } from '@/lib/schemas/geo';

export type GeoAutofillResult = ReverseGeocodeResponse;

type GeoAutofillButtonProps = {
  /** Called with the parsed address on success. */
  onAutofill: (result: GeoAutofillResult) => void;
  /** Optional label overrides. */
  labels?: {
    button?: string;
    locating?: string;
    geocoding?: string;
  };
};

type Status =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'geocoding' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

export function GeoAutofillButton({ onAutofill, labels }: GeoAutofillButtonProps) {
  const locale = useLocale();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onClick = () => {
    if (!navigator.geolocation) {
      setStatus({ kind: 'error', message: 'Geolocation not supported' });
      return;
    }
    setStatus({ kind: 'locating' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus({ kind: 'geocoding' });
        try {
          const res = await fetch('/api/geo/reverse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              language: locale,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as GeoAutofillResult;
          onAutofill(data);
          setStatus({ kind: 'done' });
        } catch (err) {
          setStatus({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      },
      () => setStatus({ kind: 'error', message: 'Location denied or unavailable' }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const busy = status.kind === 'locating' || status.kind === 'geocoding';

  const buttonLabel =
    status.kind === 'locating'
      ? (labels?.locating ?? 'Getting location…')
      : status.kind === 'geocoding'
        ? (labels?.geocoding ?? 'Looking up address…')
        : (labels?.button ?? 'Fill from my location');

  return (
    <div className="geo-autofill" data-status={status.kind}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="geo-autofill__button"
        data-variant="ghost"
      >
        <span className="geo-autofill__icon" aria-hidden="true">📍</span>
        {buttonLabel}
      </button>
      {status.kind === 'error' && (
        <p className="geo-autofill__hint" role="alert">{status.message}</p>
      )}
    </div>
  );
}
