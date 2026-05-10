'use client';

import { useCallback, useState } from 'react';

/**
 * Promise-based wrapper around `navigator.geolocation.getCurrentPosition`,
 * with discriminated error codes that map cleanly to i18n keys.
 */

export type GeolocationErrorCode =
  | 'unsupported'
  | 'denied'
  | 'unavailable'
  | 'timeout';

export type GeolocationResult = {
  lat: number;
  lng: number;
  /** Accuracy in metres, as reported by the browser. */
  accuracy: number;
};

export type GeolocationException = Error & { code: GeolocationErrorCode };

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

function mapError(code: number): GeolocationErrorCode {
  switch (code) {
    case 1:
      return 'denied';
    case 2:
      return 'unavailable';
    case 3:
      return 'timeout';
    default:
      return 'unavailable';
  }
}

function makeError(code: GeolocationErrorCode): GeolocationException {
  const error = new Error(code) as GeolocationException;
  error.code = code;
  return error;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationErrorCode | null>(null);

  const request = useCallback(
    (options: PositionOptions = DEFAULT_OPTIONS) =>
      new Promise<GeolocationResult>((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          setError('unsupported');
          reject(makeError('unsupported'));
          return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLoading(false);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          (err) => {
            const code = mapError(err.code);
            setLoading(false);
            setError(code);
            reject(makeError(code));
          },
          options,
        );
      }),
    [],
  );

  return { request, loading, error };
}
