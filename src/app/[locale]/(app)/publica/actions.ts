'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/geo';
import { redirect } from 'next/navigation';

export async function createSpaceAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

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
  const phone = (formData.get('phone') as string)?.trim() || null;
  const web = (formData.get('web') as string)?.trim() || null;
  const contactDefault = (formData.get('contact_default') as string) || 'web';
  const amenities = formData.getAll('amenities') as string[];

  if (isNaN(lat) || isNaN(lng)) return 'Invalid coordinates — geocode the address first';

  // Ensure profile exists (defensive — trigger handles new signups automatically)
  if (user) {
    await supabase.from('profiles').upsert({ id: user.id, display_name: user.email }, { onConflict: 'id', ignoreDuplicates: true });
  }

  // Upload photos
  const photos: string[] = [];
  const files = formData.getAll('photos') as File[];
  const folderId = user?.id || 'guest';
  for (const file of files) {
    if (!file || file.size === 0) continue;
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${folderId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseAdmin.storage.from('space-photos').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabaseAdmin.storage.from('space-photos').getPublicUrl(path);
      photos.push(publicUrl);
    }
  }

  // Unique slug
  let slug = slugify(title) || 'espai';
  const { count } = await supabase
    .from('spaces')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);
  if (count && count > 0) slug = `${slug}-${Date.now().toString(36)}`;

  const { data: space, error } = await supabaseAdmin
    .from('spaces')
    .insert({
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
      location: `SRID=4326;POINT(${lng} ${lat})`,
      amenities,
      photos,
      contact_name: contactName,
      phone,
      email_contact: emailContact,
      whatsapp: phone,
      web,
      contact_default: contactDefault,
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
