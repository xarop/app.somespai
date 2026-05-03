# Somespai — Agents Manual

> Reading this file is mandatory before writing or modifying code.
> Audience: AI agents (Claude, Cursor, Copilot) and human contributors.

---

## 1. Mission

Somespai is a P2P marketplace for **physical spaces** (storage, workspaces, gardens, rooms) located in **Vila de Gràcia, Barcelona**, designed to scale to all of Catalonia without structural changes.

**Out of scope**: in-app payments, escrow, identity verification flows, gamification, "social feed".
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
| Tiles            | **MapTiler** (free) or self-hosted Protomaps | Cost-effective at scale                  |
| Styling          | **Native CSS + `@layer`**         | Semantic, no Tailwind                              |
| State (client)   | **Zustand** (only when needed)    | Most state lives in URL or server                  |
| i18n             | **next-intl**                     | App Router native, segment-based locales           |
| Forms            | **React Hook Form + Zod**         | Same Zod schemas validate server-side              |
| Hosting          | **Vercel**                        | Edge functions, instant rollback                   |

**Do not introduce**: Tailwind, runtime CSS-in-JS, Redux, Mapbox (paid), Firebase, MongoDB.

---

## 3. Repository Layout

```
.
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (app)/
│   │   │   │   ├── page.tsx              # home: map + list
│   │   │   │   ├── espai/[slug]/page.tsx # space detail (shareable URL)
│   │   │   │   ├── publica/page.tsx      # create listing
│   │   │   │   ├── perfil/page.tsx
│   │   │   │   └── design-system/page.tsx
│   │   │   └── layout.tsx
│   │   └── api/
│   │       └── spaces/                   # REST handlers (PostGIS)
│   ├── components/
│   │   ├── ui/                           # primitives (Button, Input, Sheet)
│   │   ├── map/                          # Map, Marker, Cluster
│   │   └── space/                        # SpaceCard, SpaceDetail, FilterBar
│   ├── lib/
│   │   ├── supabase/
│   │   ├── geo/                          # geo helpers, slug, distance
│   │   ├── i18n/
│   │   ├── schemas/                      # Zod (single source of truth)
│   │   └── data/                         # mock data (Phase 1)
│   └── middleware.ts                     # locale routing
├── messages/
│   ├── ca.json                           # default
│   ├── es.json
│   └── en.json
├── styles/
│   ├── tokens.css                        # CSS variables
│   ├── elements.css                      # bare HTML element styles
│   ├── components.css                    # component layer
│   └── utilities.css                     # last-resort utilities
├── supabase/
│   └── migrations/
├── public/
├── design.md
├── agents.md
└── README.md
```

**Rule**: `components/ui` never imports from `components/space` (no upward dependencies).

---

## 4. Data Model (Postgres / PostGIS)

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  bio           text,
  is_verified   boolean default false,
  is_premium    boolean default false,
  created_at    timestamptz default now()
);

create type space_type as enum ('storage', 'workspace', 'garden', 'room');

create table spaces (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  owner_id     uuid not null references profiles(id),
  title        text not null,
  description  text,
  type         space_type not null,
  price_cents  integer not null,
  currency     text default 'EUR',
  size_m2      numeric(6,2),
  address      text,
  neighborhood text,
  city         text default 'Barcelona',
  region       text default 'Catalunya',
  location     geography(point, 4326) not null,
  amenities    text[] default '{}',
  photos       text[] default '{}',
  is_featured  boolean default false,
  status       text default 'active',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index spaces_location_idx on spaces using gist (location);
create index spaces_type_idx on spaces (type);
create index spaces_status_idx on spaces (status);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  rating     smallint not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz default now(),
  unique (space_id, author_id)
);

create table favorites (
  user_id    uuid not null references profiles(id) on delete cascade,
  space_id   uuid not null references spaces(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, space_id)
);
```

### Spatial query — listings within radius

```sql
select
  s.*,
  st_distance(s.location, st_makepoint($1, $2)::geography) as distance_m
from spaces s
where st_dwithin(s.location, st_makepoint($1, $2)::geography, $3)
  and s.status = 'active'
  and ($4::space_type is null or s.type = $4)
order by s.is_featured desc, distance_m asc
limit 50;
```

Premium hooks already in the model: `profiles.is_verified`, `profiles.is_premium`, `spaces.is_featured`. UI for these arrives in v2; the schema is ready now.

---

## 5. Conventions

### Code language
- **All identifiers in English.** `const userPreferences`, not `preferenciesUsuari`.
- **All UI strings translatable.** Always `t('cta.rent')`, never `"Lloga ara"` in JSX.

### Naming
- Files: `kebab-case.tsx` (`space-card.tsx`).
- Components: `PascalCase` (`SpaceCard`).
- Functions: `camelCase`.
- DB tables: `snake_case`, plural.
- CSS custom props: `--kebab-case`.

### CSS rules
1. Style **elements** first. `button { ... }` before `.button { ... }`.
2. Use `@layer reset, tokens, elements, components, utilities` — in that order.
3. Variants via `data-` attributes (`data-variant="ghost"`), not class soup.
4. **No `!important`.** If you need it, the cascade is wrong.
5. **No utility frameworks.** Period.

### Commits
- Conventional: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Scope when relevant: `feat(map): add cluster click zoom`.

---

## 6. URL Conventions

- **Locale-prefixed**: `/ca/espai/jardi-glicines`, `/en/space/wisteria-garden`.
- **Slugs are stable.** Renaming a listing does not break links.
- **Shareable**: every space URL has OG tags. Web Share API uses canonical URL.
- **Filters in querystring**: `?type=garden&max=200&radius=500`.

---

## 7. Auth

- **Magic link only** in v1. No password, no OAuth.
- Profile fields all **optional** post-signup.
- RLS on every table. Default deny.

---

## 8. Performance Budget

| Metric          | Budget       |
|-----------------|--------------|
| LCP (mobile)    | < 2.0s       |
| INP             | < 150ms      |
| Initial JS      | < 110 KB gz  |
| Map tiles       | lazy         |
| Images          | AVIF/WEBP via `next/image` |

---

## 9. Admin / Import

- `/api/admin/import` accepts JSON array of `{ title, lat, lng, type, ... }`.
- Used to seed from Google Maps exports, OSM, partner directories.
- Service-role key only. Never exposed to client.

---

## 10. Hard Rules for AI Agents

When generating or modifying code in this repo:

1. **Read this file and `design.md`** before writing.
2. **Never introduce Tailwind** or any utility-CSS framework.
3. **Never hardcode UI strings** — always `next-intl`.
4. **Never bypass RLS** from client.
5. **Never invent a new color** — use tokens. Propose missing tokens in `design.md` first.
6. **Prefer Server Components** unless interactivity demands client.
7. **Spatial queries**: PostGIS, never haversine in JS for filtering.
8. **Out-of-scope features (see §1) must be rejected.**
