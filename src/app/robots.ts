import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'; // host-aware, must run per request

const FALLBACK_HOST = 'app.somespai.net';

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Derive the base URL from the request host so robots.txt is correct on
  // every domain this codebase serves (Somespai, CoSlot, previews…).
  let host = FALLBACK_HOST;
  try {
    const h = await headers();
    host = h.get('host') || FALLBACK_HOST;
  } catch {
    /* static-generation context — fall back to the canonical host */
  }
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const base = `${proto}://${host}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Only the API and admin panel are kept out — they hold no indexable
        // content. Every public page (all locales, cities, spaces) is allowed.
        disallow: ['/api/', '/*/api/', '/admin', '/*/admin'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
