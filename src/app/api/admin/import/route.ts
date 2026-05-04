import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const importRowSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['storage', 'workspace', 'garden', 'room']),
  description: z.string().nullable().optional(),
  price_cents: z.number().int().nonnegative(),
  price_unit: z.enum(['month', 'day', 'hour']).default('month'),
  size_m2: z.number().nonnegative().nullable().optional(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().default('Vila de Gràcia'),
  city: z.string().default('Barcelona'),
  lat: z.number(),
  lng: z.number(),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  contact_url: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'removed']).default('active'),
});

export async function POST(request: NextRequest) {
  // Require service role key in Authorization header
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/, '');
  if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected array of spaces' }, { status: 400 });
  }

  const rows = [];
  const errors = [];
  for (let i = 0; i < body.length; i++) {
    const parsed = importRowSchema.safeParse(body[i]);
    if (!parsed.success) {
      errors.push({ index: i, issues: parsed.error.issues });
    } else {
      const r = parsed.data;
      rows.push({
        slug: r.slug,
        title: r.title,
        type: r.type,
        description: r.description ?? null,
        price_cents: r.price_cents,
        price_unit: r.price_unit,
        size_m2: r.size_m2 ?? null,
        address: r.address ?? null,
        neighborhood: r.neighborhood,
        city: r.city,
        region: 'Catalunya',
        location: `SRID=4326;POINT(${r.lng} ${r.lat})`,
        amenities: r.amenities,
        photos: r.photos,
        is_featured: r.is_featured,
        contact_url: r.contact_url ?? null,
        status: r.status,
      });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data, error } = await supabase
    .from('spaces')
    .upsert(rows, { onConflict: 'slug' })
    .select('slug');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: data?.length ?? 0, slugs: data?.map(r => r.slug) });
}
