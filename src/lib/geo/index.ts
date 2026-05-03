/**
 * Haversine distance between two points (meters).
 * For database filtering use PostGIS ST_DWithin instead — this is for
 * client-side display only (e.g. "230 m from you").
 */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Format a distance for display, locale-aware. */
export function formatDistance(meters: number, locale = 'ca'): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(km) + ' km';
}

/** Slugify a string for URLs. Diacritic-aware. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
