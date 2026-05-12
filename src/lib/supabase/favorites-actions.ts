'use server';

import { createClient } from './server';

/** Returns array of favorited space IDs for the current user. */
export async function getFavoriteIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', user.id);
  return (data ?? []).map(r => r.space_id as string);
}

/** Toggles a favorite. Returns true if now liked, false if unliked. Throws on error. */
export async function toggleFavorite(spaceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not-authenticated');

  const userId = user.id;

  const { data, error: selectError } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', userId)
    .eq('space_id', spaceId)
    .maybeSingle();
  if (selectError) throw selectError;

  if (data) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('space_id', spaceId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, space_id: spaceId });
    if (error) throw error;
    return true;
  }
}
