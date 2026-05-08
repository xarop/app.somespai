import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  let { data: { user } } = await supabase.auth.getUser();

  if (process.env.NODE_ENV === 'development' && !user) {
    user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'seed@BRAND_NAME_PLACEHOLDER.cat',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
    } as any;
  }

  // Protect /admin — redirect unauthenticated users to home
  if (!user && /\/admin/.test(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  // Run i18n middleware and copy Supabase auth cookies to its response
  const intlResponse = intlMiddleware(request);
  supabaseResponse.cookies.getAll().forEach(c =>
    intlResponse.cookies.set(c.name, c.value)
  );
  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
