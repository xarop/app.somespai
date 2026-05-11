import { createClient } from '@/lib/supabase/server';

export class AdminAuthError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

export async function requireAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new AdminAuthError(401, 'UNAUTHENTICATED', 'Not authenticated');

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (user.email === adminEmail) return { userId: user.id };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    throw new AdminAuthError(403, 'FORBIDDEN', 'Admin access required');
  }

  return { userId: user.id };
}
