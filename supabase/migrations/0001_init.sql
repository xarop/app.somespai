-- ============================================================================
-- Somespai — initial schema
-- Requires: PostgreSQL with PostGIS extension
-- Run order: extensions → tables → indexes → RLS policies
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  bio           text,
  is_verified   boolean not null default false,
  is_premium    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger: keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ── Space type enum ─────────────────────────────────────────────────────────
do $$ begin
  create type space_type as enum ('storage', 'workspace', 'garden', 'room');
exception when duplicate_object then null; end $$;

-- ── Spaces ──────────────────────────────────────────────────────────────────
create table if not exists spaces (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  owner_id     uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  type         space_type not null,
  price_cents  integer not null check (price_cents >= 0),
  currency     text not null default 'EUR',
  size_m2      numeric(6, 2),
  address      text,
  neighborhood text,
  city         text not null default 'Barcelona',
  region       text not null default 'Catalunya',
  location     geography(point, 4326) not null,
  amenities    text[] not null default '{}',
  photos       text[] not null default '{}',
  is_featured  boolean not null default false,
  status       text not null default 'active'
                 check (status in ('active', 'paused', 'removed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists spaces_location_idx on spaces using gist (location);
create index if not exists spaces_type_idx on spaces (type);
create index if not exists spaces_status_idx on spaces (status);
create index if not exists spaces_owner_idx on spaces (owner_id);
create index if not exists spaces_featured_idx on spaces (is_featured) where is_featured;

drop trigger if exists spaces_updated_at on spaces;
create trigger spaces_updated_at
  before update on spaces
  for each row execute function set_updated_at();

-- ── Reviews ─────────────────────────────────────────────────────────────────
create table if not exists reviews (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references spaces(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  unique (space_id, author_id)
);
create index if not exists reviews_space_idx on reviews (space_id);

-- ── Favorites ───────────────────────────────────────────────────────────────
create table if not exists favorites (
  user_id    uuid not null references profiles(id) on delete cascade,
  space_id   uuid not null references spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, space_id)
);

-- ── RLS: default deny, then targeted allow ──────────────────────────────────
alter table profiles  enable row level security;
alter table spaces    enable row level security;
alter table reviews   enable row level security;
alter table favorites enable row level security;

-- Profiles: anyone can read; only owner can update
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles
  for select using (true);

drop policy if exists profiles_write on profiles;
create policy profiles_write on profiles
  for update using (auth.uid() = id);

-- Spaces: anyone can read active; only owner can write
drop policy if exists spaces_read on spaces;
create policy spaces_read on spaces
  for select using (status = 'active' or auth.uid() = owner_id);

drop policy if exists spaces_insert on spaces;
create policy spaces_insert on spaces
  for insert with check (auth.uid() = owner_id);

drop policy if exists spaces_update on spaces;
create policy spaces_update on spaces
  for update using (auth.uid() = owner_id);

drop policy if exists spaces_delete on spaces;
create policy spaces_delete on spaces
  for delete using (auth.uid() = owner_id);

-- Reviews: anyone can read; authors can write theirs
drop policy if exists reviews_read on reviews;
create policy reviews_read on reviews for select using (true);

drop policy if exists reviews_insert on reviews;
create policy reviews_insert on reviews
  for insert with check (auth.uid() = author_id);

drop policy if exists reviews_update on reviews;
create policy reviews_update on reviews
  for update using (auth.uid() = author_id);

drop policy if exists reviews_delete on reviews;
create policy reviews_delete on reviews
  for delete using (auth.uid() = author_id);

-- Favorites: only the owner can read/write their own
drop policy if exists favorites_read on favorites;
create policy favorites_read on favorites
  for select using (auth.uid() = user_id);

drop policy if exists favorites_insert on favorites;
create policy favorites_insert on favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists favorites_delete on favorites;
create policy favorites_delete on favorites
  for delete using (auth.uid() = user_id);

-- ── Helper: nearby spaces RPC ───────────────────────────────────────────────
create or replace function nearby_spaces(
  center_lng double precision,
  center_lat double precision,
  radius_m   integer default 1500,
  filter_type space_type default null,
  limit_count integer default 50
)
returns table (
  id          uuid,
  slug        text,
  title       text,
  type        space_type,
  price_cents integer,
  size_m2     numeric,
  address     text,
  lat         double precision,
  lng         double precision,
  is_featured boolean,
  distance_m  double precision
)
language sql stable as $$
  select
    s.id, s.slug, s.title, s.type, s.price_cents, s.size_m2, s.address,
    st_y(s.location::geometry) as lat,
    st_x(s.location::geometry) as lng,
    s.is_featured,
    st_distance(s.location, st_makepoint(center_lng, center_lat)::geography) as distance_m
  from spaces s
  where s.status = 'active'
    and st_dwithin(s.location, st_makepoint(center_lng, center_lat)::geography, radius_m)
    and (filter_type is null or s.type = filter_type)
  order by s.is_featured desc, distance_m asc
  limit limit_count;
$$;
