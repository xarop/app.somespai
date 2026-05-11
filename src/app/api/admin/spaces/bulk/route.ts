import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin, AdminAuthError } from '@/lib/api/admin';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
  action: z.enum(['activate', 'pause', 'remove', 'verify', 'unverify']),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid params', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { ids, action } = parsed.data;
  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const update: Record<string, unknown> =
    action === 'activate' ? { status: 'active' }
    : action === 'pause' ? { status: 'paused' }
    : action === 'remove' ? { status: 'removed' }
    : action === 'verify' ? { verified: true }
    : { verified: false };

  const { error } = await db.from('spaces').update(update).in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ updated: ids.length });
}
