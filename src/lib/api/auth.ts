import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

function adminClient() {
  return createAdminClient();
}

export type ApiAuth = { scopes: string[] };

export class ApiAuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function requireApiKey(req: Request): Promise<ApiAuth> {
  const key = req.headers.get('x-api-key') ?? '';
  if (!key) {
    throw new ApiAuthError(401, 'UNAUTHENTICATED', 'Missing X-API-Key header');
  }

  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 8);

  const db = adminClient();
  const { data, error } = await db
    .from('api_keys')
    .select('id, scopes')
    .eq('key_hash', hash)
    .eq('key_prefix', prefix)
    .is('revoked_at', null)
    .single();

  if (error || !data) {
    throw new ApiAuthError(401, 'UNAUTHENTICATED', 'Invalid or revoked API key');
  }

  // Update last_used_at
  await db
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', (data as { id: string }).id);

  return { scopes: (data as { scopes: string[] }).scopes };
}

export function requireScope(auth: ApiAuth, scope: string): void {
  if (!auth.scopes.includes(scope)) {
    throw new ApiAuthError(403, 'FORBIDDEN', `Required scope: ${scope}`);
  }
}
