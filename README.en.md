## CoSlot (formerly Somespai)

> P2P marketplace for spaces. Storage, studios, gardens, rooms, and parking.

Developed by [xarop.com](https://xarop.com) with AI assistance. Contributions are welcome: read the protocol in [`CONTRIBUTING.md`](./CONTRIBUTING.md).

**Demo:** https://coslot.space/

**Philosophy**: radical minimalism, geolocation, external financial agreement, mobile-first.

---

## Stack

- **Next.js 15** (App Router, RSC)
- **Supabase** (Postgres + PostGIS, Auth mail/password, Storage, RLS)
- **MapLibre GL JS** (open-source maps)
- **next-intl** (Forced EN for CoSlot)
- **Native CSS** with `@layer` — no Tailwind, no CSS-in-JS

All code is in English. All UI strings are translatable.

---

## Documentation

Read before touching the code:

- [`DESIGN.md`](./DESIGN.md) — design system (colors, typography, components)
- [`AGENTS.md`](./AGENTS.md) — architecture, data model, conventions

Interactive route: `/design-system`.

---

## Local Setup

### 1. Requirements

- Node.js 20+ / Bun
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`)
- [Docker](https://www.docker.com/) (for local Supabase)

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase project keys
```

For local development, `npx supabase start` automatically generates keys which you can copy from `npx supabase status`.

### 4. Local Database

```bash
# Start local Supabase (Docker)
npx supabase start

# Apply all migrations and seeded initial data
npx supabase db reset --local
```

The `db reset` applies migrations from `supabase/migrations/` and runs `supabase/seed.sql` (27 real spaces from Barcelona).

### 5. Start the App

```bash
bun dev
# → http://localhost:3000/en
```

---

## Migrations

| File | Content |
|--------|-----------|
| `0001_init.sql` | Initial schema: `profiles`, `spaces`, `reviews`, `favorites`, RLS, RPC `nearby_spaces` |
| `0002_add_space_extra_fields.sql` | Adds `price_unit`, `contact_url`, `rating`, `reviews_count`, generated columns `lat`/`lng` |
| `0003_storage_photos.sql` | Bucket `space-photos` (public, 5 MB, images) + RLS: public read, upload/delete for owner |
| `0004_auto_create_profile.sql` | Functions to auto-create user profile in Supabase auth |
| `0005_owner_id_nullable.sql` | Modifies `owner_id` to make it optional (allows initial mass imports) |
| `0006_contact_fields.sql` | Adds contact fields to space (`phone`, `email_contact`, `whatsapp`, `web`, `contact_default`) |
| `0007_profiles_self_insert.sql` | RLS policy allowing authenticated users to create/modify their own profile |
| `0008_contact_messages.sql` | Table `contact_messages` to store messages sent from spaces |
| `0009_admin_list_users_rpc.sql` | RPC (function) to list users for the admin panel |
| `0010_profiles_is_admin.sql` | Adds `is_admin` field to profiles instead of relying solely on email |

---

## Production Deployment (Multi-brand)

This repository maintains two different brands through separate branches pointing to the same Supabase backend:

1. **Somespai** (`app.somespai.net`): Automatically deployed from the `main` branch.
   - Vercel: [app-somespai](https://vercel.com/xarops-projects/app-somespai)
2. **CoSlot** (`coslot.space`): Automatically deployed from the `coslot` branch (forced English, "slot" terms).
   - Vercel: [app-coslot](https://vercel.com/xarops-projects/app-coslot)

### Workflow and Deployment

**To update Somespai:**
```bash
git checkout main
git add .
git commit -m "changes for somespai"
git push origin main
```

**To update CoSlot:**
```bash
git checkout coslot
git add .
git commit -m "changes for coslot"
git push origin coslot
```

**To share new features (from Somespai to CoSlot):**
If you fix bugs or create a new feature in `main` and want it for CoSlot, use merge:
```bash
git checkout coslot
git merge main
# Resolve conflicts (pay attention to changes from the word espai -> slot)
git push origin coslot
```

---

### Initial App Configuration (Vercel)

**First deployment (one-time):**

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link to the existing project
vercel login
vercel --prod
# → select "xarop's projects" and link to "xarops-projects/app-coslot"
```

**Environment Variables** — add to the Vercel project (one-time):

```bash
echo "https://<ref>.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "<anon-key>"               | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "<service-role-key>"       | vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

Keys can be found at: https://supabase.com/dashboard/project/nkdmysztmgerwhrklzhx/settings/api

**Standard Deployments** — simply push to `coslot`:

```bash
git push origin coslot   # Vercel deploys automatically if GitHub is connected
```

> Note: the lockfile is `bun.lockb` — do not include `package-lock.json` in the repo or Vercel will fail.

---

## Data Architecture

Main pages are **Server Components** that fetch from Supabase and pass data to Client Components:

```
page.tsx (server) → getSpaces() → HomeClient (client)
slot/[slug]/page.tsx (server) → getSpaceBySlug() → SpaceDetailClient (client)
admin/page.tsx (server, admin only) → getAllSpacesAdmin() → AdminDashboard (client)
  · users tab → getUsersAction() (lazy, client-side) → UsersTab
editar/[slug]/page.tsx (server, owner only) → getSpaceBySlugForOwner() → EditSpaceForm (client)
perfil/page.tsx (server, auth) → getSpacesByOwner() → spaces list
```

All public queries go through `src/lib/supabase/spaces.ts`. Admin operations use the service-role client in `src/lib/supabase/admin.ts`. SEO pages use `src/lib/supabase/spaces-seo.ts` (service-role without cookies, suitable for `generateStaticParams`).

---

## Environment Variables

| Variable | Location |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API (secret) |
| `ADMIN_EMAIL` | Administrator's email (access to `/admin` dashboard) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Same as `ADMIN_EMAIL` but accessible to the client (fallback for local dev) |

---

## Geo-autofill on the publish form

The `/publica` (publish) form includes a **"Fill location"** button that automates address and coordinate entry:

1. Requests geolocation permission from the browser (`navigator.geolocation`).
2. Obtains GPS coordinates (`lat`/`lng`) from the device.
3. Calls Nominatim (OpenStreetMap) for reverse geocoding to get a human-readable address.
4. Automatically fills the `address`, `city`, `lat` and `lng` form fields.

**Key files:**

| File | Role |
|------|------|
| `src/components/space/geo-autofill-button.tsx` | Button component (state, UI, feedback) |
| `src/hooks/use-geolocation.ts` | Hook wrapping `navigator.geolocation` |
| `src/lib/geo/geocoding.ts` | Nominatim API call + response transformation |
| `src/app/api/geo/route.ts` | Next.js route handler proxy to avoid CORS and set a proper User-Agent |

The Nominatim call is proxied through a Next.js route handler (`/api/geo`) to avoid browser CORS restrictions and to include a valid User-Agent (`somespai/1.0`). No API key required.

---

## SEO City Pages

Statically generated for all cities with active spaces and for each city + type combination:

| Route | Content |
|------|-----------|
| `/[city]/` | All spaces in a city (e.g., `/barcelona/`) |
| `/[city]/[type]/` | Specific type of spaces in the city |

The component for each page is the same `HomeClient` as the home page (map + list), with preset filters and context.

### Complete List of Spaces (`/slots/`)

Page without map containing all active spaces. Includes:
- Filters by type, city, amenities, minimum rating, and maximum price
- Real-time client-side updates
- Each row linking directly to `/slot/[slug]`
- Designed for SEO indexing of all individual URLs

**Route:** `https://coslot.space/slots`

## License

Proprietary. © CoSlot / Somespai.