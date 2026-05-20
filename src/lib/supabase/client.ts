import { createBrowserClient } from '@supabase/ssr';
import { createMockClient } from './mock-client-browser';

/**
 * Browser-side Supabase client.
 * Safe to call from Client Components.
 */
export function createClient() {
  const isMock =
    process.env.NEXT_PUBLIC_MOCK_DB === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'mock' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http://mock');

  if (isMock) {
    return createMockClient(true);
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ==========================================================================
  // DEV BYPASS: Auto-login as ADMIN to make testing easy over local network
  // ==========================================================================
  let bypassEnabled = false;
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    try {
      bypassEnabled = window.localStorage.getItem('dev_admin_bypass') === 'true';
    } catch {
      // Ignored (e.g. Incognito mode blocking localStorage)
    }
  }

  if (bypassEnabled) {
    const mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;

    const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
    supabase.auth.getUser = async (jwt?) => {
      const result = await originalGetUser(jwt);
      if (result.data?.user) return result;
      return { data: { user: mockUser }, error: null } as any;
    };

    const originalGetSession = supabase.auth.getSession.bind(supabase.auth);
    supabase.auth.getSession = async () => {
      const result = await originalGetSession();
      if (result.data?.session) return result;
      return { data: { session: { user: mockUser, access_token: 'mock', refresh_token: 'mock' } }, error: null } as any;
    };

    const originalOnAuthStateChange = supabase.auth.onAuthStateChange.bind(supabase.auth);
    supabase.auth.onAuthStateChange = ((callback: any) => {
      const wrappedCallback = (event: any, session: any) => {
        if (!session) {
          callback(event, { user: mockUser, access_token: 'mock', refresh_token: 'mock' } as any);
        } else {
          callback(event, session);
        }
      };
      setTimeout(() => wrappedCallback('INITIAL_SESSION', null), 0);
      return originalOnAuthStateChange(wrappedCallback);
    }) as any;
  }

  return supabase;
}

