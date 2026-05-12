import { createClient } from './client';

export async function getFavoriteIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return new Set();
  const { data, error } = await supabase.from('favorites').select('space_id').eq('user_id', session.user.id);
  if (error) console.error('[favorites] select error:', error);
  return new Set((data ?? []).map(r => r.space_id as string));
}

/** Returns true if the space is now liked, false if unliked. Throws on DB error. */
export async function toggleFavorite(spaceId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('not-authenticated');

  const userId = session.user.id;

  const { data, error: selectError } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', userId)
    .eq('space_id', spaceId)
    .maybeSingle();
  if (selectError) throw selectError;

  if (data) {
    const { error: deleteError } = await supabase.from('favorites').delete().eq('user_id', userId).eq('space_id', spaceId);
    if (deleteError) throw deleteError;
    return false;
  } else {
    const { error: insertError } = await supabase.from('favorites').insert({ user_id: userId, space_id: spaceId });
    if (insertError) throw insertError;
    return true;
  }
}
