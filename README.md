# app.somespai

> Marketplace P2P d'espais a Vila de Gràcia. Trasters, estudis, jardins i sales.

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

- [`design.md`](./design.md) — sistema de disseny (colors, tipografia, components)
- [`agents.md`](./agents.md) — arquitectura, model de dades, convencions

I la ruta interactiva: `/design-system`.

---

## Setup

### 1. Requirements

- Node.js 20+
- pnpm (recommended) or npm
- A Supabase project (or local `supabase start`)

### 2. Install

```bash
pnpm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Database

Run the migration on your Supabase project:

```bash
psql $DATABASE_URL -f supabase/migrations/0001_init.sql
```

Or via Supabase dashboard SQL editor: paste the contents of `supabase/migrations/0001_init.sql`.

### 4. Run

```bash
pnpm dev
# → http://localhost:3000
```

Catalan is the default. Try also `/es` and `/en`.

---

## Phase 1 — what's built

- ✅ Repo structure (`src/app`, `src/components`, `src/lib`, `messages`, `styles`)
- ✅ `design.md`, `agents.md`, `README.md`
- ✅ CSS layered system (`tokens` → `elements` → `components` → `utilities`)
- ✅ i18n with `ca`, `es`, `en` (CA default)
- ✅ Home page: MapLibre map centered on Vila de Gràcia + filterable list
- ✅ Mock data (10 spaces in Vila de Gràcia)
- ✅ Shareable URLs (`/[locale]/espai/[slug]`)
- ✅ `/design-system` interactive component gallery
- ✅ Postgres + PostGIS migration ready
- ✅ Supabase client stubs (browser + server)

## Phase 2 — next

- Magic-link auth flow + profile
- Create listing form (`/publica`) with photo upload
- Reviews + favorites (RLS-backed)
- Web Share API integration on detail page
- Admin import endpoint
- Premium UI (featured spaces, verified badge)

---

## License

Proprietary. © Somespai.
