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
  const casingMap = buildCityMap(data ?? []);

  for (const row of data ?? []) {
    if (!row.city) continue;
    const properCity = casingMap.get(row.city.toLowerCase())!;
    if (!cityMap.has(properCity)) cityMap.set(properCity, { count: 0, neighborhoods: new Map() });
    const entry = cityMap.get(properCity)!;
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

// Helper to normalize city casings so "BARCELONA" and "Barcelona" group together
function buildCityMap(rows: any[]) {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (!row.city) continue;
    const lower = row.city.toLowerCase();
    const existing = map.get(lower);
    if (!existing) {
      map.set(lower, row.city);
    } else if (existing.toUpperCase() === existing && row.city.toUpperCase() !== row.city) {
      // Prefer Title Case 'Barcelona' over UPPERCASE 'BARCELONA'
      map.set(lower, row.city);
    }
  }
  return map;
}

export async function getDistinctCities(): Promise<string[]> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('city')
    .eq('status', 'active')
    .not('city', 'is', null);
  
  const cityMap = buildCityMap(data ?? []);
  return [...new Set(cityMap.values())].sort();
}

export async function getDistinctCityTypePairs(): Promise<Array<{ city: string; type: string }>> {
  const supabase = createSeoClient();
  const { data } = await supabase
    .from('spaces')
    .select('city, type')
    .eq('status', 'active')
    .not('city', 'is', null);
  
  const cityMap = buildCityMap(data ?? []);
  const seen = new Set<string>();
  const pairs: Array<{ city: string; type: string }> = [];
  
  for (const row of data ?? []) {
    if (row.city && row.type) {
      const properCity = cityMap.get(row.city.toLowerCase())!;
      const key = `${properCity}:${row.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ city: properCity, type: row.type as string });
      }
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
  const casingMap = buildCityMap(data ?? []);
  return (data ?? []).map((r) => ({
    slug: r.slug as string,
    title: r.title as string,
    city: r.city ? casingMap.get((r.city as string).toLowerCase()) ?? null : null,
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
