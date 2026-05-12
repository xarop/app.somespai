import { createClient } from './client';

export async function getFavoriteIds(): Promise<Set<string>> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) console.error('[favorites] getUser error:', authError);
  if (!user) { console.warn('[favorites] getFavoriteIds: no user'); return new Set(); }
  const { data, error } = await supabase.from('favorites').select('space_id').eq('user_id', user.id);
  if (error) console.error('[favorites] select error:', error);
  return new Set((data ?? []).map(r => r.space_id as string));
}

export async function toggleFavorite(spaceId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) console.error('[favorites] getUser error:', authError);
  if (!user) { console.warn('[favorites] toggleFavorite: no user'); return false; }

  const { data, error: selectError } = await supabase
    .from('favorites')
    .select('space_id')
    .eq('user_id', user.id)
    .eq('space_id', spaceId)
    .maybeSingle();
  if (selectError) console.error('[favorites] select error:', selectError);

  if (data) {
    const { error: deleteError } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('space_id', spaceId);
    if (deleteError) console.error('[favorites] delete error:', deleteError);
    return false;
  } else {
    const { error: insertError } = await supabase.from('favorites').insert({ user_id: user.id, space_id: spaceId });
    if (insertError) console.error('[favorites] insert error:', insertError);
    return !insertError;
  }
}
