# Somespai — Agents Manual

> Reading this file is mandatory before writing or modifying code.
> Audience: AI agents (Claude, Cursor, Copilot) and human contributors.

---

## 1. Mission

Somespai is a P2P marketplace for **physical spaces** (storage, workspaces, gardens, rooms, parking) located in **Vila de Gràcia, Barcelona**, designed to scale to all of Catalonia without structural changes.

**Out of scope (do not add)**: in-app payments, escrow, identity verification flows, chat moderation AI, "social feed", gamification.
**In scope**: discovery (map + list), listing creation, reviews, favorites, sharing.

The economic agreement happens **off-platform**. Somespai introduces hosts and guests; it does not process money.

---

## 2. Tech Stack — Locked In

| Layer            | Choice                            | Why                                                |
|------------------|-----------------------------------|----------------------------------------------------|
| Framework        | **Next.js 15 (App Router)**       | SPA-feel via client navigation, RSC, edge runtime  |
| Database         | **PostgreSQL + PostGIS**          | Native spatial queries, scales to Catalonia        |
| BaaS             | **Supabase**                      | Auth (magic link), Storage, RLS, Realtime          |
| Maps             | **MapLibre GL JS**                | Open-source, no vendor lock                        |
| Tiles            | **Protomaps** (self-host) or MapTiler free tier | Cost-effective at scale                  |
| Styling          | **Native CSS + `@layer`**         | Semantic, no Tailwind                              |
| State (client)   | **Zustand** (only when needed)    | Most state lives in URL or server                  |
| i18n             | **next-intl**                     | App Router native, segment-based locales           |
| Forms            | **React Hook Form + Zod**         | Same Zod schemas validate server-side              |
| Hosting          | **Vercel**                        | Edge functions, instant rollback                   |

**Do not introduce**: Tailwind, CSS-in-JS runtime libraries (styled-components, emotion), Redux, Mapbox (paid), Firebase, MongoDB, ORMs other than Supabase client + raw SQL for PostGIS.

---

## 3. Repository Layout

```
.
├── app/
│   ├── [locale]/
│   │   ├── (marketing)/              # public pages
│   │   ├── (app)/
│   │   │   ├── page.tsx              # home: map + list
│   │   │   ├── espai/[slug]/page.tsx # space detail (shareable URL)
│   │   │   ├── publica/page.tsx      # create listing
│   │   │   ├── perfil/page.tsx
│   │   │   └── design-system/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── spaces/                   # REST handlers (PostGIS queries)
│   │   ├── reviews/
│   │   └── admin/import/             # bulk import from Google Maps etc.
│   └── globals.css                   # tokens + reset
├── components/
│   ├── ui/                           # primitives (Button, Input, Sheet)
│   ├── map/                          # Map, Marker, Cluster
│   └── space/                        # SpaceCard, SpaceDetail, FilterBar
├── lib/
│   ├── supabase/                     # client, server, admin helpers
│   ├── geo/                          # geo helpers, slug, distance
│   ├── i18n/                         # config
│   └── schemas/                      # Zod schemas (single source of truth)
├── messages/
│   ├── ca.json                       # default
│   ├── es.json
│   └── en.json
├── styles/
│   ├── tokens.css                    # CSS variables
│   ├── elements.css                  # bare HTML element styles
│   ├── components.css                # component layer
│   └── utilities.css                 # rare, last-resort utilities
├── design.md
├── agents.md
└── README.md
```

**Rule**: components/ui never imports from components/space (no upward dependencies).

---

## 4. Data Model (Postgres / PostGIS)

```sql
-- Users (managed by Supabase auth.users; profile is separate)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  bio           text,
  is_verified   boolean default false,   -- premium / KYC later
  is_premium    boolean default false,
  created_at    timestamptz default now()
);

-- Space types (enum kept simple, extensible)
create type space_type as enum ('storage', 'workspace', 'garden', 'room', 'parking');

-- Spaces
create table spaces (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,         -- /espai/{slug}
  owner_id     uuid not null references profiles(id),
  title        text not null,
  description  text,
  type         space_type not null,
  price_cents  integer not null,             -- monthly, EUR
  currency     text default 'EUR',
  size_m2      numeric(6,2),
  address      text,                          -- human-readable
  neighborhood text,                          -- "Vila de Gràcia"
  city         text default 'Barcelona',
  region       text default 'Catalunya',
  location     geography(point, 4326) not null, -- PostGIS
  amenities    text[] default '{}',
  photos       text[] default '{}',           -- Supabase Storage URLs
  is_featured  boolean default false,         -- premium
  status       text default 'active',         -- active | paused | removed
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index spaces_location_idx on spaces using gist (location);
create index spaces_type_idx on spaces (type);
create index spaces_status_idx on spaces (status);

-- Reviews
create table reviews (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  rating     smallint not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz default now(),
  unique (space_id, author_id)
);

-- Favorites (likes)
create table favorites (
  user_id    uuid not null references profiles(id) on delete cascade,
  space_id   uuid not null references spaces(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, space_id)
);
```

