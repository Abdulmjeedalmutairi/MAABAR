-- Attachments (reference images) for the main buyer request form (managed /
-- direct), mirroring request_customization.attachment_paths. Object paths live
-- in the private request-attachments bucket (created in 20260801000004); that
-- bucket's RLS already scopes upload/read to the owner's {uid}/ folder, and the
-- existing requests row policies already cover this new column.

alter table public.requests
  add column if not exists attachment_paths text[] not null default '{}';
