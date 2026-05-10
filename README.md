## Somespai

> Marketplace P2P d'espais a Barcelona i Catalunya. Trasters, estudis, jardins, sales i pàrquings.

Desenvolupat per [xarop.com](https://xarop.com) amb ajuda de la IA. Les contribucions són benvingudes: llegeix el protocol a [`CONTRIBUTING.md`](./CONTRIBUTING.md).


**Demo:** https://app.somespai.net/

**Filosofia**: minimalisme radical, geolocalització, acord econòmic extern, mòbil-first.

---

## Stack

- **Next.js 15** (App Router, RSC)
- **Supabase** (Postgres + PostGIS, Auth mail/password, Storage, RLS)
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
- [x] Integració de pujada d'arxius/fotos al bucket `space-photos` (Cloud Storage)
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

### Llistat complet d'espais (`/espais/`)

Pàgina sense mapa amb tots els espais actius. Inclou:
- Filtres per tipus, ciutat, amenitats, puntuació mínima i preu màxim
- Actualització en temps real client-side
- Cada fila amb link directe a `/espai/[slug]`
- Pensada per a la indexació SEO de totes les URLs individuals

**Ruta:** `https://app.somespai.net/espais`

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
