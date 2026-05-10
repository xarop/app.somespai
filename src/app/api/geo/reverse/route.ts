import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geo/geocoding';
import { reverseGeocodeRequestSchema } from '@/lib/schemas/geo';

/**
 * POST /api/geo/reverse
 *
 * Body: { lat: number, lng: number, language?: string }
 * Returns the parsed address (see `ReverseGeocodeResponse`).
 *
 * Backed by Nominatim (OpenStreetMap) — no API key required. To swap
 * providers later (MapTiler, Photon, self-hosted Nominatim, …), only
 * `lib/geo/geocoding.ts` needs to change; this route stays the same.
 */

export const runtime = 'edge';

export async function POST(request: Request) {
  // ---------------------------------------------------------------------------
  // TODO: Gate to authenticated users to prevent anonymous abuse of the API key.
  // Use the same Supabase server client you use elsewhere, e.g.:
  //
  //   const supabase = await createServerClient();
  //   const { data: { user } } = await supabase.auth.getUser();
  //   if (!user) {
  //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //   }
  //
  // The `publica` form already requires auth, so this is a defence-in-depth
  // measure for the API surface itself.
  // ---------------------------------------------------------------------------

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = reverseGeocodeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await reverseGeocode(parsed.data.lat, parsed.data.lng, {
      language: parsed.data.language,
    });

    return NextResponse.json(result, {
      headers: {
        // Identical lat/lng + language → same answer for hours; let the CDN help.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown geocoding error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
