import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client. Reads cookies for the current session.
 * Use only inside Server Components, Route Handlers, or Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — cookies cannot be set here.
            // Middleware handles session refresh.
          }
        },
      },
    },
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
            id: '00000000-0000-0000-0000-000000000001', // Match seed.sql user
            email: process.env.ADMIN_EMAIL || 'hello@somespai.cat', // Ensures admin bypass passes
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

