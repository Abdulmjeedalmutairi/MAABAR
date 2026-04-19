-- Fix: suppliers could not update their own profile.
--
-- The lockdown migration (202604011050) added a RESTRICTIVE policy for UPDATE
-- but never added a corresponding PERMISSIVE policy. In Postgres RLS, an UPDATE
-- requires at least one PERMISSIVE policy to allow it AND all RESTRICTIVE policies
-- to pass. With no permissive policy, PostgREST silently drops every UPDATE and
-- returns { data: [], error: null } — the UI showed a false success banner while
-- the database was never changed.

create policy profiles_self_update
  on public.profiles
  as permissive
  for update
  to authenticated
  using  (id = auth.uid())
  with check (id = auth.uid());

-- Admin users can update any profile row (needed for the admin approval flow).
create policy profiles_admin_update
  on public.profiles
  as permissive
  for update
  to authenticated
  using  (public.is_admin_user())
  with check (public.is_admin_user());
