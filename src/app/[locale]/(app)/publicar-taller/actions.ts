'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/geo';
import { WORKSHOP_CATEGORIES } from '@/lib/data/workshop-categories';

export interface PublishWorkshopState {
  error?: string;
  success?: string;
  slug?: string;
}

interface SessionInput {
  start_time: string;
  end_time: string;
  available_seats: number | null;
}

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry.trim() : '';
}

function message(locale: string, key: string): string {
  const messages = {
    ca: {
      auth: 'Cal iniciar sessió per publicar un taller.',
      details: 'Revisa el títol, la categoria i les dates de les sessions.',
      values: 'Revisa el preu, la durada, l’aforament i les coordenades.',
      space: 'L’espai seleccionat ja no està disponible.',
      save: 'No s’ha pogut publicar el taller. Torna-ho a provar.',
      sessions: 'El taller no s’ha publicat perquè no s’han pogut desar les sessions.',
    },
    es: {
      auth: 'Inicia sesión para publicar un taller.',
      details: 'Revisa el título, la categoría y las fechas de las sesiones.',
      values: 'Revisa el precio, la duración, el aforo y las coordenadas.',
      space: 'El espacio seleccionado ya no está disponible.',
      save: 'No se ha podido publicar el taller. Inténtalo de nuevo.',
      sessions: 'El taller no se ha publicado porque no se pudieron guardar las sesiones.',
    },
    en: {
      auth: 'Sign in to list a workshop.',
      details: 'Check the title, category and session dates.',
      values: 'Check the price, duration, capacity and coordinates.',
      space: 'The selected space is no longer available.',
      save: 'The workshop could not be published. Please try again.',
      sessions: 'The workshop was not published because its sessions could not be saved.',
    },
  };
  const language = locale in messages ? locale as keyof typeof messages : 'ca';
  return messages[language][key as keyof typeof messages.ca];
}

function parseSessions(input: string): SessionInput[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 30) return null;

  const sessions: SessionInput[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    if (typeof row.start !== 'string' || typeof row.end !== 'string') return null;
    const start = new Date(row.start);
    const end = new Date(row.end);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) return null;
    const seats = row.seats === '' || row.seats === null ? null : Number(row.seats);
    if (seats !== null && (!Number.isInteger(seats) || seats < 0)) return null;
    sessions.push({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      available_seats: seats,
    });
  }
  return sessions;
}

export async function createWorkshopAction(
  _previousState: PublishWorkshopState | null,
  formData: FormData,
): Promise<PublishWorkshopState> {
  const locale = value(formData, 'locale');
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: message(locale, 'auth') };

  const title = value(formData, 'title');
  const category = value(formData, 'category');
  const priceInput = value(formData, 'price');
  const durationInput = value(formData, 'duration_minutes');
  const capacityInput = value(formData, 'max_capacity');
  const latInput = value(formData, 'lat');
  const lngInput = value(formData, 'lng');
  const lat = latInput ? Number(latInput) : null;
  const lng = lngInput ? Number(lngInput) : null;
  const price = priceInput ? Number(priceInput) : null;
  const duration = durationInput ? Number(durationInput) : null;
  const capacity = capacityInput ? Number(capacityInput) : null;
  const sessions = parseSessions(value(formData, 'sessions'));

  if (
    !title ||
    title.length > 140 ||
    !WORKSHOP_CATEGORIES.some((item) => item.value === category) ||
    !sessions
  ) {
    return { error: message(locale, 'details') };
  }
  if (
    (latInput === '') !== (lngInput === '') ||
    (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) ||
    (lng !== null && (!Number.isFinite(lng) || Math.abs(lng) > 180)) ||
    (price !== null && (!Number.isFinite(price) || price < 0)) ||
    (duration !== null && (!Number.isInteger(duration) || duration <= 0)) ||
    (capacity !== null && (!Number.isInteger(capacity) || capacity <= 0))
  ) {
    return { error: message(locale, 'values') };
  }

  const spaceId = value(formData, 'space_id') || null;
  if (spaceId) {
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .select('id')
      .eq('id', spaceId)
      .eq('status', 'active')
      .maybeSingle();
    if (spaceError || !space) return { error: message(locale, 'space') };
  }

  const baseSlug = slugify(title).slice(0, 70) || 'taller';
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const { data: workshop, error: workshopError } = await supabase
    .from('workshops')
    .insert({
      organizer_id: user.id,
      space_id: spaceId,
      title,
      slug,
      description: value(formData, 'description') || null,
      category,
      price,
      duration_minutes: duration,
      max_capacity: capacity,
      address: value(formData, 'address') || null,
      city: value(formData, 'city') || 'Barcelona',
      lat,
      lng,
      contact_name: value(formData, 'contact_name') || null,
      contact_phone: value(formData, 'contact_phone') || null,
      contact_email: value(formData, 'contact_email') || null,
      contact_whatsapp: value(formData, 'contact_whatsapp') || null,
      contact_url: value(formData, 'contact_url') || null,
      contact_default: value(formData, 'contact_default') || null,
      status: 'active',
    })
    .select('id')
    .single();

  if (workshopError || !workshop) {
    console.error('[createWorkshopAction] Workshop insert failed:', workshopError?.message);
    return { error: message(locale, 'save') };
  }

  const { error: sessionsError } = await supabase
    .from('workshop_sessions')
    .insert(sessions.map((session) => ({ ...session, workshop_id: workshop.id })));

  if (sessionsError) {
    console.error('[createWorkshopAction] Session insert failed:', sessionsError.message);
    const { error: rollbackError } = await supabase
      .from('workshops')
      .delete()
      .eq('id', workshop.id)
      .eq('organizer_id', user.id);
    if (rollbackError) {
      console.error('[createWorkshopAction] Workshop rollback failed:', rollbackError.message);
    }
    return { error: message(locale, 'sessions') };
  }

  revalidatePath('/');
  revalidatePath(`/taller/${slug}`);
  return { success: 'El taller s’ha publicat correctament.', slug };
}
