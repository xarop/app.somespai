import { createClient } from './client';

export interface Review {
  id: string;
  spaceId: string;
  authorId: string;
  authorEmail: string;
  rating: number;
  body: string | null;
  createdAt: string;
}

export async function getReviews(spaceId: string): Promise<Review[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, space_id, author_id, rating, body, created_at, profiles(display_name)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });

  return (data ?? []).map(r => ({
    id: r.id,
    spaceId: r.space_id,
    authorId: r.author_id,
    authorEmail: (r.profiles as { display_name?: string } | null)?.display_name ?? 'Usuari',
    rating: r.rating,
    body: r.body ?? null,
    createdAt: r.created_at,
  }));
}

export async function addReview(spaceId: string, rating: number, body: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('reviews').insert({
    space_id: spaceId,
    author_id: user.id,
    rating,
    body: body.trim() || null,
  });
  if (error) throw new Error(error.message);
}

export async function getUserReview(spaceId: string): Promise<number | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('reviews')
    .select('rating')
    .eq('space_id', spaceId)
    .eq('author_id', user.id)
    .maybeSingle();
  return data?.rating ?? null;
}
