alter table public.profiles
  add column if not exists certifications jsonb[] not null default '{}';
