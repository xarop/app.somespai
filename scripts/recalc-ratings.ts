/**
 * recalc-ratings.ts
 * One-off: recalculates rating and reviews_count for all spaces
 * that have reviews but show 0 due to the missing recalc bug.
 * Run: bun scripts/recalc-ratings.ts
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

const env = loadEnv(".env.production.local");
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: reviews, error } = await supabase.from("reviews").select("space_id, rating");
if (error) { console.error(error.message); process.exit(1); }

// Group by space_id
const map = new Map<string, number[]>();
for (const r of reviews ?? []) {
  if (!map.has(r.space_id)) map.set(r.space_id, []);
  map.get(r.space_id)!.push(r.rating);
}

console.log(`Espais amb ressenyes: ${map.size}`);
let updated = 0;

for (const [spaceId, ratings] of map) {
  const count = ratings.length;
  const avg = ratings.reduce((s, r) => s + r, 0) / count;
  const { error: e } = await supabase
    .from("spaces")
    .update({ rating: Math.round(avg * 100) / 100, reviews_count: count })
    .eq("id", spaceId);
  if (e) console.error(`  ✗ ${spaceId}: ${e.message}`);
  else updated++;
}

console.log(`✅ Actualitzats: ${updated}  Errors: ${map.size - updated}`);
