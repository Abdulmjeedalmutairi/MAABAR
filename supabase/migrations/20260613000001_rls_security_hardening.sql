-- 20260613000001_rls_security_hardening.sql
--
-- Resolves the Supabase security-linter findings:
--   (1) RLS disabled on public.profiles while policies exist (policies dormant
--       => table is effectively WIDE OPEN until RLS is turned on).
--   (2) Any other public table that has policies but RLS disabled.
--   (3) public.profile_directory (and supplier_public_profiles) SECURITY
--       DEFINER views — handled via the "restrict access" route.
--   (4) Sensitive columns on profiles (payout_* bank fields) — kept out of the
--       public views and reachable only by the row owner / admin via RLS.
--   (5) public.reviews had no RLS — locked to public read / author-only writes.
--
-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ APPLY WITH THE COMPANION CODE CHANGES (same PR). Enabling RLS on profiles ║
-- ║ changes cross-user behaviour the app relied on; the matching client edits ║
-- ║ are already prepared:                                                     ║
-- ║   • src/lib/profileVisibility.js → reads via the views (NOTE 2)           ║
-- ║   • src/pages/SupplierProfile.jsx → view-backed + dead fetch removed      ║
-- ║   • src/pages/DashboardBuyer.jsx → recalc_supplier_rating() RPC (NOTE 4)  ║
-- ║   • src/pages/DashboardSupplier.jsx → get_admin_user_ids() RPC (NOTE 4)   ║
-- ║ Apply this migration and ship those edits together or supplier visibility ║
-- ║ / reviews / admin pings will break.                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

begin;

-- ──────────────────────────────────────────────────────────────────────────
-- (1) Enable RLS on profiles.  Idempotent: re-enabling is a no-op.
--     Existing policies that begin enforcing once this is on:
--       • profiles_select_self_or_admin              (SELECT, permissive)
--       • profiles_self_update / profiles_admin_update (UPDATE, permissive)
--       • profiles_restrict_self_or_admin_update      (UPDATE, restrictive)
--     Dependency: these reference public.is_admin_user(), which must be
--     SECURITY DEFINER (it is, per 202604011050) so the policy does not
--     recurse into profiles' own RLS.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- (2) Enable RLS on every other public TABLE that has policies defined but
--     RLS turned off. Self-correcting: catches anything the linter flagged
--     without enumerating. Safe — only touches tables that already have
--     policies (so behaviour is already specified, just not yet enforced).
-- ──────────────────────────────────────────────────────────────────────────
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = false                       -- RLS currently OFF
      and exists (select 1 from pg_policy p where p.polrelid = c.oid)  -- has policies
  loop
    execute format('alter table public.%I enable row level security;', t.relname);
    raise notice 'Enabled RLS on public.% (had policies but RLS was off)', t.relname;
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- (3) profiles INSERT policy.
--     src/pages/Login.jsx (~line 528) inserts the user's OWN profile row as a
--     fallback during supplier signup when the auth webhook has not yet
--     created it. With RLS on and no INSERT policy, PostgREST would reject it.
--     Allow a user to insert ONLY their own row. (Webhook/trigger inserts run
--     as SECURITY DEFINER / service_role and bypass RLS, so they are unaffected.)
-- ──────────────────────────────────────────────────────────────────────────
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles
  as permissive
  for insert
  to authenticated
  with check (id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- (4) Sensitive columns + SECURITY DEFINER views — "restrict access" route.
--     Recreate both views so the app can read everything it needs from them
--     (instead of the base profiles table) once RLS is on. The views project
--     ONLY non-sensitive columns and NEVER include the payout_* bank fields
--     (payout_beneficiary_name, payout_account_number, payout_branch_name,
--     payout_iban, payout_bank_address) or email — those stay readable only by
--     the row owner / admin via the base-table RLS above.
--
--     Columns ADDED in this migration vs 202604011430:
--       • profile_directory        + speciality, maabar_supplier_id, trade_link,
--                                    lang, rating, reviews_count,
--                                    years_experience, year_established,
--                                    factory_images
--                                    (everything fetchProfileDirectoryByIds reads)
--       • supplier_public_profiles + full_name, role, certifications
--                                    (everything fetchSupplierPublicProfileById reads)
--
--     ⚠ full_name is now exposed via supplier_public_profiles, which is granted
--       to anon (public marketplace). This matches today's behaviour (the
--       public supplier page already reads full_name), but confirm it is an
--       acceptable disclosure of the supplier contact's personal name.
--
--     These stay SECURITY DEFINER (security_invoker = false) ON PURPOSE — they
--     are the column-partitioning layer. Flipping to security_invoker = true
--     would make them run under the caller's RLS (self/admin only), returning
--     just the caller's own row and defeating the directory. See NOTE 1.
-- ──────────────────────────────────────────────────────────────────────────

