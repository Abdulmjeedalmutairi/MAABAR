-- Chat unification (Phase 1, step 1) — teach the direct `messages` table to also
-- carry a buyer↔factory conversation.
--
-- Today factory chat lives in a separate stack (factory_threads /
-- factory_thread_messages) purely because `messages` is pair-keyed on two real
-- accounts and a factory may have no account yet. We unify onto `messages` by
-- adding a nullable factory anchor:
--
--   • factory_id   — when set, this row belongs to a buyer↔factory conversation
--                    (factory_directory row), NOT a direct account↔account DM.
--                    A buyer→factory message has sender_id = buyer,
--                    receiver_id = NULL, factory_id = <directory id>. It simply
--                    waits; the moment the factory registers and links
--                    (factory_directory.linked_supplier_id = auth.uid()) the
--                    owner resolves the thread — the SAME mechanic the old
--                    factory_threads system used, so no re-keying/backfill.
--   • product_ref  — denormalized product card carried in the chat (name/image/
--                    price/ref), mirroring factory_thread_messages.product_ref.
--
-- This migration ONLY adds the columns + index. The RLS/guard changes that let a
-- buyer address a factory and let the owner read those rows come in the next
-- step, rebuilt from the LIVE messages policy/trigger definitions.
--
-- messages' base DDL predates versioned migrations (created via the dashboard),
-- so we ALTER with IF NOT EXISTS rather than assume a CREATE here.
begin;

alter table public.messages
  add column if not exists factory_id  uuid  references public.factory_directory(id) on delete set null,
  add column if not exists product_ref jsonb;

comment on column public.messages.factory_id is
  'When set, this message belongs to a buyer↔factory conversation (factory_directory row). Resolves to the owner via factory_directory.linked_supplier_id once the factory registers. NULL for ordinary account↔account DMs.';
comment on column public.messages.product_ref is
  'Optional denormalized product card shown in the conversation (id, factory_id, name, image, ref_code, price, currency).';

-- Thread lookups by factory only ever query the factory-addressed rows.
create index if not exists messages_factory_idx
  on public.messages (factory_id)
  where factory_id is not null;

commit;
