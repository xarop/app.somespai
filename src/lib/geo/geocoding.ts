/**
 * Reverse geocoding via Nominatim (OpenStreetMap).
 *
 * Docs:           https://nominatim.org/release-docs/latest/api/Reverse/
 * Usage policy:   https://operations.osmfoundation.org/policies/nominatim/
 *
 * Why Nominatim:
 *   - Fully open-source, no API key, no vendor lock-in (matches §2).
 *   - For low-volume use cases (one call per space submission) the public
 *     instance is comfortably within the 1 req/sec policy.
 *
 * If volume grows (e.g. as-you-type autocomplete), swap the implementation
 * for MapTiler Geocoding — keep this file's exported signature identical and
 * `route.ts` won't change. MapTiler is already mentioned in AGENTS.md §2 as
 * an option for map tiles, so reusing the same key is the natural upgrade.
 */

import 'server-only';

export type GeocodeAddress = {
  /** Full formatted address as returned by the provider. */
  formatted: string;
  /** Street name + number (e.g. "Carrer Gran de Gràcia, 132"). */
  street: string;
  /** Neighborhood / suburb (e.g. "Vila de Gràcia"). */
  neighborhood: string;
  /** City / locality (e.g. "Barcelona"). */
  city: string;
  /** Province / county (e.g. "Barcelonès"). */
  province: string;
  /** Region / state (e.g. "Catalunya"). */
  region: string;
  /** Country (e.g. "España"). */
  country: string;
  /** Postal code. */
  postalCode: string;
  /** Provider-specific place identifier (kept as string for portability). */
  placeId: string;
  /** Latitude returned by the provider (may differ slightly from input). */
  lat: number;
  /** Longitude returned by the provider (may differ slightly from input). */
  lng: number;
};

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  cycleway?: string;
  path?: string;
  house_number?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  borough?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
};

type NominatimResponse = {
  place_id?: number | string;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
  error?: string | { code: number; message: string };
};

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

/**
 * The Nominatim usage policy *requires* a meaningful User-Agent that
 * identifies the application. Override via env var if you self-host.
 */
const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  'somespai/1.0 (https://app.somespai.net; contact: somespai@xarop.com)';

const NOMINATIM_BASE_URL =
  process.env.NOMINATIM_BASE_URL ?? NOMINATIM_ENDPOINT;

function pick(...values: Array<string | undefined>): string {
  for (const v of values) if (v) return v;
  return '';
}

function parseNominatim(data: NominatimResponse): GeocodeAddress {
  const a = data.address ?? {};

  const route = pick(
    a.road,
    a.pedestrian,
    a.footway,
    a.cycleway,
    a.path,
  );
  const number = a.house_number ?? '';
  const street = route ? (number ? `${route}, ${number}` : route) : '';

  return {
    formatted: data.display_name ?? '',
    street,
    neighborhood: pick(
      a.suburb,
      a.neighbourhood,
      a.quarter,
      a.city_district,
      a.borough,
    ),
    city: pick(a.city, a.town, a.village, a.municipality),
    province: pick(a.county, a.state_district),
    region: a.state ?? '',
    country: a.country ?? '',
    postalCode: a.postcode ?? '',
    placeId: String(data.place_id ?? ''),
    lat: data.lat ? parseFloat(data.lat) : NaN,
    lng: data.lon ? parseFloat(data.lon) : NaN,
  };
}

export type ReverseGeocodeOptions = {
  /** BCP-47 language code (e.g. "ca", "es", "en") — passed via Accept-Language. */
  language?: string;
  /** Pass an AbortSignal to cancel the request. */
  signal?: AbortSignal;
};

/**
 * Reverse geocode a point (lat/lng) into a structured address.
 *
 * Throws if Nominatim returns an error or the response is unusable.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  options: ReverseGeocodeOptions = {},
): Promise<GeocodeAddress> {
  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('addressdetails', '1');
  // Bias towards street-level results (zoom 18 ≈ "building").
  url.searchParams.set('zoom', '18');

  const language = options.language ?? 'ca';

  const response = await fetch(url, {
    signal: options.signal,
    headers: {
      // Required by the Nominatim ToS.
      'User-Agent': USER_AGENT,
      // Locale-aware results (Catalan first, then Spanish/English fallback).
      'Accept-Language': `${language},ca;q=0.9,es;q=0.8,en;q=0.5`,
    },
    // Reverse geocoding is stable per coordinate — cache aggressively.
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }

  const data = (await response.json()) as NominatimResponse;

  if (data.error) {
    const message =
      typeof data.error === 'string' ? data.error : data.error.message;
    throw new Error(`Nominatim error: ${message}`);
  }

  if (!data.lat || !data.lon) {
    throw new Error('No geocoding results for this location');
  }

  return parseNominatim(data);
}
