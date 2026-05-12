'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateOwnSpaceAction(
  spaceId: string,
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Not authenticated';

  const { data: existing } = await supabase
    .from('spaces')
    .select('id, owner_id')
    .eq('id', spaceId)
    .eq('owner_id', user.id)
    .maybeSingle();
  if (!existing) return 'No tens permís per editar aquest slot.';

  const title = (formData.get('title') as string ?? '').trim();
  const type = formData.get('type') as string;
  const description = (formData.get('description') as string ?? '').trim() || null;
  const priceRaw = parseFloat(formData.get('price') as string);
  const priceCents = isNaN(priceRaw) ? 0 : Math.round(priceRaw * 100);
  const priceUnit = (formData.get('price_unit') as string) || 'month';
  const sizeRaw = formData.get('size_m2') as string;
  const sizeM2 = sizeRaw ? parseFloat(sizeRaw) : null;
  const address = (formData.get('address') as string ?? '').trim() || null;
  const neighborhood = (formData.get('neighborhood') as string ?? '').trim() || null;
  const city = (formData.get('city') as string ?? '').trim() || null;
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);
  const phone = (formData.get('phone') as string ?? '').trim() || null;
  const emailContact = (formData.get('email_contact') as string ?? '').trim() || null;
  const whatsapp = (formData.get('whatsapp') as string ?? '').trim() || null;
  const web = (formData.get('web') as string ?? '').trim() || null;
  const contactDefault = (formData.get('contact_default') as string) || 'web';
  const amenities = formData.getAll('amenities') as string[];
  const status = (formData.get('status') as string) || 'active';

  if (isNaN(lat) || isNaN(lng)) return 'Coordenades invàlides — geolocalitza l\'adreça primer';
  if (!['active', 'paused'].includes(status)) return 'Estat no vàlid';

  const keptPhotos = formData.getAll('kept_photo') as string[];
  const newFiles = formData.getAll('new_photos') as File[];
  const uploaded: string[] = [];
  for (const file of newFiles) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('space-photos').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('space-photos').getPublicUrl(path);
      uploaded.push(publicUrl);
    }
  }
  const photos = [...keptPhotos, ...uploaded];

  const { error } = await supabase.from('spaces').update({
    title, type, description,
    price_cents: priceCents,
    price_unit: priceUnit,
    size_m2: sizeM2,
    address, neighborhood, city,
    location: `SRID=4326;POINT(${lng} ${lat})`,
    amenities, photos,
    phone, email_contact: emailContact, whatsapp, web,
    contact_default: contactDefault,
    status,
  }).eq('id', spaceId).eq('owner_id', user.id);

  if (error) return error.message;
  return 'ok';
}

export async function deleteOwnSpaceAction(spaceId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Not authenticated';

  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', spaceId)
    .eq('owner_id', user.id);

  if (error) return error.message;
  return 'ok';
}
