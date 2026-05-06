# app.somespai

> Marketplace P2P d'espais a Barcelona i Catalunya. Trasters, estudis, jardins, sales i pàrquings.

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
| `0004_add_contact_fields.sql` | Afegeix `phone`, `email_contact`, `whatsapp`, `web`, `contact_default` a `spaces` |
| `0005_add_space_fields.sql` | Afegeix `address`, `neighborhood`, `region`, `owner_id` i RLS per propietari |
| `0006_admin_storage_policy.sql` | Política RLS que permet a l'admin pujar/eliminar qualsevol foto |
| `0007_profiles_self_insert.sql` | Política RLS que permet als usuaris autenticats crear el seu propi perfil (necessari per ressenyes) |

---

## Desplegament a producció

### Vercel
URL develop: https://app-somespai.vercel.app 
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
admin/page.tsx (server, admin only) → getAllSpacesAdmin() → AdminDashboard (client)
  · pestanya usuaris → getUsersAction() (lazy, client-side) → UsersTab
editar/[slug]/page.tsx (server, owner only) → getSpaceBySlugForOwner() → EditSpaceForm (client)
perfil/page.tsx (server, auth) → getSpacesByOwner() → llista d'espais
```

Totes les queries públiques van per `src/lib/supabase/spaces.ts`. Les operacions d'admin utilitzen el service-role client a `src/lib/supabase/admin.ts`. Les pàgines SEO utilitzen `src/lib/supabase/spaces-seo.ts` (service-role sense cookies, apte per `generateStaticParams`).

---

## Variables d'entorn

| Variable | On es troba |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (secret) |
| `ADMIN_EMAIL` | Correu de l'administrador (accés al dashboard `/admin`) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Igual que `ADMIN_EMAIL` però accessible al client (fallback per a dev local) |

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

**Endpoint d'importació (API):**

```bash
curl -X POST https://app.somespai.net/api/admin/import \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '[{"slug":"...", "title":"...", ...}]'
```

**Eina d'importació massiva (Script):**

L'eina `scripts/bulk-scraper.ts` permet importar llistats d'espais cercant a la xarxa a través de Google Places API i incloent les imatges optimitzades a WebP. Deixa els espais al panell com a "Pausats" per a la seva revisió.
Calen les variables d'entorn següents a `.env.local`: `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, i `SUPABASE_SERVICE_ROLE_KEY`.

```bash
# Exemple per descarregar trasters de Badalona passant-los al tipus 'storage':
bun run scripts/bulk-scraper.ts "trasteros en Badalona" storage

# Exemple per sales de coworking de Gràcia passant-los al tipus 'workspace':
bun run scripts/bulk-scraper.ts "coworking a Gràcia" workspace
```

## Phase 3 — fet

### Dashboard d'administrador (`/[locale]/admin`)

Accés exclusiu a l'usuari amb `ADMIN_EMAIL`. Protegit per middleware i guard de servidor.

Dues pestanyes:

**Pestanya Espais:**
- Taula de tots els espais (totes les estats: actius, pausats, eliminats)
- Estadístiques: total, publicats, pausats, eliminats, destacats
- Filtres: estat · tipus d'espai · destacats · cerca lliure de text
- Accions ràpides per fila: publicar/pausar, destacar/treure destacat, eliminar
- Modal d'edició completa: tots els camps del DB (títol, tipus, descripció, preu, ubicació amb geocodificació, amenitats, fotos, contacte, estat, destacat)
- Gestió de fotos: eliminar existents + pujar noves
- Gestió de ressenyes: editar rating/text, eliminar, recàlcul automàtic de puntuació
- Icona d'edició directa (✏) als cards i a la fitxa de l'espai quan l'usuari és admin

