'use server';

import { createClient } from './server';
import { createAdminClient } from './admin';

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
  const supabase = await createClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, space_id, author_id, rating, body, created_at, profiles(display_name)')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((r: any) => ({
    id: r.id,
    spaceId: r.space_id,
    authorId: r.author_id,
    authorEmail: (r.profiles as { display_name?: string } | null)?.display_name ?? 'Usuari',
    rating: r.rating,
    body: r.body ?? null,
    createdAt: r.created_at,
  }));
}

export async function getUserDisplayName(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
  return data?.display_name ?? null;
}

export async function addReview(spaceId: string, rating: number, body: string, authorName?: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Use service role to bypass RLS for profile upsert
  const adminClient = createAdminClient();
  if (authorName?.trim()) {
    await adminClient.from('profiles').upsert(
      { id: user.id, display_name: authorName.trim() },
      { onConflict: 'id' },
    );
  } else {
    await adminClient.from('profiles').upsert(
      { id: user.id },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  }

  const { error } = await supabase.from('reviews').insert({
    space_id: spaceId,
    author_id: user.id,
    rating,
    body: body.trim() || null,
  });
  if (error) throw new Error(error.message);

  // Recalculate space rating using service role
  const admin = createAdminClient();
  const { data: rows } = await admin.from('reviews').select('rating').eq('space_id', spaceId);
  const list = rows ?? [];
  const count = list.length;
  const avg = count > 0 ? list.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / count : 0;
  await admin.from('spaces').update({ rating: avg, reviews_count: count }).eq('id', spaceId);
}

export async function getUserReview(spaceId: string): Promise<number | null> {
  const supabase = await createClient();
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
