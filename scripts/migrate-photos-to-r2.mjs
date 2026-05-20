/**
 * Migrates all space photos from Supabase Storage to Cloudflare R2.
 *
 * Usage (after June 4 when Supabase quota resets, or after upgrading to Pro):
 *   node scripts/migrate-photos-to-r2.mjs
 *
 * Requires .env.local with all SUPABASE_* and R2_* variables set.
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local manually
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env.local');
const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const R2_ACCOUNT_ID = envVars.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = envVars.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = envVars.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = envVars.R2_BUCKET_NAME;
const R2_PUBLIC_URL = envVars.R2_PUBLIC_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function uploadToR2(imageBuffer, contentType, key) {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: imageBuffer,
    ContentType: contentType || 'image/jpeg',
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
  console.log('Fetching spaces with Supabase Storage photos...');

  const { data: spaces, error } = await supabase
    .from('spaces')
    .select('id, slug, photos')
    .not('photos', 'eq', '{}');

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  const supabaseBase = SUPABASE_URL + '/storage/v1/object/public/';
  const toMigrate = spaces.filter(s => s.photos?.some(u => u.startsWith(supabaseBase)));

  console.log(`Found ${spaces.length} spaces total, ${toMigrate.length} with Supabase photos.\n`);

  let migrated = 0, skipped = 0, failed = 0;

  for (const space of toMigrate) {
    const newPhotos = [];
    let changed = false;

    for (const url of space.photos) {
      if (!url.startsWith(supabaseBase)) {
        newPhotos.push(url); // already R2 or external
        continue;
      }

      // Extract original path (e.g. space-photos/user123/12345-abc.jpg)
      const storagePath = url.slice(supabaseBase.length); // e.g. space-photos/userId/file.jpg
      const key = storagePath; // reuse same path in R2

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const r2Url = await uploadToR2(buffer, contentType, key);
        newPhotos.push(r2Url);
        changed = true;
        migrated++;
        console.log(`  ✓ ${space.slug}: ${url.split('/').pop()} → R2`);
      } catch (err) {
        console.error(`  ✗ ${space.slug}: ${url.split('/').pop()} — ${err.message}`);
        newPhotos.push(url); // keep original on failure
        failed++;
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('spaces')
        .update({ photos: newPhotos })
        .eq('id', space.id);
      if (updateErr) console.error(`  ✗ DB update failed for ${space.slug}: ${updateErr.message}`);
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. Migrated: ${migrated} | Failed: ${failed} | Skipped: ${skipped}`);
  if (failed > 0) console.log('Re-run the script to retry failed photos.');
}

main().catch(console.error);
