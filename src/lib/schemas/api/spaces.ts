import { z } from 'zod';

// ── Request ───────────────────────────────────────────────────────────────

export const spacesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Geo (mutually exclusive: use bbox OR near+radius)
  bbox: z.string().optional(),    // "lng_min,lat_min,lng_max,lat_max"
  near: z.string().optional(),    // "lat,lng"
  radius: z.coerce.number().positive().default(5000),

  // Facets
  type: z.string().optional(),        // comma-separated: storage,workspace,...
  price_min: z.coerce.number().int().nonnegative().optional(),
  price_max: z.coerce.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  price_unit: z.enum(['month', 'day', 'hour']).optional(),
  size_min_m2: z.coerce.number().nonnegative().optional(),
  size_max_m2: z.coerce.number().nonnegative().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  country: z.string().optional(),
  amenities: z.string().optional(),   // comma-separated
  q: z.string().optional(),

  sort: z.enum(['distance', 'price_asc', 'price_desc', 'newest', 'featured'])
    .default('featured'),
});

export type SpacesQuery = z.infer<typeof spacesQuerySchema>;

// ── Parsed query (after splitting csv params) ─────────────────────────────

export type ParsedSpacesQuery = {
  types: string[] | null;
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: string | null;
  sizeMin: number | null;
  sizeMax: number | null;
  city: string | null;
  neighborhood: string | null;
  amenities: string[] | null;
  q: string | null;
  bbox: [number, number, number, number] | null;  // [lng_min, lat_min, lng_max, lat_max]
  nearLat: number | null;
  nearLng: number | null;
  radius: number;
  sort: SpacesQuery['sort'];
  limit: number;
  cursorAt: string | null;    // ISO timestamp
  cursorId: string | null;    // UUID
};

// ── Response ──────────────────────────────────────────────────────────────

export const spaceItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.object({
    cents: z.number(),
    unit: z.string(),
    currency: z.string(),
  }),
  size_m2: z.number().nullable(),
  address: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  location: z.object({ lat: z.number(), lng: z.number() }),
  distance_m: z.number().nullable(),
  photos: z.array(z.string()),
  amenities: z.array(z.string()),
  owner: z.object({
    id: z.string(),
    display_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
  }).nullable(),
  rating: z.object({ average: z.number(), count: z.number() }),
  published_at: z.string(),
  updated_at: z.string(),
});

export type SpaceItem = z.infer<typeof spaceItemSchema>;

export const spacesResponseSchema = z.object({
  data: z.array(spaceItemSchema),
  pagination: z.object({
    next_cursor: z.string().nullable(),
    limit: z.number(),
  }),
});

export type SpacesResponse = z.infer<typeof spacesResponseSchema>;

// ── Error ─────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'INVALID_PARAMS'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR';

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
): Response {
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}
