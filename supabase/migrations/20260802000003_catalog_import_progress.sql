-- Live extraction progress for the admin import panel.
--
-- The Cloud Run worker writes { stage, pct, note } here as it runs (downloading →
-- images → analyzing → matching → uploading → done), and the admin panel renders
-- a step tracker + progress bar from it. Best-effort: the worker's progress writes
-- are guarded, so extraction still succeeds even if this column is missing.
begin;

alter table public.factory_catalog_imports
  add column if not exists progress jsonb;

comment on column public.factory_catalog_imports.progress is
  'Live extraction progress { stage, pct, note } written by the worker; drives the admin step/progress UI. Nullable.';

commit;
