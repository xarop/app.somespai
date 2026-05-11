export type PlaceCandidate = {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'storage' | 'workspace' | 'garden' | 'room' | 'parking' | null;
  google_types: string[];
  phone: string | null;
  website: string | null;
  rating: number | null;
  map_url: string;
};

// Types as returned by the Google Places API (New / v1)
const PARKING_TYPES = ['parking', 'parking_lot'];
const STORAGE_TYPES = ['storage', 'self_storage_facility', 'moving_and_storage_service'];
const WORKSPACE_TYPES = ['coworking_space'];
const GARDEN_TYPES = ['park', 'botanical_garden', 'nature_reserve', 'garden'];
// Google Places has no good "room to rent" type; apartment_building is the closest hint
const ROOM_TYPES = ['apartment_building', 'apartment_complex'];

function mapGoogleType(types: string[]): PlaceCandidate['type'] {
  if (types.some((t) => PARKING_TYPES.includes(t))) return 'parking';
  if (types.some((t) => STORAGE_TYPES.includes(t))) return 'storage';
  if (types.some((t) => WORKSPACE_TYPES.includes(t))) return 'workspace';
  if (types.some((t) => GARDEN_TYPES.includes(t))) return 'garden';
  if (types.some((t) => ROOM_TYPES.includes(t))) return 'room';
  return null;
}

export async function searchGooglePlaces(params: {
  query: string;
  lat?: number;
  lng?: number;
  radius?: number;
  maxResults?: number;
}): Promise<PlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');

  const body: Record<string, unknown> = {
    textQuery: params.query,
    maxResultCount: Math.min(params.maxResults ?? 20, 20),
    languageCode: 'ca',
  };

  if (params.lat != null && params.lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: params.lat, longitude: params.lng },
        radius: params.radius ?? 5000,
      },
    };
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.types',
    'places.nationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
  ].join(',');

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { places?: unknown[] };
  const places = (data.places ?? []) as Array<{
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    types?: string[];
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
  }>;

  return places.map((p) => ({
    place_id: p.id,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    type: mapGoogleType(p.types ?? []),
    google_types: p.types ?? [],
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    rating: p.rating ?? null,
    map_url: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
  }));
}

export async function fetchGooglePlace(placeId: string): Promise<{
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  phone: string | null;
  website: string | null;
  rating: number | null;
} | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured');

  const fieldMask =
    'displayName,formattedAddress,location,types,nationalPhoneNumber,websiteUri,rating';

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
  });

  if (!res.ok) return null;

  const p = (await res.json()) as {
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    types?: string[];
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
  };

  return {
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
    types: p.types ?? [],
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    rating: p.rating ?? null,
  };
}
