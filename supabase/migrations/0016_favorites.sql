-- ── Favorites ────────────────────────────────────────────────────────────────
create table if not exists favorites (
  user_id   uuid not null references auth.users(id) on delete cascade,
  space_id  uuid not null references spaces(id)     on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, space_id)
);

-- Index for fast lookup by user
create index if not exists favorites_user_id_idx on favorites(user_id);

-- RLS
alter table favorites enable row level security;

create policy "users can read own favorites"
  on favorites for select
  using (auth.uid() = user_id);

create policy "users can insert own favorites"
  on favorites for insert
  with check (auth.uid() = user_id);

create policy "users can delete own favorites"
  on favorites for delete
  using (auth.uid() = user_id);
