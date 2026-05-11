import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, AdminAuthError } from '@/lib/api/admin';
import { searchGooglePlaces } from '@/lib/imports/sources/google-places';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const bodySchema = z.object({
  place_ids: z.array(z.string()).min(1).max(50),
  query: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export async function POST(request: NextRequest) {
  let auth: { userId: string };
  try {
    auth = await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { place_ids, query, lat, lng, radius } = parsed.data;

  let allCandidates;
  try {
    allCandidates = await searchGooglePlaces({ query, lat, lng, radius, maxResults: 20 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }

  const selected = allCandidates.filter((c) => place_ids.includes(c.place_id));
  if (selected.length === 0) {
    return NextResponse.json({ error: 'No matching candidates found' }, { status: 400 });
  }

  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: job, error: jobError } = await db
    .from('import_jobs')
    .insert({
      source: 'google_places',
      query,
      bounds: lat != null ? { lat, lng, radius: radius ?? 5000 } : null,
      space_count: selected.length,
      created_by: auth.userId,
    })
    .select('id')
    .single();

  if (jobError) {
    return NextResponse.json({ error: jobError.message }, { status: 500 });
  }

  const rows = selected.map((c) => ({
    slug: `${slugify(c.name)}-${c.place_id.slice(-6)}`,
    title: c.name,
    type: c.type ?? 'storage',
    description: null as null,
    price_cents: 0,
    price_unit: 'month',
    currency: 'EUR',
    address: c.address,
    neighborhood: null as null,
    city: 'Barcelona',
    region: 'Catalunya',
    location: `SRID=4326;POINT(${c.lng} ${c.lat})`,
    amenities: [] as string[],
    photos: [] as string[],
    is_featured: false,
    status: 'pending',
    source: 'google_places',
    external_id: c.place_id,
    external_url: c.map_url,
    external_data: {
      google_types: c.google_types,
      phone: c.phone,
      website: c.website,
      rating: c.rating,
    },
    imported_at: new Date().toISOString(),
    imported_by: auth.userId,
    import_job_id: job.id,
    verified: false,
    phone: c.phone,
    web: c.website,
  }));

  const { data: spaces, error: spacesError } = await db
    .from('spaces')
    .upsert(rows, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, slug');

  if (spacesError) {
    return NextResponse.json({ error: spacesError.message }, { status: 500 });
  }

  return NextResponse.json({
    job_id: job.id,
    imported: spaces?.length ?? 0,
    slugs: spaces?.map((s) => s.slug) ?? [],
  });
}
