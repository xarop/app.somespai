-- Allow authenticated users to insert their own profile row
-- (needed as a safety net for accounts created before the auto-create trigger,
--  and to allow the upsert in addReview to succeed)
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles
  for insert with check (auth.uid() = id);
