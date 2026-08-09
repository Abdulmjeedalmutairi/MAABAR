-- Persisted AI translations for factory-thread messages — the factory-chat
-- equivalent of message_translations (which is keyed to the direct `messages`
-- table). Lets the factory chat reach full translation parity with the direct
-- chat: a line is translated by the AI once, then reused cross-device/session.
-- RLS mirrors message_translations exactly (any authenticated user may read/write
-- a translation row; the message content itself stays gated by its own RLS/RPC).

create table if not exists public.factory_message_translations (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid not null references public.factory_thread_messages(id) on delete cascade,
  direction       text not null,
  translated_text text not null,
  created_at      timestamptz default now(),
  unique (message_id, direction)
);

create index if not exists factory_message_translations_message_idx
  on public.factory_message_translations (message_id);

alter table public.factory_message_translations enable row level security;

drop policy if exists "fmt_select" on public.factory_message_translations;
create policy "fmt_select" on public.factory_message_translations
  for select to authenticated using (true);

drop policy if exists "fmt_insert" on public.factory_message_translations;
create policy "fmt_insert" on public.factory_message_translations
  for insert to authenticated with check (true);
