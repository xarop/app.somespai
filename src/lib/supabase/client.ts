import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 * Safe to call from Client Components.
 */
export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // ==========================================================================
  // DEV BYPASS: Auto-login as ADMIN to make testing easy over local network
  // ==========================================================================
  if (process.env.NODE_ENV === 'development') {
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
    supabase.auth.getUser = async (jwt?) => {
      const { data, error } = await originalGetUser(jwt);
      if (data?.user) return { data, error };

      return {
        data: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'seed@somespai.cat',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
          } as any,
        },
        error: null,
      };
    };
  }

  return supabase;
}

