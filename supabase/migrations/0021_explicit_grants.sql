-- Explicit Data API grants for all public tables.
-- Required by Supabase change: from Oct 30 2026, new tables get no default grants.
-- RLS policies remain the row-level enforcement layer; these grants are the table-level gate.

-- ── profiles ─────────────────────────────────────────────────────────────────
grant select                       on public.profiles to anon;
grant select, update               on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

-- ── spaces ───────────────────────────────────────────────────────────────────
grant select                         on public.spaces to anon;
grant select, insert, update, delete on public.spaces to authenticated;
grant select, insert, update, delete on public.spaces to service_role;

-- ── reviews ──────────────────────────────────────────────────────────────────
grant select                         on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.reviews to service_role;

-- ── favorites ────────────────────────────────────────────────────────────────
-- No anon access: favorites require authentication (enforced by RLS too)
grant select, insert, delete         on public.favorites to authenticated;
grant select, insert, update, delete on public.favorites to service_role;

-- ── contact_messages ─────────────────────────────────────────────────────────
-- Insert-only for anon/authenticated; reads are admin-only via service_role
grant insert                         on public.contact_messages to anon;
grant insert                         on public.contact_messages to authenticated;
grant select, insert, update, delete on public.contact_messages to service_role;

-- ── import_jobs ──────────────────────────────────────────────────────────────
-- Already granted in 0015; repeated here for completeness — grants are idempotent
grant select, insert, update, delete on public.import_jobs to service_role;
