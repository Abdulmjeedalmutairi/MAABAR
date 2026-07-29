-- Request-first redesign — foundation schema (Batch 0).
--
-- Additive and safe, verified read-only against the live DB before writing:
--   requests.request_kind           EXISTS (untracked; mobile writes direct|managed|idea_to_product)
--   requests.target_supplier_id     EXISTS (untracked; mobile writes it for targeted requests)
--   requests.assigned_to            ABSENT  -> added here (Batch 4)
--   requests.admin_first_replied_at ABSENT  -> added here (Batch 6 SLA)
--
-- No RLS/trigger changes. The requests/offers base CREATE statements and the
-- requests INSERT policy remain untracked base schema and are NOT touched here.
begin;

-- Formalize the two untracked, mobile-written columns. `add ... if not exists`
-- is a no-op in prod (they already exist); this records them in migration
-- history + documents them so web can adopt request_kind as the fine-grained
-- request type (decision #1). Does not alter existing column type or data.
alter table public.requests
  add column if not exists request_kind text,
  add column if not exists target_supplier_id uuid;

comment on column public.requests.request_kind is
  'Fine-grained request type: direct | managed | idea_to_product. Complements sourcing_mode (direct|managed), which stays the RLS/pipeline driver. Historically written only by the mobile app; web adopts it in the request-first redesign.';
comment on column public.requests.target_supplier_id is
  'Supplier the buyer targeted at creation time (mobile "Post Request" from a supplier profile). Distinct from admin-initiated per-supplier invites (request_supplier_invites, Batch 3).';

-- Forward-only value guard on request_kind. NOT VALID = enforced on every
-- new/updated row immediately, but existing rows are NOT scanned (they can't be
-- read read-only via anon, and some legacy rows may still be NULL until the
-- deferred backfill). NULL stays allowed because web writes NULL until it adopts
-- request_kind (Batch 2). After the backfill, run `validate constraint` to
-- confirm/enforce it historically. drop-if-exists keeps the migration idempotent.
alter table public.requests drop constraint if exists requests_request_kind_check;
alter table public.requests
  add constraint requests_request_kind_check
  check (request_kind is null or request_kind in ('direct', 'managed', 'idea_to_product'))
  not valid;

-- Batch 4 — assign a managed request to a team member (profiles.role in
-- admin/super_admin). Nullable; everything is unassigned today. FK clears the
-- assignment if the admin profile is ever removed.
alter table public.requests
  add column if not exists assigned_to uuid references public.profiles(id) on delete set null;

comment on column public.requests.assigned_to is
  'Admin/super_admin (profiles.id) this request is assigned to. Null = unassigned. Batch 4.';

create index if not exists requests_assigned_to_idx
  on public.requests (assigned_to)
  where assigned_to is not null;

-- Batch 6 — timestamp of the FIRST admin reply to the trader, for the 24h
-- no-reply SLA warning. Full reply history lives in request_admin_replies
-- (Batch 6); this denormalized column keeps the "overdue?" check cheap.
alter table public.requests
  add column if not exists admin_first_replied_at timestamptz;

comment on column public.requests.admin_first_replied_at is
  'When the first admin reply was sent to the trader. Drives the 24h no-reply warning. Denormalized from request_admin_replies. Batch 6.';

commit;
