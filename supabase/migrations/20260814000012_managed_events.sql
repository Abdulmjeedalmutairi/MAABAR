-- Managed-order operational lifecycle — the timeline the trader tracks and the
-- admin drives. Each row is a stage event (note / status change / pre-shipping
-- video / document / shipping update). managed_status on requests still holds the
-- current stage; managed_events is the history + the buyer-visible tracker feed.
begin;

create table if not exists public.managed_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  stage text,                            -- received|sourcing|offer|production|video|shipping|delivered
  kind text not null default 'note',     -- note|status|video|document|shipping
  title text,
  body text,
  media_url text,                        -- video/doc in the managed-media bucket
  visible_to_buyer boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists managed_events_request_idx on public.managed_events(request_id, created_at);

alter table public.managed_events enable row level security;

drop policy if exists managed_events_select on public.managed_events;
create policy managed_events_select on public.managed_events for select using (
  public.is_admin_user()
  or (visible_to_buyer and exists (
    select 1 from public.requests r where r.id = request_id and r.buyer_id = auth.uid()
  ))
);

-- Only Maabar (admins) write the lifecycle.
drop policy if exists managed_events_write on public.managed_events;
create policy managed_events_write on public.managed_events for all
  using (public.is_admin_user()) with check (public.is_admin_user());

-- Public bucket for the pre-shipping video + managed documents (admin uploads;
-- the trader views by URL — not sensitive beyond the order).
insert into storage.buckets (id, name, public)
values ('managed-media', 'managed-media', true)
on conflict (id) do nothing;

drop policy if exists managed_media_admin_write on storage.objects;
create policy managed_media_admin_write on storage.objects for insert
  to authenticated with check (bucket_id = 'managed-media' and public.is_admin_user());
drop policy if exists managed_media_admin_update on storage.objects;
create policy managed_media_admin_update on storage.objects for update
  to authenticated using (bucket_id = 'managed-media' and public.is_admin_user());
drop policy if exists managed_media_public_read on storage.objects;
create policy managed_media_public_read on storage.objects for select
  using (bucket_id = 'managed-media');

commit;
