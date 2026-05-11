import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { ParsedSpacesQuery, SpaceItem } from '@/lib/schemas/api/spaces';
import { encodeCursor, decodeCursor } from './cursor';

export { decodeCursor } from './cursor';

type SearchRow = {
  id: string;
  slug: string;
  type: string;
  title: string;
  description: string | null;
  price_cents: number;
  price_unit: string;
  currency: string;
  size_m2: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  region: string | null;
  photos: string[];
  amenities: string[];
  is_featured: boolean;
  rating: number;
  reviews_count: number;
  lat: number;
  lng: number;
  distance_m: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  owner_name: string | null;
  owner_avatar: string | null;
};

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}


export async function searchSpaces(
  query: ParsedSpacesQuery,
): Promise<{ items: SpaceItem[]; nextCursor: string | null }> {
  const db = adminClient();

  const { data, error } = await db.rpc('v1_search_spaces', {
    p_types:        query.types,
    p_price_min:    query.priceMin,
    p_price_max:    query.priceMax,
    p_price_unit:   query.priceUnit,
    p_size_min:     query.sizeMin,
    p_size_max:     query.sizeMax,
    p_city:         query.city,
    p_neighborhood: query.neighborhood,
    p_amenities:    query.amenities,
    p_q:            query.q,
    p_bbox:         query.bbox,
    p_near_lat:     query.nearLat,
    p_near_lng:     query.nearLng,
    p_radius:       query.radius,
    p_sort:         query.sort,
    p_limit:        query.limit + 1,  // fetch one extra to detect next page
    p_cursor_at:    query.cursorAt,
    p_cursor_id:    query.cursorId,
  });

  if (error) throw error;

  const rows = (data ?? []) as SearchRow[];
  const hasMore = rows.length > query.limit;
  const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

  const lastRow = pageRows.at(-1);
  const nextCursor =
    hasMore && lastRow
      ? encodeCursor(lastRow.created_at, lastRow.id)
      : null;

  const items: SpaceItem[] = pageRows.map((r) => ({
    id: r.id,
    slug: r.slug,
    type: r.type,
    title: r.title,
    description: r.description,
    price: {
      cents: r.price_cents,
      unit: r.price_unit,
      currency: r.currency,
    },
    size_m2: r.size_m2,
    address: r.address,
    neighborhood: r.neighborhood,
    city: r.city,
    region: r.region,
    location: { lat: r.lat, lng: r.lng },
    distance_m: r.distance_m,
    photos: r.photos ?? [],
    amenities: r.amenities ?? [],
    owner: r.owner_id
      ? { id: r.owner_id, display_name: r.owner_name, avatar_url: r.owner_avatar }
      : null,
    rating: { average: r.rating, count: r.reviews_count },
    published_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return { items, nextCursor };
}

export function parseQuery(raw: {
  types?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceUnit?: string | null;
  sizeMin?: number | null;
  sizeMax?: number | null;
  city?: string | null;
  neighborhood?: string | null;
  amenities?: string | null;
  q?: string | null;
  bbox?: string | null;
  near?: string | null;
  radius: number;
  sort: string;
  limit: number;
  cursor?: string | null;
}): ParsedSpacesQuery {
  const csvOrNull = (v?: string | null) =>
    v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null;

  let bbox: ParsedSpacesQuery['bbox'] = null;
  if (raw.bbox) {
    const parts = raw.bbox.split(',').map(Number);
    if (parts.length === 4 && parts.every(isFinite)) {
      bbox = [parts[0], parts[1], parts[2], parts[3]];
    }
  }

  let nearLat: number | null = null;
  let nearLng: number | null = null;
  if (raw.near) {
    const [lat, lng] = raw.near.split(',').map(Number);
    if (isFinite(lat) && isFinite(lng)) {
      nearLat = lat;
      nearLng = lng;
    }
  }

  const cursor = raw.cursor ? decodeCursor(raw.cursor) : null;

  return {
    types: csvOrNull(raw.types),
    priceMin: raw.priceMin ?? null,
    priceMax: raw.priceMax ?? null,
    priceUnit: raw.priceUnit ?? null,
    sizeMin: raw.sizeMin ?? null,
    sizeMax: raw.sizeMax ?? null,
    city: raw.city ?? null,
    neighborhood: raw.neighborhood ?? null,
    amenities: csvOrNull(raw.amenities),
    q: raw.q ?? null,
    bbox,
    nearLat,
    nearLng,
    radius: raw.radius,
    sort: raw.sort as ParsedSpacesQuery['sort'],
    limit: raw.limit,
    cursorAt: cursor?.at ?? null,
    cursorId: cursor?.id ?? null,
  };
}
