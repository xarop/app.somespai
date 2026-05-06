import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Space } from '@/lib/schemas/space';
import type { Review } from './reviews';

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
    neighborhood: row.neighborhood ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
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

export type AdminSpaceFullUpdate = {
  title: string;
  description: string | null;
  type: string;
  ownerId: string | null;
  priceCents: number;
  priceUnit: string;
  sizeM2: number | null;
  address: string | null;
  neighborhood: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  amenities: string[];
  photos: string[];
  phone: string | null;
  emailContact: string | null;
  whatsapp: string | null;
  web: string | null;
  contactDefault: string;
  status: string;
  isFeatured: boolean;
};

export async function updateSpaceFullAdmin(id: string, data: AdminSpaceFullUpdate): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('spaces').update({
    title: data.title,
    description: data.description,
    type: data.type,
    owner_id: data.ownerId,
    price_cents: data.priceCents,
    price_unit: data.priceUnit,
    size_m2: data.sizeM2,
    address: data.address,
    neighborhood: data.neighborhood,
    city: data.city,
    region: data.region,
    location: `SRID=4326;POINT(${data.lng} ${data.lat})`,
    amenities: data.amenities,
    photos: data.photos,
    phone: data.phone,
    email_contact: data.emailContact,
    whatsapp: data.whatsapp,
    web: data.web,
    contact_default: data.contactDefault,
    status: data.status,
    is_featured: data.isFeatured,
  }).eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Reviews ─────────────────────────────────────────────────────────────── */

export async function getReviewsAdmin(spaceId: string): Promise<Review[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, space_id, author_id, rating, body, created_at, profiles(display_name)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    spaceId: r.space_id,
    authorId: r.author_id,
    authorEmail: (r.profiles as { display_name?: string } | null)?.display_name ?? 'Usuari',
    rating: r.rating,
    body: r.body ?? null,
    createdAt: r.created_at,
  }));
}

async function recalcSpaceRating(spaceId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('reviews').select('rating').eq('space_id', spaceId);
  const reviews = data ?? [];
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  await supabase.from('spaces').update({ rating: avg, reviews_count: count }).eq('id', spaceId);
}

export async function updateReviewAdmin(
  id: string,
  spaceId: string,
  rating: number,
  body: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('reviews')
    .update({ rating, body: body?.trim() || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await recalcSpaceRating(spaceId);
}

export async function deleteReviewAdmin(id: string, spaceId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await recalcSpaceRating(spaceId);
}

/* ── Users ───────────────────────────────────────────────────────────────── */

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  spacesCount: number;
  displayName: string | null;
};

export async function getUsersAdmin(): Promise<AdminUser[]> {
  const supabase = createAdminClient();
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);

  const [profilesRes, spacesRes] = await Promise.all([
    supabase.from('profiles').select('id, display_name'),
    supabase.from('spaces').select('owner_id').not('owner_id', 'is', null),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p.display_name as string | null]));
  const spacesCount = new Map<string, number>();
  for (const s of spacesRes.data ?? []) {
    if (s.owner_id) spacesCount.set(s.owner_id, (spacesCount.get(s.owner_id) ?? 0) + 1);
  }

  return users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at ?? null,
    spacesCount: spacesCount.get(u.id) ?? 0,
    displayName: profileMap.get(u.id) ?? null,
  }));
}

export async function deleteUserAdmin(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

/* ── Contact messages ────────────────────────────────────────────────────── */

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export async function getContactMessagesAdmin(): Promise<ContactMessage[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    type: r.type,
    message: r.message,
    read: r.read,
    createdAt: r.created_at,
  }));
}

export async function setContactMessageReadAdmin(id: string, read: boolean): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('contact_messages').update({ read }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteContactMessageAdmin(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadAdminPhoto(spaceId: string, file: File): Promise<string | null> {
  const supabase = createAdminClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `admin/${spaceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('space-photos').upload(path, file);
  if (error) return null;
  const { data: { publicUrl } } = supabase.storage.from('space-photos').getPublicUrl(path);
  return publicUrl;
}