### Key spatial query — listings within radius

```sql
select
  s.*,
  st_distance(s.location, st_makepoint($lng, $lat)::geography) as distance_m
from spaces s
where st_dwithin(s.location, st_makepoint($lng, $lat)::geography, $radius_m)
  and s.status = 'active'
  and ($type is null or s.type = $type)
order by s.is_featured desc, distance_m asc
limit 50;
```

---

## 5. Conventions

### Code language
- **All identifiers in English.** `const userPreferences`, not `const preferenciesUsuari`.
- **All UI strings translatable.** No hardcoded `"Lloga ara"` in JSX. Always `t('cta.rent')`.

### Naming
- Files: `kebab-case.tsx` (`space-card.tsx`).
- Components: `PascalCase` (`SpaceCard`).
- Functions: `camelCase`.
- DB tables: `snake_case`, plural (`spaces`, `reviews`).
- CSS custom props: `--kebab-case`.

### CSS rules
1. Style **elements** first. `button { ... }` before `.button { ... }`.
2. Use `@layer reset, tokens, elements, components, utilities` — **in that order**.
3. Variants: `data-` attributes (`data-variant="ghost"`), not class soup.
4. Never use `!important`. If you need it, the cascade is wrong.
5. No utility frameworks. Period.

### Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Scope when relevant: `feat(map): add cluster click zoom`.

### Tests
- Schemas (Zod): unit-tested.
- Spatial queries: integration test against a seeded test DB.
- Visual: Storybook-style preview lives at `/design-system`.

---

## 6. URL Conventions

- **Locale-prefixed**: `/ca/espai/jardi-glicines`, `/en/space/wisteria-garden`.
- **Slugs are stable.** Renaming a listing does not break links — old slugs redirect.
- **Shareable**: every space has a canonical URL with OG tags (Web Share API uses it).
- **Filters in querystring**: `?type=garden&max=200&radius=500`. Bookmark-friendly.

---

## 7. Auth

- **Magic link only** in v1. No password, no OAuth (yet).
- Profile fields are **all optional** post-signup. Show no friction.
- RLS on every table. Default deny.

---

## 8. Performance Budget

| Metric            | Budget       |
|-------------------|--------------|
| LCP (mobile)      | < 2.0s       |
| INP               | < 150ms      |
| Initial JS        | < 110 KB gz  |
| Map tiles         | lazy, on view|
| Images            | AVIF / WEBP, `next/image` always |

---

## 9. Premium Hooks (Data Ready, UI Later)

- `profiles.is_verified` — verified host badge.
- `profiles.is_premium` — subscription state.
- `spaces.is_featured` — boost in sort + visual treatment.

UI for these arrives in v2. The model is ready now so we don't migrate later.

---

## 10. Admin / Import

- `/api/admin/import` accepts a JSON array of `{ title, lat, lng, type, ... }`.
- Used to seed from Google Maps exports, OpenStreetMap, partner directories.
- Protected by service-role key, never exposed to the client.

---

## 11. For AI Agents — Hard Rules

When generating or modifying code in this repo:

1. **Read this file and `design.md`** before writing.
2. **Never introduce Tailwind** or any utility-CSS framework.
3. **Never hardcode UI strings** — always go through `next-intl`.
4. **Never bypass RLS** from a client component.
5. **Never invent a new color** — use tokens. If a token is missing, propose it in `design.md` first.
6. **Prefer server components** unless interactivity demands client.
7. **Spatial queries**: always use PostGIS, never haversine in JS for filtering.
8. **When unsure about scope**, ask. Out-of-scope features (see §1) must be rejected.
