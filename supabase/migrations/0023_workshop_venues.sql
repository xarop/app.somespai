-- Explicitly identify spaces that can host Somtallers activities.
alter table public.spaces
  add column if not exists is_workshop_venue boolean not null default false;

-- Existing rooms are the only spaces initially marked as workshop venues.
update public.spaces
set is_workshop_venue = (type::text = 'room');

create index if not exists spaces_workshop_venues_idx
  on public.spaces (title)
  where status = 'active' and is_workshop_venue;
