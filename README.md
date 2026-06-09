## Somespai

> Marketplace P2P d'espais a Barcelona i Catalunya. Trasters, estudis, jardins, sales i pàrquings.

Desenvolupat per [xarop.com](https://xarop.com) amb ajuda de la IA. Les contribucions són benvingudes: llegeix el protocol a [`CONTRIBUTING.md`](./CONTRIBUTING.md).


**Demo:** https://app.somespai.net/

**Filosofia**: minimalisme radical, geolocalització, acord econòmic extern, mòbil-first.

---

## Stack

- **Next.js 15** (App Router, RSC)
- **Supabase** (Postgres + PostGIS, Auth mail/password, RLS)
- **Cloudflare R2** (emmagatzematge d'imatges — zero egress)
- **MapLibre GL JS** (open-source maps)
- **next-intl** (CA / ES / EN)
- **CSS natiu** amb `@layer` — sense Tailwind, sense CSS-in-JS

Tot el codi en anglès. Tota la UI traduïble.

---

## Documentació

Llegeix abans de tocar el codi:

- [`DESIGN.md`](./DESIGN.md) — sistema de disseny (colors, tipografia, components)
- [`AGENTS.md`](./AGENTS.md) — arquitectura, model de dades, convencions
- [`CHANGELOG.md`](./CHANGELOG.md) — historial de versions i canvis

I la ruta interactiva: `/design-system`.

---

## Setup local

### 1. Requisits

- Node.js 20+ / Bun
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`)
- [Docker](https://www.docker.com/) (per al Supabase local)

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
| `0004_auto_create_profile.sql` | Funcions per auto-crear perfil d'usuari a Supabase auth |
| `0005_owner_id_nullable.sql` | Modifica `owner_id` per fer-lo opcional (permetent importacions massives inicials) |
| `0006_contact_fields.sql` | Afegeix camps de contacte a l'espai (`phone`, `email_contact`, `whatsapp`, `web`, `contact_default`) |
| `0007_profiles_self_insert.sql` | Política RLS que permet als usuaris autenticats crear/modificar el seu propi perfil |
| `0008_contact_messages.sql` | Taula `contact_messages` per emmagatzemar missatges enviats des dels espais |
| `0009_admin_list_users_rpc.sql` | RPC (funció) per llistar els usuaris per al panell d'administrador |
| `0010_profiles_is_admin.sql` | Afegeix camp `is_admin` als perfils en comptes de dependre només d'email |
| `0011_add_parking_space_type.sql` | Afegeix `parking` a l'enum `space_type` |
| `0012_add_contact_name.sql` | Afegeix `contact_name` a la taula `spaces` |
| `0013_add_pending_status.sql` | Afegeix l'estat `pending` a la constraint de `status` |
| `0014_api_v1.sql` | API v1: columnes de procedència (`source`, `external_id`, `verified`…), taula `api_keys`, RPC `v1_search_spaces` (PostGIS, paginació per cursor) |
| `0015_import_jobs.sql` | Taula `import_jobs` per traçar importacions massives; FK `import_job_id` a `spaces` |
| `0016_favorites.sql` | Taula `favorites` (user_id + space_id, PK composta) + RLS per propietari |
| `0017_profiles_phone.sql` | Afegeix camp `phone` als perfils d'usuari |
| `0018_profile_trigger_metadata.sql` | Millora el trigger `handle_new_user` per llegir `display_name` i `phone` dels metadates |
| `0019_city_region_nullable.sql` | Elimina el `NOT NULL DEFAULT` de `city` i `region` a `spaces` (sense valors per defecte hardcodejats) |
| `0020_profiles_is_premium.sql` | Afegeix `is_premium boolean default false` als perfils — controla el límit de fotos i funcionalitats futures |

---

## Desplegament a producció (Multi-marca)

Aquest repositori manté dues marques diferents mitjançant branques separades que apunten al mateix backend Supabase:

1. **Somespai** (`app.somespai.net`): Es desplega automàticament des de la branca `main`.
   - Vercel: [app-somespai](https://vercel.com/xarops-projects/app-somespai)
2. **CoSlot** (`coslot.space`): Es desplega automàticament des de la branca `coslot` (anglès forçat, termes "slot").
   - Vercel: [app-coslot](https://vercel.com/xarops-projects/app-coslot)

### Com treballar-hi i desplegar

**Per actualitzar Somespai:**
```bash
git checkout main
git add .
git commit -m "canvis per somespai"
git push origin main
```

**Per actualitzar CoSlot:**
```bash
git checkout coslot
git add .
git commit -m "canvis per coslot"
git push origin coslot
```

**Per compartir funcionalitats noves (de Somespai a CoSlot):**
Si respons uns errors o crees una eina nova a `main` i la vols per CoSlot, utilitza el merge:
```bash
git checkout coslot
git merge main
# Resol els conflictes (ull viu amb els canvis de la paraula espai -> slot)
git push origin coslot
```

---

### Primera configuració de les Apps (Vercel)

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

# Cloudflare R2 (emmagatzematge d'imatges)
echo "<account-id>"            | vercel env add R2_ACCOUNT_ID production
echo "<access-key-id>"         | vercel env add R2_ACCESS_KEY_ID production
echo "<secret-access-key>"     | vercel env add R2_SECRET_ACCESS_KEY production
echo "somespai-photos"         | vercel env add R2_BUCKET_NAME production
echo "https://pub-xxxx.r2.dev" | vercel env add R2_PUBLIC_URL production
```

Les claus Supabase es troben a: https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx/settings/api

Les claus R2 es creen a: https://dash.cloudflare.com → R2 → Manage API Tokens

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
| `NEXT_PUBLIC_MAP_TILES_URL` | URL de l'estil MapTiler o Protomaps per als mapes |
| `NOMINATIM_USER_AGENT` | User-Agent per a Nominatim (ex: `somespai/1.0 (correu@exemple.com)`) |
| `NOMINATIM_BASE_URL` | Base URL Nominatim (per defecte `https://nominatim.openstreetmap.org`) |
| `GOOGLE_PLACES_API_KEY` | Clau de l'API de Google Places (necessari per a la importació de Google) |
| `R2_ACCOUNT_ID` | Cloudflare dashboard → Account ID |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 → Manage API Tokens → Token Access Key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage API Tokens → Token Secret |
| `R2_BUCKET_NAME` | Nom del bucket R2 creat (ex: `somespai-photos`) |
| `R2_PUBLIC_URL` | URL pública del bucket (ex: `https://pub-xxxx.r2.dev`) |

---

---

## Roadmap i Estratègies

A continuació es detalla l'estat del projecte dividit per fases, marcant el que ja s'ha implementat i propostes per al futur.

### Phase 1 — Fonaments i UI principal (Fet) ✅

- [x] Estructura del repo (`src/app`, `src/components`, `src/lib`, `messages`, `styles`)
- [x] Sistema CSS en capes (`tokens` → `elements` → `components` → `utilities`)
- [x] i18n complet amb Next-Intl (CA / ES / EN), CA per defecte
- [x] Home amb mapa MapLibre (centrat a Gràcia) i llistat de targetes d'espais
- [x] Càrrega de 27 espais reals des de Supabase (Poblenou, Eixample, Teià, Gràcia)
- [x] Segregació visual d'estats: mapa i llista sincronitzada (disseny responsiu)
- [x] Pàgina de detall d'espai integrada sobre el mapa (`/[locale]/espai/[slug]`)
- [x] Design system interactiu accessible via `/design-system`
- [x] Configuració base de dades PostgreSQL + PostGIS (activa localment i al cloud)
- [x] Polítiques de RLS (Row Level Security) per defecte a Supabase
- [x] Fitxer `AGENTS.md` definint regles de codificació pels agents IA

### Phase 2 — Creació, Auth i Backoffice bàsic (Fet) ✅

- [x] Auth local i de producció amb correu/contrasenya via Supabase Auth
- [x] Pàgina i formulari per publicar espais (`/[locale]/publica`)
- [x] Integració de pujada d'arxius/fotos a **Cloudflare R2** (`src/lib/r2.ts`)
- [x] **Escalat de fotos al client** abans de pujar: les imatges es redueixen a mida òptima per a mòbil (`src/lib/images/resize-image.ts`)
- [x] Funcionalitat de Preferits (cors) guardats a la DB amb actualització optimista
- [x] Sistema de Ressenyes (lectura, llistat i component visual de rating d'estrelles)
- [x] Web Share API per compartir la fitxa d'espai
- [x] Creació i suport de script d'importació d'anuncis automatitzat associat a l'API `admin/import`
- [x] Auto-geolocalització al formulari de publicació: botó que omple adreça i coordenades automàticament via GPS + geocodificació inversa (Nominatim)

### Phase 3 — Panell d'Administració complet i Gestió d'Usuaris (Fet) ✅

- [x] Creació de la pàgina `/admin` protegida per variable d'entorn i JWT
- [x] Taula completa de Gestió d'Espais per a l'admin (editar, publicar, pausar, esborrar, destacar)
- [x] Panell de Gestió d'Usuaris (visualitzar llistat, estat i funcionalitat d'esborrat manual)
- [x] Edició autònoma de la fitxa d'espais per propietat (formulari restringit a `/editar/[slug]`)
- [x] Secció centralitzada al perfil per veure "Els Meus Espais" (`/perfil`)
- [x] Afegit badge de Verificat / Garantitzat
- [x] **Sistema de comptes Premium**: camp `is_premium` als perfils; admins poden activar/desactivar manualment; usuaris premium veuen badge daurada al seu perfil i poden pujar fins a 6 fotos per espai (comptes gratuïts: 1 foto); límit aplicat a la publicació i edició tant al client com al servidor
- [x] **API REST v1** pública amb autenticació per clau, filtres espacials (PostGIS), paginació per cursor (`/api/v1/spaces`)
- [x] **Importació des de Google Places**: cerca, selecció i importació massiva d'espais des del panell admin (`/admin/imports/new`)
- [x] Refresc individual d'espais importats i actualitzacions massives de verificació/estat

### Phase 4 — SEO Avançat, SSR i Indexabilitat (Fet) ✅

- [x] Sitemap dinàmic i multilingüe localitzat generat per la request d'usuari a build time
- [x] Redireccions Canonical absolutes i links alternatius de Hreflang en idiomes suportats
- [x] Schema.org `Product` amb metadata i BreadcrumbList introduït manualment en JSON-LD
- [x] Refactor de rutes SEO amistoses (`/ciutat` i `/ciutat/tipus_despai`) amb un display tipus "landing page"
- [x] Generació de meta tags dinámics OpenGraph (title, description, tags, URLs d'imatge) a Server Components
- [x] Transformació de la pàgina de detall d'espai de "Modal" a pàgina HTML normal sense constraints quan és accedida directament (millor crawler reading)
- [x] Sincronització intel·ligent del breadcrumb de ciutat amb la base de dades
- [x] Pàgina HTML "Mapa Web" generada estàticament indexant tot el portal per millorar el crawling (`/[locale]/sitemap`)

### Phase 5 — Futur pròxim: Monetització i Retenció (Pendent) ⭕

- [ ] **Pagaments Integrats (Escrow/SaaS)**
  - Stripe Connect per retenir parcialment fons mentre dura l'estada o model freemium SaaS.
- [ ] **Sistema d'Anuncis i "Featured Spaces" de pagament**
  - Pasarel·la de checkout pels propietaris per col·locar el seu espai a "Destacats" 7 o 30 dies.
- [ ] **Validació d'Identitat i Host Verificat**
  - Utilització d'una eina com Stripe Identity / Onfido per validar amfitrions a canvi d'un Check de Qualitat.
- [ ] **Missatgeria Interna Real-time**
  - Implementació de Xat intern via Supabase Realtime per evitar fugides directes de clients a Whatsapp abans d'apuntar la petició/reserva.
- [ ] **Cerca Geospatial Completa amb Dibuix de Mapes**
  - Funcionalitat d'escollir àrees específiques al mapa dibuixant polígons i extraient tots els anuncis contigüs (queries geomètriques de PostGis).
- [ ] **Publicitat Off-platform Google Ads (Landing Generatives)**
  - Creació de Pàgines Landing automàtiques per injectar ràpidament a Google Ads i Facebook Ads segons inventaris específics d'àrees geogràfiques amb alta densitat residencial.

---

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

### Auto-geolocalització al formulari de publicació

El formulari `/publica` inclou un botó **"Omple ubicació"** que automatitza l'entrada d'adreça i coordenades:

1. Demana permís de geolocalització al navegador (`navigator.geolocation`).
2. Obté les coordenades GPS (`lat`/`lng`) del dispositiu.
3. Crida Nominatim (OpenStreetMap) per obtenir l'adreça completa (geocodificació inversa).
4. Omple automàticament els camps `address`, `city`, `lat` i `lng` del formulari.

**Fitxers clau:**

| Fitxer | Rol |
|--------|-----|
| `src/components/space/geo-autofill-button.tsx` | Component botó (estat, UI, feedback) |
| `src/hooks/use-geolocation.ts` | Hook que encapsula `navigator.geolocation` |
| `src/lib/geo/geocoding.ts` | Crida a l'API Nominatim + transformació de resposta |
| `src/app/api/geo/route.ts` | Route handler proxy per evitar CORS i amagar l'User-Agent |

La crida a Nominatim es fa des d'un route handler de Next.js (`/api/geo`) per tal d'evitar problemes de CORS i per poder incloure un User-Agent correcte (`somespai/1.0`). Requereix connexió a internet però no cap API key.

---

### Escalat de fotos al client (publicació)

Quan l'usuari afegeix una foto al formulari `/publica` (des de galeria o fent-la amb la càmera del mòbil), s'escala **al navegador, abans de pujar-la** a Cloudflare R2. Així no s'envia mai l'original de diversos MB que generen les càmeres dels mòbils, reduint temps de pujada i egress.

1. La imatge es descodifica amb `createImageBitmap` (respectant l'orientació EXIF, freqüent en fotos de mòbil).
2. Es redimensiona perquè el costat més llarg no superi **1280px**, mantenint la proporció.
3. Es recodifica a **JPEG qualitat 0.8** via `<canvas>`.
4. És defensiu: si la imatge ja és prou petita, si el resultat fos més gran, o si la descodificació falla, es manté el fitxer original perquè la pujada sempre funcioni. Els GIF se salten.

L'escalat passa just quan la foto entra al formulari, així que la previsualització, l'enviament i la pujada a R2 ja fan servir la versió reduïda. El mateix s'aplica al formulari d'edició (`/editar/[slug]`) i al panell d'admin.

**Fitxers clau:**

| Fitxer | Rol |
|--------|-----|
| `src/lib/images/resize-image.ts` | Utilitat `resizeImageFile()` (descodificació, redimensionat, recodificació) |
| `src/app/[locale]/(app)/publica/publish-form.tsx` | `addPhotos()` escala cada fitxer entrant abans de desar-lo a l'estat |
| `src/app/[locale]/(app)/editar/[slug]/edit-form.tsx` | `addNewPhotos()` — mateix escalat a l'edició |
| `src/app/[locale]/(app)/admin/admin-dashboard.tsx` | `handleNewPhotos()` — mateix escalat a l'admin |

### Importació des de Google Places

L'script `scripts/bulk-scraper.ts` també optimitza les fotos abans de pujar-les: demana la imatge a Google amb amplada màxima de 1280px, aplica l'orientació EXIF, limita el costat més llarg a **1280px** i la converteix a **WebP qualitat 80** (`sharp`) — un format molt lleuger, òptim per a mòbil.

### Fotos ja pujades

Per reduir fotos **ja existents** a R2, hi ha un script de servidor (les baixa, les redimensiona amb `sharp` i les torna a pujar amb la mateixa clau, així la URL no canvia ni cal tocar la DB). R2 té egress zero, per tant reprocessar fotos de R2 no té cost de transferència. Les fotos encara a Supabase Storage se salten (migra-les abans amb `scripts/migrate-photos-to-r2.mjs`).

```bash
node scripts/resize-existing-photos.mjs --dry-run   # previsualitza els canvis
node scripts/resize-existing-photos.mjs             # aplica
```

---

### Llistat complet d'espais (`/espais/`)

Pàgina sense mapa amb tots els espais actius. Inclou:
- Filtres per tipus, ciutat, amenitats, puntuació mínima i preu màxim
- Actualització en temps real client-side
- Cada fila amb link directe a `/espai/[slug]`
- Pensada per a la indexació SEO de totes les URLs individuals

**Ruta:** `https://app.somespai.net/espais`

---

## API v1 (REST pública)

Endpoint públic per a integradors externs. Referència completa: [`docs/api-v1.md`](./docs/api-v1.md).

**Base URL:** `https://app.somespai.net/api/v1`

### Autenticació

Totes les crides requereixen la capçalera `X-API-Key`. Les claus es creen via SQL al Supabase (panell SQL Editor):

```sql
do $$
declare
  v_secret text := encode(gen_random_bytes(32), 'hex');
  v_prefix text := left(v_secret, 8);
  v_hash   text := encode(digest(v_secret, 'sha256'), 'hex');
begin
  insert into api_keys (name, key_prefix, key_hash, scopes, created_by)
  values ('La meva app', v_prefix, v_hash, '{spaces:read}', auth.uid());
  raise notice 'API key: %', v_secret;
end $$;
```

Guarda la clau resultant a les variables d'entorn de la teva app com `SOMESPAI_API_KEY`. **No es pot recuperar un cop tancada la consola.**

### `GET /api/v1/spaces`

Retorna espais actius amb els filtres indicats. Paginació per cursor (20 per pàgina per defecte, màx 100).

| Paràmetre | Tipus | Descripció |
|---|---|---|
| `limit` | int | Mida de pàgina (1–100, per defecte 20) |
| `cursor` | string | Cursor de paginació (de `pagination.next_cursor`) |
| `type` | string | Tipus separats per comes: `storage`, `workspace`, `garden`, `room`, `parking` |
| `near` | string | Centre geogràfic `lat,lng` (exclusiu amb `bbox`) |
| `radius` | int (m) | Radi en metres (per defecte 5000, requereix `near`) |
| `bbox` | string | Bounding box `lng_min,lat_min,lng_max,lat_max` (exclusiu amb `near`) |
| `price_min` | int | Preu mínim en cèntims |
| `price_max` | int | Preu màxim en cèntims |
| `price_unit` | string | `month`, `day` o `hour` |
| `size_min_m2` | number | Mida mínima en m² |
| `size_max_m2` | number | Mida màxima en m² |
| `city` | string | Ciutat exacta (insensible a majúscules) |
| `neighborhood` | string | Barri (coincidència parcial) |
| `amenities` | string | Amenitats requerides separades per comes |
| `q` | string | Cerca de text lliure (títol, descripció, ciutat, barri) |
| `sort` | string | `featured` (per defecte), `newest`, `price_asc`, `price_desc`, `distance` |

### Exemples ràpids

```bash
# Llistar espais (20 per pàgina)
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?limit=5'

# Trasters a menys d'1 km de Plaça Catalunya
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?type=storage&near=41.3879,2.1699&radius=1000&sort=distance'

# Pàrquings a l'Eixample, més barats primer
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?type=parking&neighborhood=Eixample&sort=price_asc'

# Paginar (usar next_cursor de la resposta anterior)
curl -H "X-API-Key: $SOMESPAI_API_KEY" \
  'https://app.somespai.net/api/v1/spaces?limit=100&cursor=<next_cursor>'
```

En local (dev): substitueix el domini per `http://localhost:3000`.

---

## Importació de Google Places (admin)

Els admins poden importar espais directament des de Google Places a través del panell:

1. Ves a `/ca/admin` → fes clic a **+ Importar espais**
2. Escriu una cerca (ex: *pàrquings Eixample Barcelona*)
3. Opcionalment, afina per coordenades + radi
4. Revisa els candidats: els ja importats estan marcats en gris
5. Selecciona els que vols i fes clic a **Importar N espais**
6. S'abriran com a `pending` (no visibles al públic) i podràs revisar-los i activar-los des del panell admin

**Requereix:** `GOOGLE_PLACES_API_KEY` configurat a `.env.local` o a les variables del projecte Vercel.

### Endpoints d'admin (requereix sessió d'admin)

| Mètode | Ruta | Funció |
|--------|------|--------|
| `POST` | `/api/admin/imports/search` | Cerca a Google Places i marca els ja importats |
| `POST` | `/api/admin/imports/commit` | Importa els candidats seleccionats |
| `POST` | `/api/admin/spaces/[id]/refresh` | Re-feteja les dades d'un espai des de Google Places |
| `PATCH` | `/api/admin/spaces/bulk` | Canvi massiu d'estat o verificació |

---

## Sincronització de dades Local ↔ Producció (Integral)

Si necessites sincronitzar **totes les dades totals del projecte** (espais, usuaris autèntics, ressenyes, possibles missatges, preferits, etc.) en comptes de només publicar anuncis solts d'espais, cal emprar els bolcats de bases de dades per no perdre la integritat de les relacions (IDs d'usuaris barrejats).

**1. Per bolcar absolutament totes les dades de Local a Producció:**

L'opció més segura per a la primera posada en marxa (portar les dades i els usuaris falsos de `seed` cap a Vercel/Supabase per que tothom hi pugui jugar):

```bash
# 1. Bolcar l'esquema d'usuaris (auth) - Atenció a les dades sensibles!
npx supabase db dump --local --schema auth --data-only -f supabase/auth_dump.sql

# 2. Bolcar la resta de l'esquema (public) on hi ha les teves taules (espais, usuaris, missatges)
npx supabase db dump --local --data-only -f supabase/data_dump.sql
```

Un cop tinguis aquests dos arxius `.sql`:
1. Vés al panell **SQL Editor** del teu projecte a la web de Supabase.
2. Obre l'arxiu `auth_dump.sql` i executa el codi sencer. Ara hauran pujat els inicis de sessió.
3. Fes el mateix amb `data_dump.sql`. Ara hauran pujat els espais, els fòrums, ressenyes, usuaris públics connectats correctament, etc.

**2. Clonar Producció cap a Local (Totes les dades):**

Per baixar la base de dades real del núvol cap a local (incloent usuaris, sessions, espais i ressenyes reals) netejant les dades de proba (`seed.sql`):

```bash
# 1. Extreure les dades de producció al teu ordinador (has de tenir linkat el projecte)
npx supabase db dump --linked --schema auth --data-only -f supabase/prod_auth_dump.sql
npx supabase db dump --linked --data-only -f supabase/prod_data_dump.sql

# 2. Resetejar i buidar la base de dades local (apartant el seed.sql de proba temporalment)
mv supabase/seed.sql supabase/seed.sql.bak
npx supabase db reset --local

# 3. Importar les dades connectant-se directament al contenidor de Docker
docker exec -i supabase_db_app.somespai psql -U postgres < supabase/prod_auth_dump.sql
docker exec -i supabase_db_app.somespai psql -U postgres < supabase/prod_data_dump.sql

# 4. Esborrar arxius temporals i restaurar el funcionament habitual
rm supabase/prod_auth_dump.sql supabase/prod_data_dump.sql
mv supabase/seed.sql.bak supabase/seed.sql
```

**3. Sincronització Parcial (Només el llistat d'Espais)**

Si ja tens el portal funcionant a producció amb usuaris reals usant-ho, no hauries de sobreescriure mai les bases de dades cap amunt. Pots utilitzar l'script per transmetre els nous espais treballats localment sense alterar ni la gent ni els missatges reals ja escrits:

```bash
bun run db:push     # Puja espais nous de local a producció
bun run db:pull     # Baixa els anuncis creats pels usuaris reals al teu PC 
```

## License

Proprietary. © Somespai.

---

## Integració i comprovació

Abans de desplegar o fer canvis importants, comprova:

- [x] Connexió Supabase (local i producció)
- [x] Variables d'entorn carregades
- [x] Sitemap dinàmic
- [x] Nom de marca dinàmic al design system
- [x] Desplegament multibranca (Somespai / CoSlot)
- [x] Traduccions EN/CA correctes
- [x] Instruccions README actualitzades

Consulta `INTEGRATION.md` per la checklist detallada i passos de validació.
