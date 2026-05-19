import { NextResponse } from 'next/server';
import { forwardGeocode } from '@/lib/geo/geocoding';
import { forwardGeocodeRequestSchema } from '@/lib/schemas/geo';

/**
 * POST /api/geo/search
 *
 * Body: { q: string, language?: string }
 * Returns the lat, lng and formatted address.
 */

export const runtime = 'edge';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = forwardGeocodeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await forwardGeocode(parsed.data.q, {
      language: parsed.data.language,
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown geocoding error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