**Pestanya Usuaris:**
- Taula de tots els usuaris registrats (email, nom, data d'alta, últim accés, nº d'espais)
- Cerca per email o nom
- Eliminació d'usuari amb confirmació
- Càrrega lazy en primer clic (no bloqueja si l'API auth falla)

**Accés:** `https://app.somespai.net/ca/admin`

### Edició d'espais per propietari (`/[locale]/editar/[slug]`)

Els usuaris autenticats poden editar els seus propis espais.

**Funcionalitats:**
- Formulari complet pre-emplenat amb les dades actuals
- Gestió de fotos: eliminar existents + pujar noves
- Control d'estat: publicar o pausar (no visible temporalment)
- Eliminació de l'espai amb confirmació
- Icona d'edició directa (✏) als cards i a la fitxa quan l'usuari és el propietari

### Perfil d'usuari (`/[locale]/perfil`)

Llista tots els espais publicats (i pausats) per l'usuari autenticat, amb accés directe a l'edició.

**Accés:** menú superior → "Els meus espais" (quan s'és autenticat)

---

## Phase 4 — fet

### Header simplificat per pàgines de contingut (`PageNav`)

El `TopNav` (amb cercador) s'utilitza només a la home i la fitxa d'espai. Totes les pàgines de contingut (ajuda, design-system, perfil, publica, editar, admin) utilitzen el nou component `PageNav` que inclou logo + botó "Publica un espai" + hamburger menú, però **sense el cercador**.

- `src/components/ui/top-nav.tsx` — nav complet (home + fitxa d'espai)
- `src/components/ui/page-nav.tsx` — nav simplificat (totes les altres pàgines)

### Ressenyes per admin

Al modal d'edició del dashboard d'admin s'han afegit:
- Llistat de totes les ressenyes d'un espai
- Edició inline de rating i text
- Eliminació amb confirmació
- Recàlcul automàtic del rating de l'espai

### Pàgines SEO de ciutats

Generades estàticament per a totes les ciutats que tinguin espais actius:

Generades estàticament per a totes les ciutats amb espais actius i per a cada combinació de ciutat + tipus:

| Ruta | Contingut |
|------|-----------|
| `/[city]/` | Tots els espais d'una ciutat (e.g., `/barcelona/`) |
| `/[city]/estudis/` | Estudis a la ciutat |
| `/[city]/sales/` | Sales polivalents a la ciutat |
| `/[city]/trasters/` | Trasters a la ciutat |
| `/[city]/jardins/` | Exteriors a la ciutat |
| `/[city]/parking/` | Pàrquings a la ciutat |

Les URLs de tipus estan localitzades: `/barcelona/parking` (CA/EN) · `/es/barcelona/parking` (ES). El component de cada pàgina és el mateix `HomeClient` que la home (mapa + llista), amb filtre i context preestablerts.

### Llistat complet d'espais (`/espais/`)

Pàgina sense mapa amb tots els espais actius. Inclou:
- Filtres per tipus, ciutat, amenitats, puntuació mínima i preu màxim
- Actualització en temps real client-side
- Cada fila amb link directe a `/espai/[slug]`
- Pensada per a la indexació SEO de totes les URLs individuals

**Ruta:** `https://app.somespai.net/espais`

---

## Sincronització de dades Local ↔ Producció

L'eina `scripts/sync-db.ts` permet sincronitzar la taula `spaces` entre l'entorn local i producció sense perdre dades en cap dels dos entorns.

### Prerequisits

Crea `.env.production.local` a l'arrel del projecte amb les credencials de producció:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Comandes

```bash
# Compara els dos entorns (no modifica res)
bun run db:status

# Baixa espais de producció a local (additive, prod guanya si slug coincideix)
bun run db:pull

# Puja espais nous de local a producció (safe: només afegeix slugs nous)
bun run db:push

# Puja i sobreescriu espais a producció (conserva IDs de prod)
bun run db:push:force
```

| Comanda | Direcció | Comportament |
|---------|----------|-------------|
| `db:status` | lectura | Mostra espais únics a cada entorn i divergències |
| `db:pull` | prod → local | Upsert complet; prod guanya els conflictes de slug |
| `db:push` | local → prod | Insereix **només** slugs nous (segur, no sobreescriu) |
| `db:push:force` | local → prod | Upsert complet; els IDs de prod es conserven |

**Notes:**
- Les fotos amb URL de localhost es remapen automàticament a l'URL de producció.
- Les ressenyes i els usuaris auth **no** es sincronitzen (IDs creuats / seguretat).
- Afegeix `--with-profiles` per sincronitzar també la taula `profiles`.

---

## Migració de dades Local a Producció (mètode manual)

Si prefereixes fer un dump complet en lloc d'usar `sync-db.ts`:

1. **Genera o actualitza el dump local** de només les dades:
   ```bash
   npx supabase db dump --local --data-only -f supabase/data_dump.sql
   ```
2. **Puja-ho a Producció**:
   - Aneu al dashboard del projecte a Supabase: `https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new`
   - Obriu l'arxiu `supabase/data_dump.sql` en el vostre editor de codi.
   - Copieu tot el contingut i enganxeu-ho a la caixa de l'editor SQL del navegador web.
   - Premeu el botó verd **Run** avall a la dreta.

---

## License

Proprietary. © Somespai.
