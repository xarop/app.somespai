/**
 * Downscales already-uploaded space photos to a mobile-friendly size.
 *
 * For every photo hosted on Cloudflare R2 it downloads the object, resizes it
 * so the longest side is at most 1280px (re-encoding to JPEG q80, honouring
 * EXIF orientation) and re-uploads it under the SAME key — so the public URL
 * doesn't change and no DB update is needed. Photos already within bounds are
 * left untouched.
 *
 * R2 egress is free, so reprocessing R2-hosted photos costs nothing in
 * transfer. Photos still on Supabase Storage are skipped (migrate them first
 * with scripts/migrate-photos-to-r2.mjs).
 *
 * Usage:
 *   node scripts/resize-existing-photos.mjs --dry-run   # preview only
 *   node scripts/resize-existing-photos.mjs             # apply
 *
 * Requires .env.local with all SUPABASE_* and R2_* variables set.
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const MAX_DIMENSION = 1280; // longest side, must match src/lib/images/resize-image.ts
const JPEG_QUALITY = 80;

const DRY_RUN = process.argv.includes('--dry-run');

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
const R2_PUBLIC_URL = envVars.R2_PUBLIC_URL?.replace(/\/$/, '');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — no uploads will be made.\n' : 'Resizing existing R2 photos in place...\n');

  const { data: spaces, error } = await supabase
    .from('spaces')
    .select('id, slug, photos')
    .not('photos', 'eq', '{}');

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  const r2Base = R2_PUBLIC_URL + '/';
  let resized = 0, skipped = 0, failed = 0, savedBytes = 0;

  for (const space of spaces) {
    for (const url of space.photos ?? []) {
      if (!url.startsWith(r2Base)) {
        skipped++; // not on R2 (Supabase / external) — leave alone
        continue;
      }
      const key = url.slice(r2Base.length);

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const input = Buffer.from(await res.arrayBuffer());

        const img = sharp(input, { failOn: 'none' }).rotate(); // rotate() applies EXIF orientation
        const meta = await img.metadata();
        const longest = Math.max(meta.width ?? 0, meta.height ?? 0);

        if (longest <= MAX_DIMENSION && meta.format === 'jpeg') {
          skipped++;
          continue; // already small enough
        }

        const output = await img
          .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY })
          .toBuffer();

        if (output.length >= input.length) {
          skipped++;
          continue; // re-encode didn't help
        }

        const saved = input.length - output.length;
        savedBytes += saved;
        console.log(`  ✓ ${space.slug}: ${key.split('/').pop()} ${fmtKB(input.length)} → ${fmtKB(output.length)} (-${fmtKB(saved)})`);

        if (!DRY_RUN) {
          await r2.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: output,
            ContentType: 'image/jpeg',
          }));
        }
        resized++;
      } catch (err) {
        console.error(`  ✗ ${space.slug}: ${key.split('/').pop()} — ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone. Resized: ${resized} | Skipped: ${skipped} | Failed: ${failed} | Saved: ${fmtKB(savedBytes)}`);
  if (DRY_RUN) console.log('Re-run without --dry-run to apply.');
}

main().catch(console.error);
