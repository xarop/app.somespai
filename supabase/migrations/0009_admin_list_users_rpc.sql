-- Reliable alternative to auth.admin.listUsers() JS API
-- Called by service_role only; reads directly from auth.users
create or replace function public.admin_list_users()
returns table (
  id            uuid,
  email         text,
  created_at    timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
stable
as $$
  select id, email, created_at, last_sign_in_at
  from auth.users
  order by created_at desc;
$$;

revoke all     on function public.admin_list_users() from public;
revoke execute on function public.admin_list_users() from anon, authenticated;
grant  execute on function public.admin_list_users() to   service_role;
