'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function getProfileAction(): Promise<{ displayName: string | null; phone: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { displayName: null, phone: null };
  const { data } = await supabase
    .from('profiles')
    .select('display_name, phone')
    .eq('id', user.id)
    .maybeSingle();
  const row = data as { display_name?: string | null; phone?: string | null } | null;
  return { displayName: row?.display_name ?? null, phone: row?.phone ?? null };
}

export async function updateProfileAction(displayName: string, phone: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not-authenticated');
  const admin = getAdminClient();
  const { error } = await admin.from('profiles').upsert(
    { id: user.id, display_name: displayName.trim() || null, phone: phone.trim() || null },
    { onConflict: 'id' },
  );
  if (error) throw new Error(error.message);
}
