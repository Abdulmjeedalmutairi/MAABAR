-- Chat unification CUTOVER — copy existing factory_thread_messages into `messages`
-- so pre-existing factory conversations appear in the unified chat.
--
-- APPLY AT CUTOVER (when the new unified-chat client is deployed), because the
-- live OLD client keeps writing to factory_thread_messages until then. This is
-- IDEMPOTENT (tracked by legacy_ftm_id) so it can be re-run at the moment of
-- deploy to capture the last stragglers. It does NOT delete the old tables — the
-- retire/drop happens in a later step once verified.
--
-- Mapping to the unified addressing:
--   • trader message  → sender_id = trader, receiver_id = NULL      (factory-inbound)
--   • factory/admin    → sender_id = ftm.sender_id, receiver_id = trader (reply)
--   • is_read          → the counterpart's read flag
begin;

-- Track the source row so re-runs never duplicate.
alter table public.messages add column if not exists legacy_ftm_id uuid;
create unique index if not exists messages_legacy_ftm_id_key
  on public.messages (legacy_ftm_id) where legacy_ftm_id is not null;

-- Bypass the guard trigger + RLS for this trusted server-side copy (auth.uid() is
-- null here, and the guard requires sender_id = auth.uid()).
set local session_replication_role = replica;

insert into public.messages
  (sender_id, receiver_id, factory_id, content, product_ref, is_read, created_at, legacy_ftm_id)
select
  case when ftm.sender_role = 'trader' then ft.trader_id else ftm.sender_id end,
  case when ftm.sender_role = 'trader' then null else ft.trader_id end,
  ft.factory_id,
  ftm.content,
  ftm.product_ref,
  case when ftm.sender_role = 'trader'
       then coalesce(ftm.read_by_factory, false)
       else coalesce(ftm.read_by_trader, false) end,
  ftm.created_at,
  ftm.id
from public.factory_thread_messages ftm
join public.factory_threads ft on ft.id = ftm.thread_id
where not exists (select 1 from public.messages m where m.legacy_ftm_id = ftm.id)
  -- a non-trader message needs a real sender to carry over
  and (ftm.sender_role = 'trader' or ftm.sender_id is not null);

-- NOTE: stored factory translations are intentionally NOT carried over — the
-- live message_translations schema differs (no `direction` column) and cached
-- translations regenerate automatically on view, so they are not worth a fragile
-- cross-schema copy. Only the messages themselves are migrated above.

commit;
