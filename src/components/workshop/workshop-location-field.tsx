'use client';

import { useEffect, useRef, useState } from 'react';

const copy = {
  ca: {
    label: 'Ubicació',
    placeholder: 'Barcelona, Gràcia, adreça…',
    current: 'La meva ubicació',
    useCurrent: 'Utilitza la meva ubicació',
    unavailable: 'No hem pogut obtenir la ubicació. Pots escriure una ciutat o zona.',
  },
  es: {
    label: 'Ubicación',
    placeholder: 'Barcelona, Gràcia, dirección…',
    current: 'Mi ubicación',
    useCurrent: 'Usar mi ubicación',
    unavailable: 'No hemos podido obtener la ubicación. Puedes escribir una ciudad o zona.',
  },
  en: {
    label: 'Location',
    placeholder: 'Barcelona, Gràcia, address…',
    current: 'My location',
    useCurrent: 'Use my location',
    unavailable: 'We could not get your location. You can enter a city or area.',
  },
} as const;

interface WorkshopLocationFieldProps {
  locale: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export function WorkshopLocationField({
  locale,
  location,
  latitude,
  longitude,
}: WorkshopLocationFieldProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const [query, setQuery] = useState(location || 'Barcelona');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { latitude: latitude!, longitude: longitude! }
      : null,
  );
  const [error, setError] = useState('');
  const requestedLocation = useRef(false);

  function locate() {
    if (!navigator.geolocation) {
      setError(text.unavailable);
      return;
    }
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setQuery(text.current);
        const url = new URL(window.location.href);
        url.searchParams.set('location', text.current);
        url.searchParams.set('latitude', String(coords.latitude));
        url.searchParams.set('longitude', String(coords.longitude));
        window.location.assign(url);
      },
      () => {
        setCoordinates(null);
        setError(text.unavailable);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  useEffect(() => {
    if (
      !requestedLocation.current &&
      !location &&
      latitude === undefined &&
      longitude === undefined
    ) {
      requestedLocation.current = true;
      locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <label>
      <span>{text.label}</span>
      <div className="workshop-location-field">
        <input
          name="location"
          value={query}
          placeholder={text.placeholder}
          maxLength={120}
          onChange={(event) => {
            setQuery(event.target.value);
            setCoordinates(null);
          }}
        />
        <input type="hidden" name="latitude" value={coordinates?.latitude ?? ''} />
        <input type="hidden" name="longitude" value={coordinates?.longitude ?? ''} />
        <button className="workshop-button" type="button" onClick={locate}>
          {text.useCurrent}
        </button>
      </div>
      {error && <span className="workshop-location-field__error" role="status">{error}</span>}
    </label>
  );
}