drop view if exists public.profile_directory;
create view public.profile_directory as
select
  p.id,
  p.role,
  p.status,
  p.full_name,
  p.company_name,
  p.avatar_url,
  p.city,
  p.country,
  p.speciality,
  p.maabar_supplier_id,
  p.trade_link,
  p.lang,
  p.rating,
  p.reviews_count,
  p.years_experience,
  p.year_established,
  p.factory_images
from public.profiles p;

alter view public.profile_directory set (security_invoker = false);

drop view if exists public.supplier_public_profiles;
create view public.supplier_public_profiles as
select
  p.id,
  p.full_name,
  p.role,
  p.company_name,
  p.avatar_url,
  p.status,
  p.rating,
  p.reviews_count,
  p.city,
  p.country,
  p.trade_link,
  p.wechat,
  p.whatsapp,
  p.factory_images,
  p.years_experience,
  p.maabar_supplier_id,
  p.min_order_value,
  p.speciality,
  p.company_website,
  p.company_description,
  p.bio_ar,
  p.bio_en,
  p.bio_zh,
  p.business_type,
  p.year_established,
  p.customization_support,
  p.company_address,
  p.languages,
  p.export_markets,
  p.export_years,
  p.certifications,
  null::int as deals_completed,
  p.completion_rate,
  (
    select count(*)::int
    from public.products pr
    where pr.supplier_id = p.id
      and coalesce(pr.is_active, false) = true
  ) as product_count
from public.profiles p
where lower(coalesce(p.role, '')) = 'supplier'
  and lower(coalesce(p.status, '')) in ('verified', 'approved', 'active')
  and nullif(trim(coalesce(p.maabar_supplier_id, '')), '') is not null;

alter view public.supplier_public_profiles set (security_invoker = false);

-- Least-privilege grants (re-asserted after recreate, which drops grants).
revoke all on table public.profile_directory from public;
grant  select on table public.profile_directory to authenticated;

revoke all on table public.supplier_public_profiles from public;
grant  select on table public.supplier_public_profiles to anon, authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- (5) SECURITY DEFINER helpers for the three cross-user paths that RLS (and the
--     guard_profile_sensitive_fields trigger) would otherwise block.
-- ──────────────────────────────────────────────────────────────────────────

