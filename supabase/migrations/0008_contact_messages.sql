-- Contact messages: anyone can submit, only service role can read
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  type       text not null check (type in ('bug', 'suggestion', 'question', 'other')),
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

-- Public insert (anyone can send a message, no auth required)
create policy "contact_messages_public_insert"
  on contact_messages for insert
  with check (true);

-- No select/update/delete policy — service role bypasses RLS and is used by admin
