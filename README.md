# app.somespai

> Marketplace P2P d'espais a Vila de Gràcia. Trasters, estudis, jardins i sales.

**Demo:** https://app.somespai.net/

**Filosofia**: minimalisme radical, geolocalització, acord econòmic extern, mòbil-first.

---

## Stack

- **Next.js 15** (App Router, RSC)
- **Supabase** (Postgres + PostGIS, Auth magic-link, Storage, RLS)
- **MapLibre GL JS** (open-source maps)
- **next-intl** (CA / ES / EN)
- **CSS natiu** amb `@layer` — sense Tailwind, sense CSS-in-JS

Tot el codi en anglès. Tota la UI traduïble.

---

## Documentació

Llegeix abans de tocar el codi:

- [`DESIGN.md`](./DESIGN.md) — sistema de disseny (colors, tipografia, components)
- [`AGENTS.md`](./AGENTS.md) — arquitectura, model de dades, convencions

I la ruta interactiva: `/design-system`.

---

## Setup local

### 1. Requisits

- Node.js 20+ / Bun
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`)
- Docker (per al Supabase local)

### 2. Instal·la dependències

```bash
bun install
```

### 3. Variables d'entorn

```bash
cp .env.example .env.local
# Edita .env.local amb les claus del teu projecte Supabase
```

Per a desenvolupament local, `npx supabase start` genera les claus automàticament i les pots copiar des de `npx supabase status`.

### 4. Base de dades local

```bash
# Arrenca Supabase local (Docker)
npx supabase start

# Aplica totes les migracions i el seed amb les dades inicials
npx supabase db reset --local
```

El `db reset` aplica les migracions de `supabase/migrations/` i executa `supabase/seed.sql` (27 espais reals de Barcelona).

### 5. Arrenca l'app

```bash
bun dev
# → http://localhost:3000/ca
```

Català és el locale per defecte. Prova també `/es` i `/en`.

---

## Migracions

| Fitxer | Contingut |
|--------|-----------|
| `0001_init.sql` | Esquema inicial: `profiles`, `spaces`, `reviews`, `favorites`, RLS, RPC `nearby_spaces` |
| `0002_add_space_extra_fields.sql` | Afegeix `price_unit`, `contact_url`, `rating`, `reviews_count`, columnes generades `lat`/`lng` |
| `0003_storage_photos.sql` | Bucket `space-photos` (públic, 5 MB, imatges) + RLS: lectura pública, pujada/eliminació per propietari |

---

## Desplegament a producció

### Vercel

URL producció: https://app-somespai.vercel.app
Dashboard: https://vercel.com/xarops-projects/app-somespai
CNAME app cname.vercel-dns.com

**Primer desplegament (una sola vegada):**

```bash
# Instal·la la CLI de Vercel
npm install -g vercel

# Login i link al projecte existent
vercel login
vercel --prod
# → selecciona "xarop's projects" i linkeu a "xarops-projects/app-somespai"
```

**Variables d'entorn** — afegir al projecte Vercel (una sola vegada):

```bash
echo "https://<ref>.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "<anon-key>"               | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "<service-role-key>"       | vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

Les claus es troben a: https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx/settings/api

**Desplegaments habituals** — simplement fes push a `main`:

```bash
git push origin main   # Vercel desplega automàticament si GitHub està connectat
# o bé manualment:
vercel --prod
```

> Nota: el lockfile és `bun.lockb` — no incloure `package-lock.json` al repo o Vercel fallarà.

---

### Supabase Cloud

Projecte: https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx

**Primera vegada — link i migracions:**

```bash
npx supabase login
npx supabase link --project-ref nkdmysztmgerwhrklzhx

# Aplica l'esquema al cloud
npx supabase db push

# Carrega les dades inicials (27 espais)
npx supabase db query --linked -f supabase/seed.sql
```

**Quan s'afegeix una nova migració:**

```bash
npx supabase db push
```

---

## Arquitectura de dades

Les pàgines principals són **Server Components** que fan fetch a Supabase i passen les dades als Client Components:

```
page.tsx (server) → getSpaces() → HomeClient (client)
espai/[slug]/page.tsx (server) → getSpaceBySlug() → SpaceDetailClient (client)
```

Totes les queries van per `src/lib/supabase/spaces.ts`. Cap component de client toca Supabase directament.

---

## Phase 1 — fet

- ✅ Estructura del repo (`src/app`, `src/components`, `src/lib`, `messages`, `styles`)
- ✅ Sistema CSS en capes (`tokens` → `elements` → `components` → `utilities`)
- ✅ i18n amb `ca`, `es`, `en` (CA per defecte)
- ✅ Home: mapa MapLibre centrat a Vila de Gràcia + llista filtrable
- ✅ 27 espais reals de Barcelona (Gràcia, Poblenou, Eixample, Teià) carregats des de Supabase
- ✅ URLs compartibles (`/[locale]/espai/[slug]`)
- ✅ `/design-system` galeria interactiva de components
- ✅ Postgres + PostGIS operatiu en local i en cloud
- ✅ RLS configurat (default deny, políiques per taula)

## Phase 2 — fet

- ✅ Auth amb magic-link (`signInWithOtp`) + callback route + sessió persistent via middleware
- ✅ TopNav reescrit: botó "Publica un espai" sempre visible; resta d'accions dins hamburger menu
- ✅ Formulari de creació d'espai (`/publica`): tipus, preu, mida, ubicació (geocodificació Nominatim), amenitats, fotos, contacte
- ✅ Pujada de fotos a Supabase Storage (`space-photos` bucket, carpeta per usuari, 5 MB)
- ✅ Preferits persistits a DB amb optimistic update
- ✅ Ressenyes: llistat + formulari amb star rating (StarRating component)
- ✅ Web Share API a la pàgina de detall
- ✅ Endpoint d'importació admin: `POST /api/admin/import` (autenticació per service role key)
- ✅ Badge verificat per espais amb `ownerVerified`

**Endpoint d'importació:**

```bash
curl -X POST https://app.somespai.net/api/admin/import \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '[{"slug":"...", "title":"...", ...}]'
```

---

## License

Proprietary. © Somespai.
