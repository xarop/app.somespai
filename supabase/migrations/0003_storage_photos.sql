-- Storage bucket for space photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'space-photos',
  'space-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Anyone can read
create policy if not exists "space-photos: public read"
  on storage.objects for select
  using (bucket_id = 'space-photos');

-- Authenticated users can upload to their own folder
create policy if not exists "space-photos: owner upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'space-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Owners can delete their photos
create policy if not exists "space-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'space-photos' and auth.uid()::text = (storage.foldername(name))[1]);
