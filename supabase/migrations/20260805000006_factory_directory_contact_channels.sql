-- Admin Console supplier Overview: two more contact channels the founder wants
-- surfaced/editable on the supplier profile. Kept on the base table only (like
-- email/phone) — NOT added to factory_directory_public, so they stay admin-side
-- contact details, not buyer-facing.
alter table public.factory_directory
  add column if not exists wechat  text,
  add column if not exists website text;
