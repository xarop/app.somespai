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
    priceCents: row.price_cents ?? 0,
    currency: row.currency ?? 'EUR',
    sizeM2: row.size_m2 ?? null,
    address: row.address ?? null,
    neighborhood: row.neighborhood ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    amenities: row.amenities ?? [],
    photos: row.photos ?? [],
    isFeatured: row.is_featured ?? false,
    rating: Number(row.rating ?? 0),
    reviewsCount: row.reviews_count ?? 0,
    status: row.status ?? 'active',
    priceUnit: row.price_unit ?? 'month',
    phone: row.phone ?? null,
    emailContact: row.email_contact ?? null,
    whatsapp: row.whatsapp ?? null,
    web: row.web ?? null,
    contactDefault: row.contact_default ?? 'web',
    createdAt: row.created_at ?? undefined,
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

/** Fetch a single active space by slug. Returns null if not found or on error. */
export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('[getSpaceBySlug] Supabase error:', error.message, { slug });
      return null;
    }
    return data ? rowToSpace(data) : null;
  } catch (err) {
    console.error('[getSpaceBySlug] Unexpected error:', err, { slug });
    return null;
  }
}

/** Fetch all spaces the user has favourited. */
export async function getFavoriteSpaces(userId: string): Promise<Space[]> {
  const supabase = await createClient();
  const { data: favData } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', userId);
  const ids = (favData ?? []).map(r => r.space_id as string);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .in('id', ids)
    .neq('status', 'removed');
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSpace);
}

/** Fetch all non-removed spaces owned by a user. */
export async function getSpacesByOwner(userId: string): Promise<Space[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('owner_id', userId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSpace);
}

/** Fetch a space by slug+owner for editing (includes paused, excludes removed). */
export async function getSpaceBySlugForOwner(slug: string, userId: string): Promise<Space | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .eq('owner_id', userId)
    .neq('status', 'removed')
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
