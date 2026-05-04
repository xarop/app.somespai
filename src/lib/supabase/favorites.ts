import { createClient } from './client';

export async function getFavoriteIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase.from('favorites').select('space_id').eq('user_id', user.id);
  return new Set((data ?? []).map(r => r.space_id as string));
}

export async function toggleFavorite(spaceId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', user.id)
    .eq('space_id', spaceId)
    .maybeSingle();

  if (data) {
    await supabase.from('favorites').delete().eq('user_id', user.id).eq('space_id', spaceId);
    return false;
  } else {
    await supabase.from('favorites').insert({ user_id: user.id, space_id: spaceId });
    return true;
  }
}
