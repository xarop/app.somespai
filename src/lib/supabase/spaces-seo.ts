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
  };
}

function createSeoClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface CityStats {
  city: string;
  count: number;
  neighborhoods: Array<{ name: string; count: number }>;
}

export async function getCitiesWithStats(): Promise<CityStats[]> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('city, neighborhood')
    .eq('status', 'active')
    .not('city', 'is', null);

  const cityMap = new Map<string, { count: number; neighborhoods: Map<string, number> }>();
  for (const row of data ?? []) {
    if (!row.city) continue;
    if (!cityMap.has(row.city)) cityMap.set(row.city, { count: 0, neighborhoods: new Map() });
    const entry = cityMap.get(row.city)!;
    entry.count++;
    if (row.neighborhood) {
      entry.neighborhoods.set(row.neighborhood, (entry.neighborhoods.get(row.neighborhood) ?? 0) + 1);
    }
  }

  return [...cityMap.entries()]
    .map(([city, { count, neighborhoods }]) => ({
      city,
      count,
      neighborhoods: [...neighborhoods.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getDistinctCities(): Promise<string[]> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('city')
    .eq('status', 'active')
    .not('city', 'is', null);
  const seen = new Set<string>();
  for (const row of data ?? []) {
    if (row.city) seen.add(row.city as string);
  }
  return [...seen].sort();
}

export async function getDistinctCityTypePairs(): Promise<Array<{ city: string; type: string }>> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('city, type')
    .eq('status', 'active')
    .not('city', 'is', null);
  const seen = new Set<string>();
  const pairs: Array<{ city: string; type: string }> = [];
  for (const row of data ?? []) {
    const key = `${row.city}:${row.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ city: row.city as string, type: row.type as string });
    }
  }
  return pairs;
}

export async function getSpacesByCity(city: string, type?: string): Promise<Space[]> {
  const supabase = createSeoClient();
  let query = supabase
    .from('spaces')
    .select('*')
    .eq('status', 'active')
    .ilike('city', city);
  if (type) query = query.eq('type', type);
  const { data } = await query.order('is_featured', { ascending: false });
  return (data ?? []).map(rowToSpace);
}

export async function getAllSlugsPublic(): Promise<string[]> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('slug')
    .eq('status', 'active');
  return (data ?? []).map((r) => r.slug as string);
}

export async function getAllActiveSpacesSummary(): Promise<Array<{ slug: string; title: string; city: string | null; type: string }>> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('slug, title, city, type')
    .eq('status', 'active')
    .order('city', { ascending: true });
  return (data ?? []).map((r) => ({
    slug: r.slug as string,
    title: r.title as string,
    city: r.city as string | null,
    type: r.type as string,
  }));
}

export async function getAllActiveSpaces(): Promise<Space[]> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('*')
    .eq('status', 'active')
    .order('is_featured', { ascending: false });
  return (data ?? []).map(rowToSpace);
}
