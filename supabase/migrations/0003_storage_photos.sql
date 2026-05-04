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
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'space-photos: public read'
  ) then
    create policy "space-photos: public read"
      on storage.objects for select
      using (bucket_id = 'space-photos');
  end if;
end $$;

-- Authenticated users can upload to their own folder
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'space-photos: owner upload'
  ) then
    create policy "space-photos: owner upload"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'space-photos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;

-- Owners can delete their photos
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'space-photos: owner delete'
  ) then
    create policy "space-photos: owner delete"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'space-photos' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;
