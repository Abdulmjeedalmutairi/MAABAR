-- Add per-user UI language preference column to profiles.
-- Distinct from the existing `languages text[]` column (which lists the
-- supplier's business languages). `lang` is the user's UI preference for
-- chat translation routing, email language, etc.

alter table public.profiles
  add column if not exists lang text;

comment on column public.profiles.lang is
  'User UI language preference (ar|en|zh). Distinct from `languages text[]` which lists supplier business languages.';

-- Backfill existing rows by role.
-- Supplier persona is Chinese, trader persona is Saudi Arabic, anything else
-- defaults to ar.
update public.profiles
set lang = case
  when role = 'supplier' then 'zh'
  when role = 'buyer'    then 'ar'
  else 'ar'
end
where lang is null;

-- Constrain to the supported set. Allows NULL by SQL semantics (check
-- passes when the expression is unknown), so legacy/edge-case inserts
-- that omit the column don't fail outright — the BEFORE INSERT trigger
-- below populates them.
alter table public.profiles
  drop constraint if exists profiles_lang_check;
alter table public.profiles
  add constraint profiles_lang_check
  check (lang in ('ar', 'en', 'zh'));

-- Auto-populate `lang` on insert when the inserter doesn't provide it.
-- Order of preference:
--   1. Explicit value passed by the inserter (already in NEW.lang).
--   2. `lang` key in auth.users.raw_user_meta_data (set on auth.signUp).
--   3. Role-based default: supplier -> 'zh', buyer/everyone else -> 'ar'.
--
-- This is a separate BEFORE INSERT trigger on public.profiles. It does
-- not modify any existing handle_new_user trigger on auth.users.
create or replace function public.set_profile_lang_default()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_lang text;
begin
  if new.lang is not null then
    return new;
  end if;

  select raw_user_meta_data->>'lang' into meta_lang
  from auth.users where id = new.id;

  if meta_lang in ('ar', 'en', 'zh') then
    new.lang := meta_lang;
    return new;
  end if;

  new.lang := case
    when new.role = 'supplier' then 'zh'
    when new.role = 'buyer'    then 'ar'
    else 'ar'
  end;
  return new;
end;
$$;

drop trigger if exists set_profile_lang_default on public.profiles;
create trigger set_profile_lang_default
before insert on public.profiles
for each row execute function public.set_profile_lang_default();
