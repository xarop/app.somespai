/**
 * Downloads all space photos, converts to WebP and uploads to Supabase Storage.
 * Run: node scripts/mirror-photos.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.production.local
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

// Read env from .env.production.local
const env = {};
try {
  for (const line of readFileSync('.env.production.local', 'utf8').split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k?.trim() && rest.length)
      env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
  }
} catch { /* ignore */ }

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'space-photos';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Verified fallback photos by type (Unsplash)
const TYPE_FALLBACK = {
  storage:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  workspace: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  garden:    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
  room:      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=1200&q=80',
};

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Somespai/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.startsWith('image/')) throw new Error(`Not an image: ${ct}`);
  return Buffer.from(await res.arrayBuffer());
}

async function getMicrolinkScreenshot(url) {
  const api = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
  const res = await fetch(api, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.screenshot?.url ?? null;
}

// Query all spaces
const { data: spaces, error: qErr } = await supabase
  .from('spaces')
  .select('id, slug, type, photos');

if (qErr) { console.error(qErr.message); process.exit(1); }

let ok = 0, skip = 0, fail = 0;

for (const space of spaces ?? []) {
  const originalUrl = space.photos?.[0];

  // Already on our Storage
  if (originalUrl?.includes('supabase.co/storage')) {
    process.stdout.write(`⏭  ${space.slug}\n`);
    skip++;
    continue;
  }

  process.stdout.write(`⬇  ${space.slug} `);

  let buffer = null;
  let source = '';

  // 1. Try original URL directly
  if (originalUrl && !originalUrl.includes('thum.io') && !originalUrl.includes('unsplash.com')) {
    try {
      buffer = await fetchBuffer(originalUrl);
      source = 'original';
    } catch { /* try next */ }
  }

  // 2. For thum.io or failed: try Microlink screenshot of the space's website
  if (!buffer && originalUrl) {
    const siteUrl = originalUrl.includes('thum.io')
      ? decodeURIComponent(originalUrl.split('/').pop())
      : null;
    if (siteUrl) {
      try {
        process.stdout.write('[microlink] ');
        const screenshotUrl = await getMicrolinkScreenshot(siteUrl);
        if (screenshotUrl) {
          buffer = await fetchBuffer(screenshotUrl);
          source = 'microlink';
        }
      } catch { /* try next */ }
    }
  }

  // 3. Unsplash: download directly
  if (!buffer && originalUrl?.includes('unsplash.com')) {
    try {
      buffer = await fetchBuffer(originalUrl);
      source = 'unsplash';
    } catch { /* try next */ }
  }

  // 4. Type-based fallback
  if (!buffer) {
    const fallbackUrl = TYPE_FALLBACK[space.type] ?? TYPE_FALLBACK.workspace;
    try {
      buffer = await fetchBuffer(fallbackUrl);
      source = `fallback:${space.type}`;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      fail++;
      continue;
    }
  }

  try {
    // Convert to WebP 1200×630
    const webp = await sharp(buffer)
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toBuffer();

    const storagePath = `admin/${space.slug}.webp`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, webp, { contentType: 'image/webp', upsert: true });
    if (uploadErr) throw new Error(uploadErr.message);

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const { error: updateErr } = await supabase
      .from('spaces')
      .update({ photos: [publicUrl] })
      .eq('id', space.id);
    if (updateErr) throw new Error(updateErr.message);

    console.log(`✓ ${source} (${(webp.length / 1024).toFixed(0)} KB)`);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    fail++;
  }

  await new Promise(r => setTimeout(r, 400));
}

console.log(`\nDone: ${ok} uploaded, ${skip} already on Storage, ${fail} failed`);
