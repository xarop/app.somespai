/**
 * mass-import.ts — Importació massiva d'espais per Catalunya
 *
 * Executa el bulk-scraper per a totes les ciutats i tipus en seqüència.
 *
 * Ús:
 *   bun run scripts/mass-import.ts            # importa tot
 *   bun run scripts/mass-import.ts --dry-run  # mostra el pla sense executar
 *
 * Workflow recomanat:
 *   1. bun run db:pull                              ← sincronitza prod → local
 *   2. bun run scripts/mass-import.ts              ← importa a local
 *   3. bun run scripts/sync-local-photos-to-prod.ts ← puja fotos a producció
 *   4. bun run db:push                              ← publica espais nous a prod
 */

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Ciutats ─────────────────────────────────────────────────────────────────
// 4 capitals de província + 10 ciutats més poblades de Catalunya

const CITIES = [
  // Capitals de província
  "Barcelona",
  "Girona",
  "Tarragona",
  "Lleida",
  // Top 10 més poblades (sense les capitals ja incloses)
  "L'Hospitalet de Llobregat",
  "Badalona",
  "Terrassa",
  "Sabadell",
  "Mataró",
  "Santa Coloma de Gramenet",
  "Reus",
  "Cornellà de Llobregat",
  "Sant Cugat del Vallès",
  "Manresa",
] as const;

// ─── Tipus i queries ──────────────────────────────────────────────────────────

const TYPE_QUERIES: Record<string, (city: string) => string> = {
  storage:   (city) => `self storage ${city}`,
  workspace: (city) => `coworking ${city}`,
  room:      (city) => `alquiler sala reuniones eventos ${city}`,
  parking:   (city) => `alquiler parking plaza garaje ${city}`,
  garden:    (city) => `alquiler terraza jardín exterior ${city}`,
};

// ─── Pla ──────────────────────────────────────────────────────────────────────

const tasks: Array<{ query: string; type: string; city: string }> = [];

for (const [type, queryFn] of Object.entries(TYPE_QUERIES)) {
  for (const city of CITIES) {
    tasks.push({ query: queryFn(city), type, city });
  }
}

console.log(`\n📋  mass-import — ${tasks.length} cerques (${CITIES.length} ciutats × ${Object.keys(TYPE_QUERIES).length} tipus)`);
console.log(`\nCiutats: ${CITIES.join(", ")}`);
console.log(`Tipus:   ${Object.keys(TYPE_QUERIES).join(", ")}\n`);

if (DRY_RUN) {
  console.log("─── DRY RUN — cap importació executada ───────────────────────────────────\n");
  tasks.forEach(({ query, type }, i) =>
    console.log(`[${String(i + 1).padStart(2, "0")}/${tasks.length}]  ${type.padEnd(10)}  "${query}"`),
  );
  console.log("\nExecuta sense --dry-run per importar.");
  process.exit(0);
}

console.log("💡  Avís de cost Google Places API: ~70 text search + ~1400 place details");
console.log("    Cost estimat: ~$25-30 USD\n");
console.log("Iniciant en 3 segons... (Ctrl+C per cancel·lar)\n");
await Bun.sleep(3000);

// ─── Execució ─────────────────────────────────────────────────────────────────

let ok = 0;
let failed = 0;
const errors: string[] = [];

for (const { query, type, city } of tasks) {
  const idx = ok + failed + 1;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`[${idx}/${tasks.length}]  ${type}  ·  ${city}`);
  console.log(`Query: "${query}"`);
  console.log(`${"─".repeat(60)}`);

  const proc = Bun.spawn(
    ["bun", "run", "scripts/bulk-scraper.ts", query, type],
    { stdout: "inherit", stderr: "inherit" },
  );
  const code = await proc.exited;

  if (code === 0) {
    ok++;
  } else {
    failed++;
    errors.push(`[${type}] ${city} (codi ${code})`);
    console.error(`⚠️  Error en aquesta cerca (codi ${code}), continuant...`);
  }
}

// ─── Resum ────────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(60)}`);
console.log(`✅  Finalitzat: ${ok}/${tasks.length} importacions correctes`);
if (failed > 0) {
  console.log(`⚠️  ${failed} errors:`);
  errors.forEach(e => console.log(`   · ${e}`));
}
console.log(`\n📌  Passos següents:`);
console.log(`   bun run scripts/sync-local-photos-to-prod.ts   # migra fotos a producció`);
console.log(`   bun run db:push                                # publica espais nous`);
console.log(`${"═".repeat(60)}\n`);