-- 5a. Teach the sensitive-fields guard to allow rating/reviews_count writes
--     ONLY when the trusted recalc RPC below has set a transaction-local GUC.
--     PostgREST clients cannot set session GUCs, so this flag is unreachable
--     from the client — the only setter is recalc_supplier_rating(). All other
--     protected fields (role, status, maabar_supplier_id, trust_score) stay
--     locked even in recalc mode.
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rating_recalc boolean := coalesce(current_setting('app.allow_rating_recalc', true), '') = 'on';
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  -- Owner-only, EXCEPT the trusted recalc path (which updates another user's row).
  if auth.uid() is distinct from old.id and not rating_recalc then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or new.trust_score is distinct from old.trust_score then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  if not rating_recalc
     and (new.rating is distinct from old.rating
          or new.reviews_count is distinct from old.reviews_count) then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  return new;
end;
$$;

-- 5b. Recompute a supplier's aggregate rating/reviews_count from the
--     authoritative reviews table and write it back. Definer + GUC bypass so a
--     buyer can trigger it; values are derived server-side (never client input),
--     so calling it for any supplier_id only ever recomputes the true average.
--     Replaces the direct profiles UPDATE in DashboardBuyer.jsx submitReview().
create or replace function public.recalc_supplier_rating(p_supplier_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg   numeric;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;
  if p_supplier_id is null then
    return;
  end if;

  select avg(rating)::numeric, count(*)::int
    into v_avg, v_count
  from public.reviews
  where supplier_id = p_supplier_id;

  perform set_config('app.allow_rating_recalc', 'on', true);   -- transaction-local
  update public.profiles
     set rating        = coalesce(v_avg, 0),
         reviews_count = coalesce(v_count, 0)
   where id = p_supplier_id;
  perform set_config('app.allow_rating_recalc', 'off', true);
end;
$$;

-- 5c. Return admin / super_admin user ids. Definer so a non-admin (e.g. a
--     supplier sending "managed offer received" pings) can resolve admin
--     recipients without holding read access to admin rows under RLS.
--     Replaces the cross-user profiles SELECT in DashboardSupplier.jsx.
create or replace function public.get_admin_user_ids()
returns table(id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where lower(coalesce(p.role, '')) in ('admin', 'super_admin');
$$;

alter function public.guard_profile_sensitive_fields()   owner to postgres;
alter function public.recalc_supplier_rating(uuid)       owner to postgres;
alter function public.get_admin_user_ids()               owner to postgres;

revoke all on function public.recalc_supplier_rating(uuid) from public;
revoke all on function public.get_admin_user_ids()         from public;
grant execute on function public.recalc_supplier_rating(uuid) to authenticated;
grant execute on function public.get_admin_user_ids()         to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- (6) reviews table RLS.
--     Previously had no RLS/policies in any migration (effectively open). The
--     reviews table is not defined in this repo; the reviewer/owner column is
--     reviewer_id (confirmed against the live DB — note the app code still uses
--     "buyer_id", which must be reconciled separately; see NOTE 5).
--       • read   : anyone — reviews are shown on the public supplier profile.
--       • insert : a user may create only their OWN review (reviewer_id = auth.uid()).
--       • update : only the author's own rows.
--       • delete : only the author's own rows.
--     recalc_supplier_rating() reads this table as SECURITY DEFINER, so the
--     aggregate recompute is unaffected by these policies.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.reviews enable row level security;

drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all
  on public.reviews
  for select
  to anon, authenticated
  using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own
  on public.reviews
  for insert
  to authenticated
  with check (reviewer_id = auth.uid());

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own
  on public.reviews
  for update
  to authenticated
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own
  on public.reviews
  for delete
  to authenticated
  using (reviewer_id = auth.uid());

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- NOTE 1 — The SECURITY DEFINER view linter item (0010_security_definer_view)
-- ════════════════════════════════════════════════════════════════════════════
-- Supabase's linter flags any definer view regardless of grants. There are two
-- ways to clear it; this migration takes the SECOND:
--   (a) set security_invoker = true  → BREAKS the directory (caller's self/admin
--       RLS makes the view return only their own row). Not viable without a
--       leaky base-table policy. Do NOT do this.
--   (b) keep definer + restrict access + expose only safe columns (this file).
--       This is the documented column-partitioning pattern and matches the
--       project's existing intent. The linter line may remain "informational";
--       it is mitigated, not a real exposure.
--
-- ════════════════════════════════════════════════════════════════════════════
-- NOTE 2 — Companion app refactor (LANDS WITH THIS MIGRATION — already done)
-- ════════════════════════════════════════════════════════════════════════════
-- Base-table reads of OTHER users were repointed at the views so supplier
-- names/profiles keep working for non-admins once RLS is on:
--   • src/lib/profileVisibility.js
--       fetchProfileDirectoryByIds      → from('profile_directory')
--       fetchSupplierPublicProfileById  → from('supplier_public_profiles')
--   • src/pages/SupplierProfile.jsx
--       - main fetch goes through fetchSupplierPublicProfileById (view) ✓
--       - the OWN-profile fallback still reads base profiles for the owner's
--         own row (id = auth.uid()), which the self/admin SELECT policy allows.
--       - the supplemental fetch of port_of_loading / lead_time_* /
--         sample_available was REMOVED: those columns live on public.products
--         (or, for sample_available, do not exist at all) — never on profiles —
--         so that query always errored and was silently swallowed. It returned
--         no data before and returns no data now; removing it just drops a dead
--         base-table read. If supplier-level trade fields are wanted, add the
--         columns to profiles first, then to supplier_public_profiles.
--
-- ════════════════════════════════════════════════════════════════════════════
-- NOTE 3 — Optional, NOT included: a verified-supplier SELECT branch
-- ════════════════════════════════════════════════════════════════════════════
-- If you would rather avoid the app refactor, you could add a row-level branch:
--
--   create policy profiles_select_public_suppliers on public.profiles
--     for select to authenticated
--     using (lower(coalesce(role,''))='supplier'
--            and lower(coalesce(status,'')) in ('verified','approved','active'));
--
-- ⚠ REJECTED here because RLS is row-level, not column-level: this would expose
--   EVERY column of verified suppliers — including the payout_* bank fields —
--   to all authenticated users, directly contradicting finding (4). Only adopt
--   it if payout_* columns are first moved to a separate, locked table.
--
-- ════════════════════════════════════════════════════════════════════════════
-- NOTE 4 — Cross-user write/read paths fixed via SECURITY DEFINER (section 5)
-- ════════════════════════════════════════════════════════════════════════════
-- These three paths break under RLS / the guard trigger and are now routed
-- through definer functions; companion client edits already prepared:
--   • DashboardBuyer.jsx submitReview() — was: buyer UPDATEs supplier
--     profiles.rating/reviews_count (blocked by RLS update policy AND the
--     guard_profile_sensitive_fields trigger). Now: sb.rpc('recalc_supplier_rating',
--     { p_supplier_id }). Values recomputed server-side from public.reviews.
--   • DashboardSupplier.jsx submitManagedMatchOffer() — was: supplier SELECTs
--     admin rows from profiles (returns empty under RLS). Now:
--     sb.rpc('get_admin_user_ids') → [{ id }], same shape the caller maps.
--   • Login.jsx:421 — REVIEWED, NO CHANGE NEEDED. It runs after
--     signInWithPassword with the session active and queries the caller's OWN
--     row (.eq('id', data.user.id)); the self/admin SELECT policy permits it.
--
-- ════════════════════════════════════════════════════════════════════════════
-- NOTE 5 — reviews owner column is reviewer_id; APP CODE STILL USES buyer_id
-- ════════════════════════════════════════════════════════════════════════════
-- Section (6) locks public.reviews on reviewer_id (the real column). The app
-- still references a non-existent buyer_id, so the review feature is currently
-- broken independent of RLS and must be reconciled to reviewer_id:
--   • src/pages/DashboardBuyer.jsx  submitReview() insert  { buyer_id: ... }
--                                   + existing-review SELECT .eq('buyer_id', …)
--   • src/pages/DashboardSupplier.jsx:692
--       attachDirectoryProfiles(sb, data, 'buyer_id', 'profiles')
-- These edits are NOT in this migration's companion commit — fix them so the
-- insert satisfies reviews_insert_own (reviewer_id = auth.uid()) and author
-- names render.
