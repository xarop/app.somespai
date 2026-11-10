import { createAdminClient } from './admin';

export interface AdminWorkshop {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number | null;
  city: string | null;
  status: string;
  organizerId: string;
  organizerName: string | null;
  spaceTitle: string | null;
  sessionsCount: number;
  createdAt: string;
}

export interface AdminWorkshopUpdate {
  title?: string;
  category?: string;
  price?: number | null;
  status?: 'active' | 'paused' | 'removed';
}

export async function getAllWorkshopsAdmin(): Promise<AdminWorkshop[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('workshops')
    .select('*, workshop_sessions(id), spaces(title), profiles(display_name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const space = Array.isArray(row.spaces) ? row.spaces[0] : row.spaces;
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      price: row.price === null || row.price === undefined ? null : Number(row.price),
      city: row.city ?? null,
      status: row.status,
      organizerId: row.organizer_id,
      organizerName: profile?.display_name ?? null,
      spaceTitle: space?.title ?? null,
      sessionsCount: row.workshop_sessions?.length ?? 0,
      createdAt: row.created_at,
    };
  });
}

export async function updateWorkshopAdmin(id: string, update: AdminWorkshopUpdate): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('workshops').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteWorkshopAdmin(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from('workshops').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
