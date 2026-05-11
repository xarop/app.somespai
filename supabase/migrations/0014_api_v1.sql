-- Branch 2: API v1 — provenance columns, api_keys table, search RPC
--
-- NOTE: The brief specifies status = 'draft'|'published'|'archived'.
-- This repo already uses status = 'active'|'paused'|'removed'|'pending' (migrations 0001+0013).
-- Mapping kept as-is: active=published, pending=draft, paused/removed=archived.
-- The public API filters by status = 'active'.

-- ── Provenance + verification ──────────────────────────────────────────────
alter table spaces
  add column if not exists verified          boolean      not null default true,
  add column if not exists source            text         not null default 'manual',
  add column if not exists external_id       text,
  add column if not exists external_url      text,
  add column if not exists external_data     jsonb,
  add column if not exists external_attribution text,
  add column if not exists imported_at       timestamptz,
  add column if not exists imported_by       uuid references auth.users(id),
  add column if not exists last_refreshed_at timestamptz;

alter table spaces
  drop constraint if exists spaces_source_check;
alter table spaces
  add constraint spaces_source_check
    check (source in ('manual','google_places','osm','foursquare','mapbox'));

-- Pending spaces (submitted via public form) are unverified until admin reviews
update spaces set verified = false where status = 'pending';

-- ── Indexes ────────────────────────────────────────────────────────────────
create unique index if not exists spaces_source_external_id_unique
  on spaces(source, external_id) where external_id is not null;

create index if not exists spaces_status_active_idx
  on spaces(status) where status = 'active';

-- ── API keys ───────────────────────────────────────────────────────────────
create table if not exists api_keys (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  key_prefix   text        not null,   -- first 8 chars for identification (not secret)
  key_hash     text        not null,   -- sha256(full_key) hex
  scopes       text[]      not null default '{spaces:read}',
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_by   uuid        references auth.users(id)
);

create unique index if not exists api_keys_prefix_unique
  on api_keys(key_prefix) where revoked_at is null;

alter table api_keys enable row level security;
-- No public RLS policies → only service_role can access api_keys

-- ── Search RPC ─────────────────────────────────────────────────────────────
-- Called exclusively by the API route using the service_role client.
-- Handles spatial filters (bbox / near+radius), text search, faceted filters,
-- and cursor-based pagination on (created_at DESC, id DESC).

create or replace function public.v1_search_spaces(
  p_types        text[]      default null,
  p_price_min    int         default null,
  p_price_max    int         default null,
  p_price_unit   text        default null,
  p_size_min     numeric     default null,
  p_size_max     numeric     default null,
  p_city         text        default null,
  p_neighborhood text        default null,
  p_amenities    text[]      default null,
  p_q            text        default null,
  p_bbox         float8[]    default null,   -- [lng_min, lat_min, lng_max, lat_max]
  p_near_lat     float8      default null,
  p_near_lng     float8      default null,
  p_radius       float8      default 5000,   -- metres
  p_sort         text        default 'featured',
  p_limit        int         default 20,
  p_cursor_at    timestamptz default null,
  p_cursor_id    uuid        default null
) returns table (
  id                uuid,
  slug              text,
  type              text,
  title             text,
  description       text,
  price_cents       int,
  price_unit        text,
  currency          text,
  size_m2           numeric,
  address           text,
  neighborhood      text,
  city              text,
  region            text,
  photos            text[],
  amenities         text[],
  is_featured       boolean,
  rating            numeric,
  reviews_count     int,
  lat               float8,
  lng               float8,
  distance_m        float8,
  created_at        timestamptz,
  updated_at        timestamptz,
  owner_id          uuid,
  owner_name        text,
  owner_avatar      text
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return query
  select
    s.id,
    s.slug,
    s.type::text,
    s.title,
    s.description,
    s.price_cents,
    s.price_unit,
    s.currency,
    s.size_m2,
    s.address,
    s.neighborhood,
    s.city,
    s.region,
    s.photos,
    s.amenities,
    s.is_featured,
    coalesce(s.rating, 0)::numeric,
    coalesce(s.reviews_count, 0)::int,
    st_y(s.location::geometry)::float8,
    st_x(s.location::geometry)::float8,
    case
      when p_near_lat is not null and p_near_lng is not null
      then st_distance(s.location, st_makepoint(p_near_lng, p_near_lat)::geography)
      else null::float8
    end as distance_m,
    s.created_at,
    s.updated_at,
    s.owner_id,
    p.display_name,
    p.avatar_url
  from spaces s
  left join profiles p on p.id = s.owner_id
  where
    s.status = 'active'
    and (p_types        is null or s.type::text = any(p_types))
    and (p_price_min    is null or s.price_cents >= p_price_min)
    and (p_price_max    is null or s.price_cents <= p_price_max)
    and (p_price_unit   is null or s.price_unit  = p_price_unit)
    and (p_size_min     is null or s.size_m2     >= p_size_min)
    and (p_size_max     is null or s.size_m2     <= p_size_max)
    and (p_city         is null or lower(s.city) = lower(p_city))
    and (p_neighborhood is null or lower(s.neighborhood) ilike '%' || lower(p_neighborhood) || '%')
    and (p_amenities    is null or s.amenities @> p_amenities)
    and (p_q is null or to_tsvector('simple',
          coalesce(s.title,'') || ' ' || coalesce(s.description,'') || ' ' ||
          coalesce(s.neighborhood,'') || ' ' || coalesce(s.city,''))
        @@ plainto_tsquery('simple', p_q))
    and (p_bbox is null or st_within(
          s.location::geometry,
          st_makeenvelope(p_bbox[1], p_bbox[2], p_bbox[3], p_bbox[4], 4326)))
    and (p_near_lat is null or p_near_lng is null or st_dwithin(
          s.location,
          st_makepoint(p_near_lng, p_near_lat)::geography,
          p_radius))
    -- Cursor: skip rows already seen (keyset on created_at, id DESC)
    and (p_cursor_at is null or p_cursor_id is null or
         (s.created_at, s.id) < (p_cursor_at, p_cursor_id))
  order by
    -- Single float8 expression keeps all branches same type
    case p_sort
      when 'price_asc'  then s.price_cents::float8
      when 'price_desc' then (-s.price_cents)::float8
      when 'newest'     then extract(epoch from s.created_at)
      when 'distance'   then
        -coalesce(st_distance(s.location,
          st_makepoint(p_near_lng, p_near_lat)::geography), 0)
      else -- 'featured' (default): featured first, then newest
        (case when s.is_featured then 1e12 else 0 end) +
        extract(epoch from s.created_at)
    end desc nulls last,
    s.created_at desc,
    s.id desc
  limit p_limit;
end;
$$;

revoke all     on function public.v1_search_spaces from public;
revoke execute on function public.v1_search_spaces from anon, authenticated;
grant  execute on function public.v1_search_spaces to   service_role;
