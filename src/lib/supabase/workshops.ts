import { createClient } from './server';
import type { Workshop, WorkshopSession, WorkshopWithSpace } from '@/types/workshop';

interface WorkshopRow {
  id: string;
  organizer_id: string;
  space_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  price: number | string | null;
  duration_minutes: number | null;
  max_capacity: number | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  contact_url: string | null;
  contact_default: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  workshop_sessions?: WorkshopSessionRow[];
  spaces?: WorkshopSpaceRow | WorkshopSpaceRow[] | null;
}

interface WorkshopSessionRow {
  id: string;
  workshop_id: string;
  start_time: string;
  end_time: string;
  available_seats: number | null;
  status: string;
}

interface WorkshopSpaceRow {
  id: string;
  slug: string;
  title: string;
  city: string | null;
  address?: string | null;
  neighborhood?: string | null;
}

function mapSession(row: WorkshopSessionRow): WorkshopSession {
  return {
    id: row.id,
    workshopId: row.workshop_id,
    startTime: row.start_time,
    endTime: row.end_time,
    availableSeats: row.available_seats,
    status: row.status,
  };
}

function mapWorkshop(row: WorkshopRow): WorkshopWithSpace {
  const spaceRow = Array.isArray(row.spaces) ? row.spaces[0] : row.spaces;
  return {
    id: row.id,
    organizerId: row.organizer_id,
    spaceId: row.space_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: row.category,
    price: row.price === null ? null : Number(row.price),
    durationMinutes: row.duration_minutes,
    maxCapacity: row.max_capacity,
    address: row.address,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    contactWhatsapp: row.contact_whatsapp,
    contactUrl: row.contact_url,
    contactDefault: row.contact_default,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sessions: (row.workshop_sessions ?? []).map(mapSession),
    space: spaceRow
      ? {
          id: spaceRow.id,
          slug: spaceRow.slug,
          title: spaceRow.title,
          city: spaceRow.city,
          address: spaceRow.address ?? null,
          neighborhood: spaceRow.neighborhood ?? null,
        }
      : null,
  };
}

export interface GetWorkshopsOptions {
  category?: string;
  date?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

function madridMidnightUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const midnightAsUtc = Date.UTC(year, month - 1, day);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(midnightAsUtc));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  const localRepresentation = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  return new Date(midnightAsUtc - (localRepresentation - midnightAsUtc));
}

export async function getWorkshops({
  category,
  date,
  location,
  latitude,
  longitude,
  limit = 100,
}: GetWorkshopsOptions = {}): Promise<WorkshopWithSpace[]> {
  const supabase = await createClient();
  let nearbyIds: string[] | null = null;
  const hasCoordinates =
    latitude !== undefined &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  if (date && !isValidDate(date)) {
    throw new Error('Invalid workshop date filter');
  }

  if (hasCoordinates) {
    let dateFrom: string | null = null;
    let dateTo: string | null = null;
    if (date) {
      dateFrom = madridMidnightUtc(date).toISOString();
      const [year, month, day] = date.split('-').map(Number);
      const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
      dateTo = new Date(madridMidnightUtc(nextDate).getTime() - 1).toISOString();
    }

    const { data, error } = await supabase.rpc('nearby_workshops', {
      center_lng: longitude!,
      center_lat: latitude!,
      radius_m: 15000,
      filter_category: category || null,
      date_from: dateFrom,
      date_to: dateTo,
      limit_count: Math.min(limit, 200),
    });
    if (error) throw new Error(`Could not search nearby workshops: ${error.message}`);
    const resultIds = (data ?? []).map((row: { id: string }) => row.id);
    if (resultIds.length === 0) return [];
    nearbyIds = resultIds;
  }

  const sessionsSelection = date ? 'workshop_sessions!inner(*)' : 'workshop_sessions(*)';
  let query = supabase
    .from('workshops')
    .select(`*, ${sessionsSelection}, spaces(id, slug, title, city, address, neighborhood)`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) query = query.eq('category', category);
  if (nearbyIds) query = query.in('id', nearbyIds);
  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    const from = madridMidnightUtc(date);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
    const to = madridMidnightUtc(nextDate);
    query = query
      .gte('workshop_sessions.start_time', from.toISOString())
      .lt('workshop_sessions.start_time', to.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load workshops: ${error.message}`);
  let workshops = ((data ?? []) as unknown as WorkshopRow[]).map(mapWorkshop);
  if (nearbyIds) {
    const order = new Map(nearbyIds.map((id, index) => [id, index]));
    workshops.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
  } else if (location?.trim()) {
    const search = location.trim().toLocaleLowerCase();
    workshops = workshops.filter((workshop) =>
      [
        workshop.address,
        workshop.city,
        workshop.space?.address,
        workshop.space?.neighborhood,
        workshop.space?.city,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(search)),
    );
  }
  return workshops;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === date;
}

export async function getWorkshopBySlug(slug: string): Promise<WorkshopWithSpace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workshops')
    .select('*, workshop_sessions(*), spaces(id, slug, title, city, address, neighborhood)')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new Error(`Could not load workshop: ${error.message}`);
  return data ? mapWorkshop(data as unknown as WorkshopRow) : null;
}

export async function getWorkshopsByOwner(ownerId: string): Promise<WorkshopWithSpace[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workshops')
    .select('*, workshop_sessions(*), spaces(id, slug, title, city, address, neighborhood)')
    .eq('organizer_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load your workshops: ${error.message}`);
  return ((data ?? []) as unknown as WorkshopRow[]).map(mapWorkshop);
}
