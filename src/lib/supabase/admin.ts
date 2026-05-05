import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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
    phone: row.phone ?? null,
    emailContact: row.email_contact ?? null,
    whatsapp: row.whatsapp ?? null,
    web: row.web ?? null,
    contactDefault: row.contact_default ?? 'web',
  };
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getAllSpacesAdmin(): Promise<Space[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSpace);
}

export async function setSpaceStatusAdmin(
  id: string,
  status: 'active' | 'paused' | 'removed',
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('spaces').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setSpaceFeaturedAdmin(id: string, isFeatured: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('spaces')
    .update({ is_featured: isFeatured })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export type AdminSpaceUpdate = Partial<{
  title: string;
  description: string | null;
  type: 'storage' | 'workspace' | 'garden' | 'room';
  priceCents: number;
  priceUnit: 'month' | 'day' | 'hour';
  sizeM2: number | null;
  neighborhood: string;
  city: string;
  status: 'active' | 'paused' | 'removed';
  isFeatured: boolean;
}>;

export async function updateSpaceAdmin(id: string, data: AdminSpaceUpdate): Promise<void> {
  const supabase = createAdminClient();
  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.type !== undefined) update.type = data.type;
  if (data.priceCents !== undefined) update.price_cents = data.priceCents;
  if (data.priceUnit !== undefined) update.price_unit = data.priceUnit;
  if (data.sizeM2 !== undefined) update.size_m2 = data.sizeM2;
  if (data.neighborhood !== undefined) update.neighborhood = data.neighborhood;
  if (data.city !== undefined) update.city = data.city;
  if (data.status !== undefined) update.status = data.status;
  if (data.isFeatured !== undefined) update.is_featured = data.isFeatured;
  const { error } = await supabase.from('spaces').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSpaceAdmin(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('spaces').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
