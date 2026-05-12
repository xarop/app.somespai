import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ auth: false, authError: authError?.message ?? null });
  }

  // Read favorites for this user bypassing RLS to verify DB state
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: favorites, error: favError } = await serviceClient
    .from('favorites')
    .select('space_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Also try a direct insert+delete as the user (via anon key + RLS)
  const { error: insertError } = await supabase
    .from('favorites')
    .upsert({ user_id: user.id, space_id: '00000000-0000-0000-0000-000000000000' })
    .select();

  const { error: deleteError } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('space_id', '00000000-0000-0000-0000-000000000000');

  return NextResponse.json({
    auth: true,
    userId: user.id,
    email: user.email,
    favorites: favorites ?? [],
    favoritesError: favError?.message ?? null,
    insertTest: insertError
      ? { ok: false, error: insertError.message, code: insertError.code }
      : { ok: true },
    deleteTest: deleteError
      ? { ok: false, error: deleteError.message }
      : { ok: true },
  });
}
