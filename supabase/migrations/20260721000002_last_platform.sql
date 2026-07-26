-- Track which platform a user last used, so emails can link to the right place.
--
-- Needed by the admin email feature: a link should open the mobile app for app
-- users and the website for web users. Nothing in the schema recorded this.
--
-- Written through an RPC rather than a direct client UPDATE on profiles, for two
-- reasons: it pins the value to a known set instead of letting a client write
-- arbitrary text, and direct client writes to profiles are precisely the pattern
-- being closed elsewhere in this codebase (guard_profile_sensitive_fields,
-- guard_profile_role_on_insert). The function only ever touches the caller's own
-- row and only these two columns.
begin;

alter table public.profiles
  add column if not exists last_platform    text,
  add column if not exists last_platform_at timestamptz;

comment on column public.profiles.last_platform is
  'Last platform the user opened a session from: web | app. Set via touch_last_platform(). NULL for users who have not signed in since 2026-07-21 — treat NULL as web.';

-- Telemetry, not a gate: it must never break a login. Invalid input is ignored
-- rather than raised, and there is no error path a caller has to handle.
create or replace function public.touch_last_platform(p_platform text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_platform text;
begin
  if auth.uid() is null then return; end if;

  v_platform := lower(nullif(btrim(coalesce(p_platform, '')), ''));
  if v_platform is null or v_platform not in ('web', 'app') then return; end if;

  -- Skip redundant writes: this fires on every session start, and without the
  -- guard a user opening the app ten times a day would generate ten writes plus
  -- ten guard-trigger evaluations for no new information.
  update public.profiles
     set last_platform    = v_platform,
         last_platform_at = now()
   where id = auth.uid()
     and (last_platform is distinct from v_platform
          or last_platform_at is null
          or last_platform_at < now() - interval '6 hours');
end;
$$;
alter function public.touch_last_platform(text) owner to postgres;

revoke all on function public.touch_last_platform(text) from public, anon;
grant execute on function public.touch_last_platform(text) to authenticated;

commit;
