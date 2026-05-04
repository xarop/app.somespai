import { createClient } from './server';
import type { Space } from '@/lib/schemas/space';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSpace(row: Record<string, any>): Space {
  return {
    id: row.id,
    slug: row.slug,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? null,
    type: row.type,
    priceCents: row.price_cents,
    currency: row.currency ?? 'EUR',
    sizeM2: row.size_m2 ?? null,
    address: row.address ?? null,
    neighborhood: row.neighborhood ?? 'Vila de Gràcia',
    city: row.city ?? 'Barcelona',
    region: row.region ?? 'Catalunya',
    lat: row.lat,
    lng: row.lng,
    amenities: row.amenities ?? [],
    photos: row.photos ?? [],
    isFeatured: row.is_featured ?? false,
    rating: Number(row.rating ?? 0),
    reviewsCount: row.reviews_count ?? 0,
    status: row.status ?? 'active',
    priceUnit: row.price_unit ?? 'month',
    contactUrl: row.contact_url ?? null,
  };
}

/** Fetch all active spaces ordered by featured first. */
export async function getSpaces(): Promise<Space[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('status', 'active')
    .order('is_featured', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSpace);
}

/** Fetch a single active space by slug. Returns null if not found. */
export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToSpace(data) : null;
}

/** Fetch all active slugs (used for static param generation). */
export async function getAllSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('slug')
    .eq('status', 'active');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.slug as string);
}
