create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.requests
  add column if not exists sourcing_mode text not null default 'direct',
  add column if not exists managed_status text,
  add column if not exists managed_priority text,
  add column if not exists managed_review_state text,
  add column if not exists managed_last_buyer_action text,
  add column if not exists managed_follow_up_needed boolean not null default false,
  add column if not exists managed_research_requested_count integer not null default 0,
  add column if not exists managed_ai_ready_at timestamptz,
  add column if not exists managed_reviewed_at timestamptz,
  add column if not exists managed_shortlist_ready_at timestamptz,
  add column if not exists response_deadline timestamptz;

update public.requests
set sourcing_mode = coalesce(nullif(trim(sourcing_mode), ''), 'direct');

update public.requests
set managed_status = case
  when coalesce(managed_status, '') <> '' then managed_status
  when sourcing_mode = 'managed' then 'submitted'
  else null
end;

alter table public.requests
  alter column sourcing_mode set default 'direct';

create table if not exists public.managed_request_briefs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  ai_status text not null default 'pending',
  admin_review_status text not null default 'pending',
  cleaned_description text,
  extracted_specs jsonb not null default '[]'::jsonb,
  category text,
  priority text,
  supplier_brief text,
  admin_follow_up_question text,
  admin_internal_notes text,
  ai_confidence text,
  ai_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.managed_supplier_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'new',
  supplier_response text,
  admin_note text,
  supplier_note text,
  matched_at timestamptz not null default now(),
  viewed_at timestamptz,
  supplier_responded_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, supplier_id)
);

create table if not exists public.managed_shortlisted_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  rank smallint not null,
  unit_price numeric(12,2),
  moq text,
  production_time_days integer,
  shipping_time_days integer,
  verification_level text,
  maabar_notes text,
  selection_reason text,
  negotiation_summary text,
  status text not null default 'active',
  selected_by_buyer boolean not null default false,
  buyer_selected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, rank)
);

create table if not exists public.managed_shortlist_feedback (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  shortlist_offer_id uuid references public.managed_shortlisted_offers(id) on delete cascade,
  action text not null,
  reason text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.offers
  add column if not exists managed_match_id uuid references public.managed_supplier_matches(id) on delete set null,
  add column if not exists managed_visibility text not null default 'buyer_visible',
  add column if not exists admin_internal_note text,
  add column if not exists negotiation_note text,
  add column if not exists shortlisted_at timestamptz;

create index if not exists requests_sourcing_mode_idx on public.requests (sourcing_mode, managed_status, buyer_id);
create index if not exists requests_response_deadline_idx on public.requests (response_deadline);
create index if not exists managed_request_briefs_buyer_idx on public.managed_request_briefs (buyer_id);
create index if not exists managed_supplier_matches_supplier_idx on public.managed_supplier_matches (supplier_id, status, matched_at desc);
create index if not exists managed_supplier_matches_request_idx on public.managed_supplier_matches (request_id, status);
create index if not exists managed_shortlisted_offers_request_idx on public.managed_shortlisted_offers (request_id, rank);
create index if not exists managed_shortlist_feedback_request_idx on public.managed_shortlist_feedback (request_id, buyer_id, created_at desc);

create or replace trigger managed_request_briefs_touch_updated_at
before update on public.managed_request_briefs
for each row execute function public.touch_updated_at();

create or replace trigger managed_supplier_matches_touch_updated_at
before update on public.managed_supplier_matches
for each row execute function public.touch_updated_at();

create or replace trigger managed_shortlisted_offers_touch_updated_at
before update on public.managed_shortlisted_offers
for each row execute function public.touch_updated_at();

alter table public.managed_request_briefs enable row level security;
alter table public.managed_supplier_matches enable row level security;
alter table public.managed_shortlisted_offers enable row level security;
alter table public.managed_shortlist_feedback enable row level security;

drop policy if exists managed_request_briefs_select on public.managed_request_briefs;
create policy managed_request_briefs_select
on public.managed_request_briefs
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
  or exists (
    select 1
    from public.requests r
    where r.id = managed_request_briefs.request_id
      and r.buyer_id = auth.uid()
  )
);

