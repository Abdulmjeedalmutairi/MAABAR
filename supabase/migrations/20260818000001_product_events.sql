-- ============================================================================
-- Engagement tracking — the data foundation for algorithmic product ranking.
-- Lightweight append-only event log (view / click / quote / chat / search).
-- No LLM anywhere: ranking reads these counts as a popularity signal.
-- ============================================================================

create table if not exists public.product_events (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.factory_products(id) on delete cascade,
  factory_id  uuid,
  event_type  text not null check (event_type in ('view', 'click', 'quote', 'chat', 'search')),
  user_id     uuid,
  created_at  timestamptz not null default now()
);

create index if not exists product_events_product_idx      on public.product_events (product_id);
create index if not exists product_events_type_created_idx on public.product_events (event_type, created_at desc);

alter table public.product_events enable row level security;

-- Anyone (incl. anon browsers) may LOG an event for a real product — it's a
-- write-only firehose. The FK guarantees a valid product; nothing sensitive is
-- stored. Only admins may READ the log (analytics/ranking runs SECURITY DEFINER).
drop policy if exists product_events_insert on public.product_events;
create policy product_events_insert on public.product_events
  for insert to anon, authenticated with check (true);

drop policy if exists product_events_admin_read on public.product_events;
create policy product_events_admin_read on public.product_events
  for select to authenticated using (public.is_admin_user());

grant insert on public.product_events to anon, authenticated;
grant select on public.product_events to authenticated;
