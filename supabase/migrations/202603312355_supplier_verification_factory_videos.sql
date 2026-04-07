begin;

alter table public.profiles
  add column if not exists factory_videos text[] default '{}'::text[];

commit;
