-- Branch 3: Google Places admin imports
--
-- Adds import_jobs table to track batch imports from external sources,
-- and import_job_id FK on spaces to link imported spaces to their job.

create table if not exists import_jobs (
  id           uuid        primary key default gen_random_uuid(),
  source       text        not null default 'google_places',
  query        text        not null,
  bounds       jsonb,              -- optional { lat, lng, radius }
  space_count  int         not null default 0,
  created_at   timestamptz not null default now(),
  created_by   uuid        references auth.users(id)
);

alter table import_jobs enable row level security;
-- No public RLS → only service_role accesses import_jobs

alter table spaces
  add column if not exists import_job_id uuid references import_jobs(id);

create index if not exists spaces_import_job_idx
  on spaces(import_job_id) where import_job_id is not null;

-- Allow service_role to read/write import_jobs (already implicit, but explicit grant)
grant select, insert, update on import_jobs to service_role;
