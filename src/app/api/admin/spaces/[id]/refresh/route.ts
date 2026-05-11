import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, AdminAuthError } from '@/lib/api/admin';
import { fetchGooglePlace } from '@/lib/imports/sources/google-places';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: space, error: fetchError } = await db
    .from('spaces')
    .select('source, external_id')
    .eq('id', id)
    .single();

  if (fetchError || !space) {
    return NextResponse.json({ error: 'Space not found' }, { status: 404 });
  }

  if (space.source !== 'google_places' || !space.external_id) {
    return NextResponse.json({ error: 'Space has no Google Places source' }, { status: 400 });
  }

  const place = await fetchGooglePlace(space.external_id);
  if (!place) {
    return NextResponse.json({ error: 'Google Places lookup failed' }, { status: 502 });
  }

  const { error: updateError } = await db
    .from('spaces')
    .update({
      title: place.name,
      address: place.address,
      location: `SRID=4326;POINT(${place.lng} ${place.lat})`,
      phone: place.phone,
      web: place.website,
      external_data: {
        google_types: place.types,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
      },
      last_refreshed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
