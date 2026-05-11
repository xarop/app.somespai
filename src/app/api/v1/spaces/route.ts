import { type NextRequest } from 'next/server';
import { spacesQuerySchema, apiError } from '@/lib/schemas/api/spaces';
import { requireApiKey, requireScope, ApiAuthError } from '@/lib/api/auth';
import { searchSpaces, parseQuery } from '@/lib/spaces/search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let auth: Awaited<ReturnType<typeof requireApiKey>>;
  try {
    auth = await requireApiKey(req);
    requireScope(auth, 'spaces:read');
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return apiError(
        err.code as Parameters<typeof apiError>[0],
        err.message,
        err.status,
      );
    }
    throw err;
  }

  // ── Params ────────────────────────────────────────────────────────────────
  const sp = req.nextUrl.searchParams;
  const raw = Object.fromEntries(sp.entries());
  const parsed = spacesQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return apiError('INVALID_PARAMS', 'Invalid query parameters', 400, {
      issues: parsed.error.issues,
    });
  }

  const q = parsed.data;

  if (q.sort === 'distance' && !q.near) {
    return apiError(
      'INVALID_PARAMS',
      'sort=distance requires the `near` parameter',
      400,
    );
  }
  if (q.bbox && q.near) {
    return apiError(
      'INVALID_PARAMS',
      '`bbox` and `near` are mutually exclusive',
      400,
    );
  }

  // ── Search ────────────────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof searchSpaces>>;
  try {
    result = await searchSpaces(
      parseQuery({
        types: q.type ?? null,
        priceMin: q.price_min ?? null,
        priceMax: q.price_max ?? null,
        priceUnit: q.price_unit ?? null,
        sizeMin: q.size_min_m2 ?? null,
        sizeMax: q.size_max_m2 ?? null,
        city: q.city ?? null,
        neighborhood: q.neighborhood ?? null,
        amenities: q.amenities ?? null,
        q: q.q ?? null,
        bbox: q.bbox ?? null,
        near: q.near ?? null,
        radius: q.radius,
        sort: q.sort,
        limit: q.limit,
        cursor: q.cursor ?? null,
      }),
    );
  } catch (err) {
    console.error('[API v1 /spaces] upstream error:', err);
    return apiError('UPSTREAM_ERROR', 'Database error', 502);
  }

  // ── Response ──────────────────────────────────────────────────────────────
  const body = JSON.stringify({
    data: result.items,
    pagination: {
      next_cursor: result.nextCursor,
      limit: q.limit,
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
