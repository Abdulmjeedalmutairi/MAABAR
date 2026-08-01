-- Phase 1B — request_customization: buyer-authored structured customization for a
-- factory request (product-bound or factory-level inquiry). 1:1 with requests.
--
-- Reuses requests.quantity / requests.unit / requests.notes / requests.budget_*
-- (already present) — this table holds ONLY the genuinely new fields so the shared
-- requests table stays untouched. RLS mirrors managed_request_briefs exactly:
-- buyer-owned; the factory never reads this table directly — it sees a
-- buyer-identity-stripped subset through the get_factory_invite SECURITY DEFINER
-- RPC (widened in migration 20260801000005).
begin;

create table if not exists public.request_customization (
  id                   uuid primary key default gen_random_uuid(),
  request_id           uuid not null unique references public.requests(id) on delete cascade,
  buyer_id             uuid not null references public.profiles(id) on delete cascade,
  customization_types  text[] not null default '{}',   -- selected chips (multi-select)
  customization_details text,                           -- free-text; folded into the AI brief, never shown raw
  delivery_timeframe   text check (delivery_timeframe in ('flexible', '2_weeks', '1_month', '2_months')),
  ship_country         text,
  ship_city            text,
  additional_notes     text,                            -- free-text; folded into the AI brief, never shown raw
  attachment_paths     text[] not null default '{}',    -- object paths in the private request-attachments bucket
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists request_customization_request_idx on public.request_customization (request_id);

create or replace trigger request_customization_touch_updated_at
before update on public.request_customization
for each row execute function public.touch_updated_at();

alter table public.request_customization enable row level security;

drop policy if exists request_customization_select on public.request_customization;
create policy request_customization_select
on public.request_customization
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
  or exists (
    select 1 from public.requests r
    where r.id = request_customization.request_id and r.buyer_id = auth.uid()
  )
);

drop policy if exists request_customization_insert on public.request_customization;
create policy request_customization_insert
on public.request_customization
for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_customization.request_id
        and r.buyer_id = auth.uid()
    )
  )
);

drop policy if exists request_customization_update on public.request_customization;
create policy request_customization_update
on public.request_customization
for update
to authenticated
using (public.is_admin_user() or buyer_id = auth.uid())
with check (public.is_admin_user() or buyer_id = auth.uid());

commit;
