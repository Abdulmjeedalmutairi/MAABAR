-- ── Item 1: requests ────────────────────────────────────────────────────────
-- title_zh was referenced in JS but never created via migration.
alter table requests
  add column if not exists title_zh       text,
  add column if not exists description_ar text,
  add column if not exists description_en text,
  add column if not exists description_zh text;

-- ── Item 2: message_translations ────────────────────────────────────────────
create table if not exists message_translations (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references messages(id) on delete cascade,
  direction       text not null,
  translated_text text not null,
  created_at      timestamptz default now(),
  unique (message_id, direction)
);
alter table message_translations enable row level security;
create policy if not exists "mt_select" on message_translations
  for select using (auth.role() = 'authenticated');
create policy if not exists "mt_insert" on message_translations
  for insert with check (auth.role() = 'authenticated');

-- ── Item 4: products ────────────────────────────────────────────────────────
alter table products
  add column if not exists desc_zh text;

-- ── Item 5: offers ──────────────────────────────────────────────────────────
alter table offers
  add column if not exists note_ar text,
  add column if not exists note_en text,
  add column if not exists note_zh text;
