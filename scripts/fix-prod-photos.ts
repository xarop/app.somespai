/**
 * fix-prod-photos.ts
 * Reads local DB (which still has 127.0.0.1 photo URLs), downloads each file
 * from local Supabase storage, and uploads it to production storage.
 * Production DB already has the correct prod URLs (set by db:push), so no DB update needed.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

function loadEnv(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([^=#][^=]*)=(.*)/);
      if (!m) continue;
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      out[m[1].trim()] = v;
    }
  } catch {}
  return out;
}

const local = loadEnv(".env.local");
const prod  = loadEnv(".env.production.local");

const localDb = createClient(local.NEXT_PUBLIC_SUPABASE_URL!, local.SUPABASE_SERVICE_ROLE_KEY!);
const prodDb  = createClient(prod.NEXT_PUBLIC_SUPABASE_URL!,  prod.SUPABASE_SERVICE_ROLE_KEY!);

const { data, error } = await localDb.from("spaces").select("slug, photos");
if (error) { console.error("Fetch error:", error.message); process.exit(1); }

const withLocal = (data ?? []).filter(s =>
  (s.photos as string[])?.some(p => p.includes("127.0.0.1"))
);

console.log(`Espais amb fotos locals: ${withLocal.length}`);

let done = 0, fail = 0, total = 0;

for (const space of withLocal) {
  for (const url of (space.photos as string[]).filter(p => p.includes("127.0.0.1"))) {
    total++;
    const parts = url.split("/space-photos/");
    if (parts.length < 2) { fail++; continue; }
    const path = parts[1];

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());

      const { error: uploadErr } = await prodDb.storage
        .from("space-photos")
        .upload(path, buf, { contentType: "image/webp", upsert: true });

      if (uploadErr && !uploadErr.message.includes("already")) {
        throw new Error(uploadErr.message);
      }
      done++;
      if (done % 50 === 0 || done === total) process.stdout.write(`\r  ${done}/${total} pujades...`);
    } catch (ex: unknown) {
      fail++;
      const msg = ex instanceof Error ? ex.message : String(ex);
      console.error(`\n  ✗ ${space.slug} — ${path}: ${msg}`);
    }
  }
}

console.log(`\n\n✅  Finalitzat. Pujades: ${done}  Errors: ${fail}  Total: ${total}`);
