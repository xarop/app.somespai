'use server';

import { createClient, isMockEnabled } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/geo';
import { redirect } from 'next/navigation';
import { uploadToR2 } from '@/lib/r2';

export async function createSpaceAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emailContact = (formData.get('email_contact') as string)?.trim()
    || (formData.get('guest_email') as string)?.trim()
    || null;
  if (!user && !emailContact) return 'Es requereix un correu electrònic per usuaris no registrats';

  const title = (formData.get('title') as string).trim();
  const type = formData.get('type') as string;
  const description = (formData.get('description') as string)?.trim() || null;
  const priceRaw = parseFloat(formData.get('price') as string);
  const priceCents = isNaN(priceRaw) ? 0 : Math.round(priceRaw * 100);
  const priceUnit = (formData.get('price_unit') as string) || 'month';
  const sizeM2Raw = formData.get('size_m2') as string;
  const sizeM2 = sizeM2Raw ? parseFloat(sizeM2Raw) : null;
  const address = (formData.get('address') as string)?.trim() || null;
  const neighborhood = (formData.get('neighborhood') as string)?.trim() || null;
  const city = (formData.get('city') as string)?.trim() || null;
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);
  const contactName = (formData.get('contact_name') as string)?.trim() || null;
  const isWorkshopVenue = formData.get('is_workshop_venue') === 'on';
  const phone = (formData.get('phone') as string)?.trim() || null;
  const web = (formData.get('web') as string)?.trim() || null;
  const contactDefault = (formData.get('contact_default') as string) || 'web';
  const amenities = formData.getAll('amenities') as string[];

  if (isNaN(lat) || isNaN(lng)) return 'Invalid coordinates — geocode the address first';

  // Ensure profile exists (defensive — trigger handles new signups automatically)
  if (user) {
    await supabase.from('profiles').upsert({ id: user.id, display_name: user.email }, { onConflict: 'id', ignoreDuplicates: true });
  }

  // Check premium for photo limit
  let isPremium = false;
  if (user) {
    const { data: prof } = await supabase.from('profiles').select('is_premium').eq('id', user.id).maybeSingle();
    isPremium = !!(prof as { is_premium?: boolean } | null)?.is_premium;
  }
  const photoLimit = isPremium ? 6 : 1;

  // Upload photos
  const photos: string[] = [];
  const files = (formData.getAll('photos') as File[]).slice(0, photoLimit);
  const folderId = user?.id || 'guest';
  for (const file of files) {
    if (!file || file.size === 0) continue;
    try {
      const url = await uploadToR2(file, folderId);
      photos.push(url);
    } catch { /* skip failed uploads */ }
  }

  // Unique slug
  let slug = slugify(title) || 'espai';
  const { count } = await supabase
    .from('spaces')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);
  if (count && count > 0) slug = `${slug}-${Date.now().toString(36)}`;

  const spaceData = {
    owner_id: user?.id || null,
    status: user ? 'active' : 'pending',
    slug,
    title,
    type,
    description,
    price_cents: priceCents,
    price_unit: priceUnit,
    size_m2: sizeM2,
    address,
    neighborhood,
    city,
    region: null,
    amenities,
    photos,
    contact_name: contactName,
    is_workshop_venue: isWorkshopVenue,
    phone,
    email_contact: emailContact,
    whatsapp: phone,
    web,
    contact_default: contactDefault,
  };

  if (isMockEnabled()) {
    const { data: space, error } = await supabase
      .from('spaces')
      .insert({ ...spaceData, lat, lng })
      .select('slug')
      .single();
    if (error || !space) return error?.message ?? 'Could not create space';
    redirect(`/espai/${space.slug}`);
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: space, error } = await supabaseAdmin
    .from('spaces')
    .insert({
      ...spaceData,
      location: `SRID=4326;POINT(${lng} ${lat})`,
    })
    .select('slug')
    .single();

  if (error) return error.message;

  if (!user) {
    // Show a success message telling them it's pending validation
    return 'SUCCESS_GUEST';
  }

  redirect(`/espai/${space.slug}`);
}
