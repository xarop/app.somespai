import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, AdminAuthError } from '@/lib/api/admin';
import { searchGooglePlaces } from '@/lib/imports/sources/google-places';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const bodySchema = z.object({
  query: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  radius: z.number().optional(),
  maxResults: z.number().int().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
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

  let candidates;
  try {
    candidates = await searchGooglePlaces(parsed.data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }

  // Mark which place_ids already exist in DB
  const placeIds = candidates.map((c) => c.place_id);
  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: existing } = await db
    .from('spaces')
    .select('external_id')
    .eq('source', 'google_places')
    .in('external_id', placeIds);

  const existingSet = new Set((existing ?? []).map((r) => r.external_id));

  return NextResponse.json({
    candidates: candidates.map((c) => ({
      ...c,
      already_imported: existingSet.has(c.place_id),
    })),
  });
}
