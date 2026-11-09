-- Workshops share the existing Somespai profiles and spaces.
-- Version 0021 is already used by 0021_explicit_grants.sql.
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text,
  category text not null,
  price numeric(10, 2),
  duration_minutes integer,
  max_capacity integer,
  address text,
  city text default 'Barcelona',
  lat double precision,
  lng double precision,
  location geography(point, 4326),
  contact_name text,
  contact_phone text,
  contact_email text,
  contact_whatsapp text,
  contact_url text,
  contact_default text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workshops_price_nonnegative check (price is null or price >= 0),
  constraint workshops_duration_positive check (duration_minutes is null or duration_minutes > 0),
  constraint workshops_capacity_positive check (max_capacity is null or max_capacity > 0)
);

create table if not exists public.workshop_sessions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  available_seats integer,
  status text not null default 'scheduled',
  constraint workshop_sessions_time_order check (end_time > start_time),
  constraint workshop_sessions_seats_nonnegative check (available_seats is null or available_seats >= 0)
);

create index if not exists workshops_location_idx on public.workshops using gist (location);
create index if not exists workshops_category_idx on public.workshops (category);
create index if not exists workshops_organizer_idx on public.workshops (organizer_id);
create index if not exists workshop_sessions_start_time_idx on public.workshop_sessions (start_time);
create index if not exists workshop_sessions_workshop_idx on public.workshop_sessions (workshop_id);

create or replace function public.update_workshop_location()
returns trigger
language plpgsql
as $$
begin
  if new.lat is null or new.lng is null then
    new.location := null;
  else
    new.location := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_update_workshop_location on public.workshops;
create trigger trg_update_workshop_location
  before insert or update of lat, lng on public.workshops
  for each row execute function public.update_workshop_location();

drop trigger if exists workshops_updated_at on public.workshops;
create trigger workshops_updated_at
  before update on public.workshops
  for each row execute function public.set_updated_at();

alter table public.workshops enable row level security;
alter table public.workshop_sessions enable row level security;

drop policy if exists workshops_read on public.workshops;
create policy workshops_read on public.workshops
  for select using (status = 'active' or auth.uid() = organizer_id);
drop policy if exists workshops_insert on public.workshops;
create policy workshops_insert on public.workshops
  for insert with check (auth.uid() = organizer_id);
drop policy if exists workshops_update on public.workshops;
create policy workshops_update on public.workshops
  for update using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);
drop policy if exists workshops_delete on public.workshops;
create policy workshops_delete on public.workshops
  for delete using (auth.uid() = organizer_id);

drop policy if exists workshop_sessions_read on public.workshop_sessions;
create policy workshop_sessions_read on public.workshop_sessions
  for select using (
    status = 'scheduled'
    and exists (
      select 1 from public.workshops w
      where w.id = workshop_id and w.status = 'active'
    )
    or exists (
      select 1 from public.workshops w
      where w.id = workshop_id and w.organizer_id = auth.uid()
    )
  );
drop policy if exists workshop_sessions_insert on public.workshop_sessions;
create policy workshop_sessions_insert on public.workshop_sessions
  for insert with check (
    exists (
      select 1 from public.workshops w
      where w.id = workshop_id and w.organizer_id = auth.uid()
    )
  );
drop policy if exists workshop_sessions_update on public.workshop_sessions;
create policy workshop_sessions_update on public.workshop_sessions
  for update using (
    exists (
      select 1 from public.workshops w
      where w.id = workshop_id and w.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workshops w
      where w.id = workshop_id and w.organizer_id = auth.uid()
    )
  );
drop policy if exists workshop_sessions_delete on public.workshop_sessions;
create policy workshop_sessions_delete on public.workshop_sessions
  for delete using (
    exists (
      select 1 from public.workshops w
      where w.id = workshop_id and w.organizer_id = auth.uid()
    )
  );

create or replace function public.nearby_workshops(
  center_lng double precision,
  center_lat double precision,
  radius_m integer default 15000,
  filter_category text default null,
  date_from timestamptz default null,
  date_to timestamptz default null,
  limit_count integer default 50
)
returns table (
  id uuid,
  slug text,
  title text,
  category text,
  price numeric,
  address text,
  city text,
  lat double precision,
  lng double precision,
  distance_m double precision
)
language sql
stable
as $$
  select
    w.id,
    w.slug,
    w.title,
    w.category,
    w.price,
    w.address,
    w.city,
    w.lat,
    w.lng,
    st_distance(
      w.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography
    ) as distance_m
  from public.workshops w
  where w.status = 'active'
    and w.location is not null
    and st_dwithin(
      w.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      greatest(radius_m, 0)
    )
    and (filter_category is null or w.category = filter_category)
    and (
      (date_from is null and date_to is null)
      or exists (
        select 1
        from public.workshop_sessions ws
        where ws.workshop_id = w.id
          and ws.status = 'scheduled'
          and (date_from is null or ws.start_time >= date_from)
          and (date_to is null or ws.start_time <= date_to)
      )
    )
  order by distance_m
  limit greatest(least(limit_count, 200), 0);
$$;

revoke all on function public.nearby_workshops(double precision, double precision, integer, text, timestamptz, timestamptz, integer) from public;
grant execute on function public.nearby_workshops(double precision, double precision, integer, text, timestamptz, timestamptz, integer) to anon, authenticated;

-- New Supabase tables have no implicit Data API grants.
grant select on public.workshops, public.workshop_sessions to anon;
grant select, insert, update, delete on public.workshops, public.workshop_sessions to authenticated;
grant select, insert, update, delete on public.workshops, public.workshop_sessions to service_role;
