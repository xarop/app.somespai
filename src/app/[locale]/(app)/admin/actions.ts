'use server';

import { createClient } from '@/lib/supabase/server';
import {
  setSpaceStatusAdmin,
  setSpaceFeaturedAdmin,
  updateSpaceAdmin,
  updateSpaceFullAdmin,
  uploadAdminPhoto,
  deleteSpaceAdmin,
  bulkSetSpaceStatusAdmin,
  bulkDeleteSpaceAdmin,
  getReviewsAdmin,
  updateReviewAdmin,
  addReviewAdmin,
  deleteReviewAdmin,
  getUsersAdmin,
  deleteUserAdmin,
  setUserAdminRole,
  setUserPremiumRole,
  getContactMessagesAdmin,
  setContactMessageReadAdmin,
  deleteContactMessageAdmin,
  type AdminSpaceUpdate,
  type AdminUser,
  type ContactMessage,
} from '@/lib/supabase/admin';
import type { Review } from '@/lib/supabase/reviews';

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();

  if (user.email !== process.env.ADMIN_EMAIL && !profile?.is_admin) {
    throw new Error('Unauthorized');
  }
}

export async function setStatusAction(id: string, status: 'active' | 'paused' | 'removed') {
  await requireAdmin();
  await setSpaceStatusAdmin(id, status);
}

export async function setFeaturedAction(id: string, isFeatured: boolean) {
  await requireAdmin();
  await setSpaceFeaturedAdmin(id, isFeatured);
}

export async function updateSpaceAction(id: string, data: AdminSpaceUpdate) {
  await requireAdmin();
  await updateSpaceAdmin(id, data);
}

export async function deleteSpaceAction(id: string) {
  await requireAdmin();
  await deleteSpaceAdmin(id);
}

export async function bulkSetStatusAction(ids: string[], status: 'active' | 'paused' | 'removed'): Promise<void> {
  await requireAdmin();
  await bulkSetSpaceStatusAdmin(ids, status);
}

export async function bulkDeleteAction(ids: string[]): Promise<void> {
  await requireAdmin();
  await bulkDeleteSpaceAdmin(ids);
}

export async function getAdminReviewsAction(spaceId: string): Promise<Review[]> {
  await requireAdmin();
  return getReviewsAdmin(spaceId);
}

export async function updateReviewAction(
  id: string,
  spaceId: string,
  rating: number,
  body: string | null,
  authorId?: string,
): Promise<void> {
  await requireAdmin();
  await updateReviewAdmin(id, spaceId, rating, body, authorId);
}

export async function addReviewAction(
  spaceId: string,
  authorId: string,
  rating: number,
  body: string | null,
): Promise<void> {
  await requireAdmin();
  await addReviewAdmin(spaceId, authorId, rating, body);
}

export async function deleteReviewAction(id: string, spaceId: string): Promise<void> {
  await requireAdmin();
  await deleteReviewAdmin(id, spaceId);
}

export async function getUsersAction(): Promise<{ data: AdminUser[]; error: string | null }> {
  try {
    await requireAdmin();
    const data = await getUsersAdmin();
    return { data, error: null };
  } catch (e) {
    console.error('getUsersAction:', e);
    return { data: [], error: e instanceof Error ? e.message : 'Error carregant usuaris' };
  }
}

export async function deleteUserAction(userId: string): Promise<void> {
  await requireAdmin();
  await deleteUserAdmin(userId);
}

export async function setUserAdminRoleAction(userId: string, isAdmin: boolean): Promise<void> {
  await requireAdmin();
  await setUserAdminRole(userId, isAdmin);
}

export async function setUserPremiumRoleAction(userId: string, isPremium: boolean): Promise<void> {
  await requireAdmin();
  await setUserPremiumRole(userId, isPremium);
}

export async function getContactMessagesAction(): Promise<{ data: ContactMessage[]; error: string | null }> {
  try {
    await requireAdmin();
    const data = await getContactMessagesAdmin();
    return { data, error: null };
  } catch (e) {
    console.error('getContactMessagesAction:', e);
    return { data: [], error: e instanceof Error ? e.message : 'Error carregant missatges' };
  }
}

export async function setContactMessageReadAction(id: string, read: boolean): Promise<void> {
  await requireAdmin();
  await setContactMessageReadAdmin(id, read);
}

export async function deleteContactMessageAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteContactMessageAdmin(id);
}

export async function updateSpaceFullAction(
  spaceId: string,
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const title = (formData.get('title') as string ?? '').trim();
  const type = formData.get('type') as string;
  const ownerId = (formData.get('owner_id') as string ?? '').trim() || null;
  const description = (formData.get('description') as string ?? '').trim() || null;
  const priceRaw = parseFloat(formData.get('price') as string);
  const priceCents = isNaN(priceRaw) ? 0 : Math.round(priceRaw * 100);
  const priceUnit = (formData.get('price_unit') as string) || 'month';
  const sizeRaw = formData.get('size_m2') as string;
  const sizeM2 = sizeRaw ? parseFloat(sizeRaw) : null;
  const address = (formData.get('address') as string ?? '').trim() || null;
  const neighborhood = (formData.get('neighborhood') as string ?? '').trim() || null;
  const city = (formData.get('city') as string ?? '').trim() || null;
  const region = (formData.get('region') as string ?? '').trim() || null;
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);
  const phone = (formData.get('phone') as string ?? '').trim() || null;
  const emailContact = (formData.get('email_contact') as string ?? '').trim() || null;
  const whatsapp = (formData.get('whatsapp') as string ?? '').trim() || null;
  const web = (formData.get('web') as string ?? '').trim() || null;
  const contactDefault = (formData.get('contact_default') as string) || 'web';
  const amenities = formData.getAll('amenities') as string[];
  const status = (formData.get('status') as string) || 'active';
  const isFeatured = formData.get('is_featured') === 'true';

  if (isNaN(lat) || isNaN(lng)) return 'Coordenades invàlides — geolocalitza l\'adreça primer';

  const keptPhotos = formData.getAll('kept_photo') as string[];
  const newFiles = formData.getAll('new_photos') as File[];
  const uploaded: string[] = [];
  for (const file of newFiles) {
    if (!file || file.size === 0) continue;
    const url = await uploadAdminPhoto(spaceId, file);
    if (url) uploaded.push(url);
  }
  const photos = [...keptPhotos, ...uploaded];

  try {
    await updateSpaceFullAdmin(spaceId, {
      title, type, ownerId, description, priceCents, priceUnit, sizeM2,
      address, neighborhood, city, region, lat, lng,
      amenities, photos,
      phone, emailContact, whatsapp, web, contactDefault,
      status, isFeatured,
    });
    return 'ok';
  } catch (e) {
    return e instanceof Error ? e.message : 'Error desconegut';
  }
}
