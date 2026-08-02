-- Factories section (Batch 1) — internal factory directory we control (Arman-
-- populated). Factories are NOT platform accounts (profiles is auth-coupled via
-- handle_new_user), so this is a standalone set of tables, decoupled from
-- profiles/auth. Real factory identity is shown deliberately (explicit
-- agreements) — EXCEPT the factory email, which stays server-side only
-- (buyer/anon must never read it; it's the anti-bypass boundary).
--
-- Three tables + one public view + a shared short-slug generator:
--   factory_directory        — the directory rows (admin-managed, email hidden)
--   factory_directory_public — view exposing everything EXCEPT email, to anon
--   factory_products         — display-only catalog (NOT the transactional products)
--   request_factory_invites  — one per factory-bound request; lifecycle tracking
--
-- gen_short_slug() is shared with Batch 3's request_supplier_invites.
begin;

-- ── Shared short slug: 7 chars from an unambiguous alphabet (no 0/O/1/I/L) ──
-- ~34 bits; uniqueness enforced by the column constraint, callers retry on clash.
create or replace function public.gen_short_slug(p_len int default 7)
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result   text := '';
  i        int;
begin
  for i in 1..p_len loop
    result := result || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  end loop;
  return result;
end;
$$;

-- ── factory_directory ──────────────────────────────────────────────────────
create table if not exists public.factory_directory (
  id                 uuid primary key default gen_random_uuid(),
  company_name       text not null,
  company_name_latin text,
  email              text not null,                 -- server-side only (never in the public view)
  category           text not null,                 -- a single real UI_CATEGORIES code
  description_ar     text,
  description_en     text,
  description_zh     text,
  city               text,
  country            text default 'China',
  factory_images     text[] not null default '{}',
  -- Future-conversion seam: set when a factory registers (its minimal supplier
  -- profile). Conversion flow itself is OUT OF SCOPE now.
  linked_supplier_id uuid references public.profiles(id) on delete set null,
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists factory_directory_category_idx on public.factory_directory (category) where is_active;

alter table public.factory_directory enable row level security;
-- Admin-managed only. anon/buyers read the view below (which omits email), never
-- the base table. service_role bypasses RLS for the edge function's email lookup.
drop policy if exists factory_directory_admin_all on public.factory_directory;
create policy factory_directory_admin_all on public.factory_directory
  for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

-- Public view: everything a buyer may see — NO email, NO linked_supplier_id.
-- security_invoker=false so it runs as owner and bypasses the base-table RLS.
create or replace view public.factory_directory_public as
select
  f.id, f.company_name, f.company_name_latin, f.category,
  f.description_ar, f.description_en, f.description_zh,
  f.city, f.country, f.factory_images, f.sort_order
from public.factory_directory f
where f.is_active;

alter view public.factory_directory_public set (security_invoker = false);
revoke all on table public.factory_directory_public from public;
grant select on table public.factory_directory_public to anon, authenticated;

-- ── factory_products (display-only catalog) ────────────────────────────────
create table if not exists public.factory_products (
  id         uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factory_directory(id) on delete cascade,
  name_ar    text,
  name_en    text,
  name_zh    text,
  image      text,
  ref_code   text,                                 -- optional catalog code, e.g. "EQ153F"
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists factory_products_factory_idx on public.factory_products (factory_id);

alter table public.factory_products enable row level security;
-- Catalog items carry no sensitive data → public read; admin-managed writes.
drop policy if exists factory_products_public_read on public.factory_products;
create policy factory_products_public_read on public.factory_products
  for select to anon, authenticated using (true);
drop policy if exists factory_products_admin_write on public.factory_products;
create policy factory_products_admin_write on public.factory_products
  for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

-- ── request_factory_invites (one per factory-bound request) ────────────────
create table if not exists public.request_factory_invites (
  id                    uuid primary key default gen_random_uuid(),
  request_id            uuid not null references public.requests(id) on delete cascade,
  factory_id            uuid not null references public.factory_directory(id) on delete restrict,
  factory_product_id    uuid references public.factory_products(id) on delete set null,  -- null = factory-level custom request
  slug                  text not null unique default public.gen_short_slug(),
  factory_email         text not null,             -- snapshot at send time
  status                text not null default 'sent'
                          check (status in ('sent', 'opened', 'registered', 'offer_submitted')),
  opened_at             timestamptz,
  registered_at         timestamptz,
  offer_submitted_at    timestamptz,
  registered_supplier_id uuid references public.profiles(id) on delete set null,  -- the factory's minted account (Phase 4)
  created_by            uuid references public.profiles(id) on delete set null,   -- the buyer
  expires_at            timestamptz not null default (now() + interval '14 days'),
  created_at            timestamptz not null default now()
);
create index if not exists request_factory_invites_request_idx on public.request_factory_invites (request_id);
create index if not exists request_factory_invites_factory_idx on public.request_factory_invites (factory_id);

alter table public.request_factory_invites enable row level security;
-- Admin: full. Buyer: read the invites for their OWN requests (status tracking).
-- Creation + status transitions happen server-side (edge fn / SECURITY DEFINER
-- RPC on service_role, which bypasses RLS) — no client INSERT/UPDATE policy, and
-- the slug-open path (Phase 4) reads by slug through a definer RPC, not the table.
drop policy if exists request_factory_invites_admin_all on public.request_factory_invites;
create policy request_factory_invites_admin_all on public.request_factory_invites
  for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());
drop policy if exists request_factory_invites_buyer_read_own on public.request_factory_invites;
create policy request_factory_invites_buyer_read_own on public.request_factory_invites
  for select to authenticated using (
    exists (select 1 from public.requests r where r.id = request_id and r.buyer_id = auth.uid())
  );

commit;