drop policy if exists managed_request_briefs_insert on public.managed_request_briefs;
create policy managed_request_briefs_insert
on public.managed_request_briefs
for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    buyer_id = auth.uid()
    and exists (
      select 1
      from public.requests r
      where r.id = managed_request_briefs.request_id
        and r.buyer_id = auth.uid()
        and lower(coalesce(r.sourcing_mode, 'direct')) = 'managed'
    )
  )
);

drop policy if exists managed_request_briefs_update on public.managed_request_briefs;
create policy managed_request_briefs_update
on public.managed_request_briefs
for update
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
)
with check (
  public.is_admin_user()
  or buyer_id = auth.uid()
);

drop policy if exists managed_supplier_matches_select on public.managed_supplier_matches;
create policy managed_supplier_matches_select
on public.managed_supplier_matches
for select
to authenticated
using (
  public.is_admin_user()
  or supplier_id = auth.uid()
  or buyer_id = auth.uid()
);

drop policy if exists managed_supplier_matches_insert on public.managed_supplier_matches;
create policy managed_supplier_matches_insert
on public.managed_supplier_matches
for insert
to authenticated
with check (
  public.is_admin_user()
);

drop policy if exists managed_supplier_matches_update on public.managed_supplier_matches;
create policy managed_supplier_matches_update
on public.managed_supplier_matches
for update
to authenticated
using (
  public.is_admin_user()
  or supplier_id = auth.uid()
)
with check (
  public.is_admin_user()
  or supplier_id = auth.uid()
);

drop policy if exists managed_shortlisted_offers_select on public.managed_shortlisted_offers;
create policy managed_shortlisted_offers_select
on public.managed_shortlisted_offers
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
);

drop policy if exists managed_shortlisted_offers_insert on public.managed_shortlisted_offers;
create policy managed_shortlisted_offers_insert
on public.managed_shortlisted_offers
for insert
to authenticated
with check (
  public.is_admin_user()
);

drop policy if exists managed_shortlisted_offers_update on public.managed_shortlisted_offers;
create policy managed_shortlisted_offers_update
on public.managed_shortlisted_offers
for update
to authenticated
using (
  public.is_admin_user()
)
with check (
  public.is_admin_user()
);

drop policy if exists managed_shortlist_feedback_select on public.managed_shortlist_feedback;
create policy managed_shortlist_feedback_select
on public.managed_shortlist_feedback
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
);

drop policy if exists managed_shortlist_feedback_insert on public.managed_shortlist_feedback;
create policy managed_shortlist_feedback_insert
on public.managed_shortlist_feedback
for insert
to authenticated
with check (
  buyer_id = auth.uid()
  and exists (
    select 1
    from public.requests r
    where r.id = managed_shortlist_feedback.request_id
      and r.buyer_id = auth.uid()
      and lower(coalesce(r.sourcing_mode, 'direct')) = 'managed'
  )
);

drop policy if exists managed_shortlist_feedback_update on public.managed_shortlist_feedback;
create policy managed_shortlist_feedback_update
on public.managed_shortlist_feedback
for update
to authenticated
using (
  public.is_admin_user()
)
with check (
  public.is_admin_user()
);

drop policy if exists requests_select_visible_to_verified_suppliers on public.requests;
create policy requests_select_visible_to_verified_suppliers
on public.requests
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and lower(coalesce(admin_profile.role, '')) = 'admin'
  )
  or buyer_id = auth.uid()
  or (
    exists (
      select 1
      from public.profiles supplier_profile
      where supplier_profile.id = auth.uid()
        and lower(coalesce(supplier_profile.role, '')) = 'supplier'
        and lower(coalesce(supplier_profile.status, '')) = 'verified'
        and nullif(trim(coalesce(supplier_profile.maabar_supplier_id, '')), '') is not null
    )
    and lower(coalesce(sourcing_mode, 'direct')) = 'direct'
    and lower(coalesce(status, '')) in ('open', 'offers_received')
  )
  or exists (
    select 1
    from public.managed_supplier_matches msm
    where msm.request_id = requests.id
      and msm.supplier_id = auth.uid()
  )
);
