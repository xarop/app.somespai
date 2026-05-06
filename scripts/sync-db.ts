/**
 * sync-db.ts — Sincronització bidireccional local ↔ producció
 *
 * Ús:
 *   bun run scripts/sync-db.ts status          # compara entorns (no modifica res)
 *   bun run scripts/sync-db.ts pull            # prod → local  (additive, prod guanya si slug coincideix)
 *   bun run scripts/sync-db.ts push            # local → prod  (safe: només afegeix slugs nous)
 *   bun run scripts/sync-db.ts push --force    # local → prod  (upsert: sobreescriu contingut, conserva IDs de prod)
 *
 * Taules sincronitzades: spaces (principal), profiles (opcional amb --with-profiles)
 * Auth users: NO es sincronitzen (seguretat). Reviews: no (IDs d'autor creuats).
 *
 * Requereix:
 *   .env.local              → credencials locals (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *   .env.production.local   → credencials de producció (mateixos noms de variables)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";

// ─── Env loading ─────────────────────────────────────────────────────────────

function loadEnv(file: string): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([^=#][^=]*)=(.*)$/);
      if (!m) continue;
      let val = m[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      out[m[1].trim()] = val;
    }
    return out;
  } catch {
    return {};
  }
}

const localEnv = loadEnv(".env.local");
const prodEnv  = loadEnv(".env.production.local");

const LOCAL_URL = localEnv.NEXT_PUBLIC_SUPABASE_URL  || "http://127.0.0.1:54321";
const LOCAL_KEY = localEnv.SUPABASE_SERVICE_ROLE_KEY;
const PROD_URL  = prodEnv.NEXT_PUBLIC_SUPABASE_URL;
const PROD_KEY  = prodEnv.SUPABASE_SERVICE_ROLE_KEY;

// ─── Args ─────────────────────────────────────────────────────────────────────

const command      = process.argv[2] as "status" | "pull" | "push" | undefined;
const force        = process.argv.includes("--force");
const withProfiles = process.argv.includes("--with-profiles");

if (!command || !["status", "pull", "push"].includes(command)) {
  console.error("Ús: bun run scripts/sync-db.ts <status|pull|push> [--force] [--with-profiles]");
  process.exit(1);
}

// ─── Clients ─────────────────────────────────────────────────────────────────

function makeClient(url: string, key: string, label: string): SupabaseClient {
  if (!url || !key) {
    console.error(`❌  Falten credencials per a "${label}". Comprova .env.local / .env.production.local`);
    process.exit(1);
  }
  return createClient(url, key);
}

const localDb = makeClient(LOCAL_URL, LOCAL_KEY!, "local");
const prodDb  = makeClient(PROD_URL!,  PROD_KEY!,  "producció");

// ─── Space type ───────────────────────────────────────────────────────────────

// lat/lng are GENERATED columns — cannot be inserted. Use location (WKT).
const SPACE_COLUMNS = [
  "id", "slug", "owner_id", "title", "description", "type",
  "price_cents", "currency", "size_m2",
  "address", "neighborhood", "city", "region",
  "lat", "lng",           // read-only, used to rebuild location
  "amenities", "photos", "is_featured", "rating", "reviews_count",
  "status", "price_unit", "phone", "email_contact", "whatsapp", "web", "contact_default",
  "created_at", "updated_at",
];

type SpaceRow = Record<string, unknown> & { slug: string; lat: number; lng: number; photos: string[] };

async function fetchSpaces(db: SupabaseClient): Promise<SpaceRow[]> {
  const { data, error } = await db
    .from("spaces")
    .select(SPACE_COLUMNS.join(", "))
    .order("created_at", { ascending: true });
  if (error) throw new Error(`fetchSpaces: ${error.message}`);
  return (data ?? []) as unknown as SpaceRow[];
}

// Rebuilds the location geography value from lat/lng
function toLocation(lat: number, lng: number): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

// Replaces localhost photo URLs with the prod equivalent
function remapPhotos(photos: string[], fromBase: string, toBase: string): string[] {
  return photos.map(url =>
    url.startsWith(fromBase) ? url.replace(fromBase, toBase) : url
  );
}

function buildUpsertRow(
  space: SpaceRow,
  opts: { includeId: boolean; sourceBase?: string; targetBase?: string },
) {
  const { includeId, sourceBase, targetBase } = opts;
  let photos = space.photos ?? [];
  if (sourceBase && targetBase) photos = remapPhotos(photos, sourceBase, targetBase);

  const row: Record<string, unknown> = {
    slug:            space.slug,
    owner_id:        space.owner_id ?? null,
    title:           space.title,
    description:     space.description ?? null,
    type:            space.type,
    price_cents:     space.price_cents,
    currency:        space.currency ?? "EUR",
    size_m2:         space.size_m2 ?? null,
    address:         space.address ?? null,
    neighborhood:    space.neighborhood ?? null,
    city:            space.city ?? null,
    region:          space.region ?? null,
    location:        toLocation(space.lat, space.lng),
    amenities:       space.amenities ?? [],
    photos,
    is_featured:     space.is_featured ?? false,
    rating:          space.rating ?? 0,
    reviews_count:   space.reviews_count ?? 0,
    status:          space.status ?? "active",
    price_unit:      space.price_unit ?? "month",
    phone:           space.phone ?? null,
    email_contact:   space.email_contact ?? null,
    whatsapp:        space.whatsapp ?? null,
    web:             space.web ?? null,
    contact_default: space.contact_default ?? "web",
    created_at:      space.created_at,
    updated_at:      space.updated_at,
  };
  if (includeId) row.id = space.id;
  return row;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

async function syncProfiles(
  source: SupabaseClient, sourceLabel: string,
  target: SupabaseClient, targetLabel: string,
) {
  console.log(`\n📋  Sincronitzant profiles: ${sourceLabel} → ${targetLabel}…`);
  const { data: profiles, error } = await source.from("profiles").select("id, display_name, bio, avatar_url");
  if (error) { console.error(`  ✗ Error llegint profiles: ${error.message}`); return; }

  let ok = 0, fail = 0;
  for (const p of profiles ?? []) {
    const { error: e } = await target.from("profiles").upsert(
      { id: p.id, display_name: p.display_name, bio: p.bio, avatar_url: p.avatar_url },
      { onConflict: "id", ignoreDuplicates: false },
    );
    if (e) { console.error(`  ✗ profile ${p.id}: ${e.message}`); fail++; } else ok++;
  }
  console.log(`  ✓ ${ok} profiles sincronitzats${fail ? `, ${fail} errors` : ""}`);
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function status() {
  console.log("🔍  Comparant entorns…\n");
  const [localSpaces, prodSpaces] = await Promise.all([
    fetchSpaces(localDb),
    fetchSpaces(prodDb),
  ]);

  const localMap  = new Map(localSpaces.map(s => [s.slug, s]));
  const prodMap   = new Map(prodSpaces.map(s => [s.slug, s]));

  const onlyLocal  = localSpaces.filter(s => !prodMap.has(s.slug));
  const onlyProd   = prodSpaces.filter(s => !localMap.has(s.slug));
  const inBoth     = localSpaces.filter(s => prodMap.has(s.slug));

  console.log(`📍  Local:      ${localSpaces.length} espais`);
  console.log(`🌐  Producció:  ${prodSpaces.length} espais`);
  console.log();

  if (onlyLocal.length) {
    console.log(`🟡  Només en local (${onlyLocal.length}):`);
    onlyLocal.forEach(s => console.log(`    + ${s.slug}  [${s.status}]`));
    console.log();
  }
  if (onlyProd.length) {
    console.log(`🔵  Només en producció (${onlyProd.length}):`);
    onlyProd.forEach(s => console.log(`    + ${s.slug}  [${s.status}]`));
    console.log();
  }
  if (inBoth.length) {
    console.log(`⚪  En ambdós entorns: ${inBoth.length} espais`);
    // Show diverged (different updated_at)
    const diverged = inBoth.filter(s => {
      const p = prodMap.get(s.slug)!;
      return s.updated_at !== p.updated_at;
    });
    if (diverged.length) {
      console.log(`\n⚠️   Divergents (updated_at diferent, ${diverged.length}):`);
      diverged.forEach(s => {
        const p = prodMap.get(s.slug)!;
        console.log(`    ~ ${s.slug}`);
        console.log(`        local: ${s.updated_at}`);
        console.log(`        prod:  ${p.updated_at}`);
      });
    }
    console.log();
  }

  console.log("💡  Per sincronitzar:");
  if (onlyLocal.length)  console.log(`    bun run scripts/sync-db.ts push            # envia ${onlyLocal.length} espai(s) nous a prod`);
  if (onlyProd.length)   console.log(`    bun run scripts/sync-db.ts pull            # baixa ${onlyProd.length} espai(s) nous de prod`);
  if (inBoth.length)     console.log(`    bun run scripts/sync-db.ts push --force    # sobreescriu prod amb versió local`);
}

async function pull() {
  console.log("⬇️   Pull: producció → local…\n");
  const prodSpaces = await fetchSpaces(prodDb);
  console.log(`  Llegits ${prodSpaces.length} espais de producció`);

  let created = 0, updated = 0, failed = 0;

  for (const space of prodSpaces) {
    const row = buildUpsertRow(space, {
      includeId: true,  // mirror prod IDs locally so reviews stay linked
    });

    const { error } = await localDb
      .from("spaces")
      .upsert(row, { onConflict: "slug", ignoreDuplicates: false });

    if (error) {
      console.error(`  ✗ ${space.slug}: ${error.message}`);
      failed++;
    } else {
      const exists = await localDb.from("spaces").select("id").eq("slug", space.slug).maybeSingle();
      if (exists.data) updated++; else created++;
    }
  }

  // Recount properly (upsert doesn't tell us if it created or updated)
  const { count: total } = await localDb.from("spaces").select("*", { count: "exact", head: true });
  console.log(`\n✅  Finalitzat. ${prodSpaces.length} processats, ${failed} errors.`);
  console.log(`   Local ara té ${total} espais.`);

  if (withProfiles) await syncProfiles(prodDb, "producció", localDb, "local");

  if (failed === 0) console.log("\n🎉  Local sincronitzat amb producció.");
}

async function push() {
  const modeLabel = force ? "push --force (upsert)" : "push safe (només nous)";
  console.log(`⬆️   Push: local → producció [${modeLabel}]…\n`);

  const [localSpaces, prodSpaces] = await Promise.all([
    fetchSpaces(localDb),
    fetchSpaces(prodDb),
  ]);

  const prodSlugs = new Set(prodSpaces.map(s => s.slug));
  const newSpaces    = localSpaces.filter(s => !prodSlugs.has(s.slug));
  const existingInBoth = localSpaces.filter(s => prodSlugs.has(s.slug));

  if (!force) {
    console.log(`  Nous a pujar: ${newSpaces.length}`);
    console.log(`  Ja existents a prod (seran ignorats): ${existingInBoth.length}`);
    if (!newSpaces.length) {
      console.log("\n✅  Cap espai nou. Producció ja té tots els espais locals.");
      console.log("   Per sobreescriure els existents: bun run scripts/sync-db.ts push --force");
      return;
    }
  } else {
    console.log(`  Total a processar: ${localSpaces.length} (${newSpaces.length} nous + ${existingInBoth.length} actualitzacions)`);
  }

  const spacesToSync = force ? localSpaces : newSpaces;
  let ok = 0, failed = 0, photosWarned = 0;

  // Detect local storage URL pattern
  const localStorageBase = LOCAL_URL.replace(/\/$/, "") + "/storage/v1/object/public";
  const prodStorageBase  = PROD_URL!.replace(/\/$/, "") + "/storage/v1/object/public";

  for (const space of spacesToSync) {
    // Check if photos reference local storage
    const hasLocalPhotos = space.photos?.some(p => p.includes("127.0.0.1") || p.includes(LOCAL_URL));
    if (hasLocalPhotos) photosWarned++;

    const row = buildUpsertRow(space, {
      includeId: false, // let prod keep its IDs; new rows get prod-generated UUIDs
      sourceBase: localStorageBase,
      targetBase: prodStorageBase,
    });

    const { error } = await prodDb
      .from("spaces")
      .upsert(row, { onConflict: "slug", ignoreDuplicates: !force });

    if (error) {
      console.error(`  ✗ ${space.slug}: ${error.message}`);
      failed++;
    } else {
      ok++;
      if (spacesToSync.length <= 20 || ok <= 5 || ok === spacesToSync.length) {
        console.log(`  ✓ ${space.slug}`);
      } else if (ok === 6) {
        console.log(`  … (${spacesToSync.length - 10} més)`);
      }
    }
  }

  console.log(`\n✅  Finalitzat. ${ok} processats, ${failed} errors.`);

  if (photosWarned > 0) {
    console.log(`\n⚠️   ${photosWarned} espai(s) tenien fotos apuntant a localhost.`);
    console.log(`   Executa per migrar-les: bun run scripts/sync-local-photos-to-prod.ts`);
  }

  if (withProfiles) await syncProfiles(localDb, "local", prodDb, "producció");
}

// ─── Run ──────────────────────────────────────────────────────────────────────

console.log(`\n🔄  sync-db  |  ${command}${force ? " --force" : ""}${withProfiles ? " --with-profiles" : ""}\n`);

(async () => {
  try {
    if (command === "status") await status();
    if (command === "pull")   await pull();
    if (command === "push")   await push();
  } catch (e) {
    console.error("\n❌  Error:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
})();
