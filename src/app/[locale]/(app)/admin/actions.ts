'use server';

import sharp from 'sharp';
import { slugify } from '@/lib/geo';
import { createClient } from '@/lib/supabase/server';
import {
  setSpaceStatusAdmin,
  setSpaceFeaturedAdmin,
  updateSpaceAdmin,
  updateSpaceFullAdmin,
  uploadAdminPhoto,
  deleteSpaceAdmin,
  getReviewsAdmin,
  updateReviewAdmin,
  deleteReviewAdmin,
  type AdminSpaceUpdate,
} from '@/lib/supabase/admin';
import type { Review } from '@/lib/supabase/reviews';

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
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

export async function getAdminReviewsAction(spaceId: string): Promise<Review[]> {
  await requireAdmin();
  return getReviewsAdmin(spaceId);
}

export async function updateReviewAction(
  id: string,
  spaceId: string,
  rating: number,
  body: string | null,
): Promise<void> {
  await requireAdmin();
  await updateReviewAdmin(id, spaceId, rating, body);
}

export async function deleteReviewAction(id: string, spaceId: string): Promise<void> {
  await requireAdmin();
  await deleteReviewAdmin(id, spaceId);
}

export async function quickImportAction(
  _prev: string | null,
  formData: FormData
): Promise<string | 'ok'> {
  await requireAdmin();
  const supabase = await createClient();

  const title = (formData.get('title') as string) || 'Espai Importat';
  const type = (formData.get('type') as string) || 'storage';
  const description = (formData.get('description') as string) || '';
  const address = (formData.get('address') as string) || '';
  const priceRaw = parseFloat(formData.get('price') as string);
  const sizeRaw = formData.get('size_m2') as string;
  const web = formData.get('web') as string;
  const amenities = formData.getAll('amenities') as string[];
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);
  
  if (isNaN(lat) || isNaN(lng)) return 'Coordenades invàlides';

  // Unique slug
  let slug = slugify(title) || 'espai';
  const { count } = await supabase.from('spaces').select('id', { count: 'exact', head: true }).eq('slug', slug);
  if (count && count > 0) slug = `${slug}-${Date.now().toString(36)}`;

  // Handle Photo
  const photos: string[] = [];
  const file = formData.get('photo') as File | null;
  const photoUrl = formData.get('photoUrl') as string | null;

  try {
    let buffer: Buffer | null = null;
    if (file && file.size > 0) {
      const ab = await file.arrayBuffer();
      buffer = Buffer.from(ab);
    } else if (photoUrl) {
      const res = await fetch(photoUrl);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        buffer = Buffer.from(ab);
      }
    }

    if (buffer) {
      const webpBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      
      const path = `admin-import/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
      const { error } = await supabase.storage.from('space-photos').upload(path, webpBuffer, { contentType: 'image/webp' });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('space-photos').getPublicUrl(path);
        photos.push(publicUrl);
      }
    }
  } catch (error) {
    console.error('Photo import error:', error);
  }

  const { error: insertError } = await supabase.from('spaces').insert({
    slug,
    title,
    type,
    description,
    price_cents: isNaN(priceRaw) ? 0 : Math.round(priceRaw * 100),
    size_m2: sizeRaw ? parseFloat(sizeRaw) : null,
    address,
    location: `SRID=4326;POINT(${lng} ${lat})`,
    amenities,
    photos,
    web,
    contact_default: 'web',
    status: 'paused',
    owner_id: (await supabase.auth.getUser()).data.user?.id
  });

  if (insertError) return `DB Error: ${insertError.message}`;
  
  return 'ok';
}

export async function updateSpaceFullAction(
  spaceId: string,
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const title = (formData.get('title') as string ?? '').trim();
  const type = formData.get('type') as string;
  const description = (formData.get('description') as string ?? '').trim() || null;
  const priceRaw = parseFloat(formData.get('price') as string);
  const priceCents = isNaN(priceRaw) ? 0 : Math.round(priceRaw * 100);
  const priceUnit = (formData.get('price_unit') as string) || 'month';
  const sizeRaw = formData.get('size_m2') as string;
  const sizeM2 = sizeRaw ? parseFloat(sizeRaw) : null;
  const address = (formData.get('address') as string ?? '').trim() || null;
  const neighborhood = (formData.get('neighborhood') as string ?? '').trim() || 'Vila de Gràcia';
  const city = (formData.get('city') as string ?? '').trim() || 'Barcelona';
  const region = (formData.get('region') as string ?? '').trim() || 'Catalunya';
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
      title, type, description, priceCents, priceUnit, sizeM2,
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
