-- C8b — Enforce managed_visibility at the offers SELECT RLS level (belt behind
-- the client filters shipped in C8).
--
-- Managed (factory) offers are submitted with managed_visibility = 'admin_only'
-- so the buyer never sees the raw supplier offer — only the admin-curated one.
-- Until now nothing enforced that server-side: the buyer branch of offers_select
-- returned EVERY offer on the buyer's request, and only a `.or(...)` filter on
-- each client query kept admin_only rows hidden. A query that forgets the filter
-- would leak them. This adds the guard to the SELECT policy itself so the buyer
-- can only ever read offers that are buyer_visible or unmarked (null).
--
-- The other two branches are unchanged: the supplier always sees their own offer
-- (needed to manage it), and admins see everything (they curate managed offers).
--
-- Rebuilt from the LIVE offers_select definition (pg_policies), NOT an old
-- migration file — the buyer EXISTS(...) subquery and the inline admin check are
-- byte-for-byte the live policy; only the buyer branch gains the AND guard.
begin;

drop policy if exists offers_select on public.offers;

create policy offers_select
on public.offers
for select
to public
using (
  (auth.uid() = supplier_id)
  or (
    (exists (
      select 1
      from requests
      where ((requests.id = offers.request_id) and (requests.buyer_id = auth.uid()))
    ))
    -- C8b: hide managed (admin_only) offers from the buyer. Mirrors the client
    -- filter `.or('managed_visibility.eq.buyer_visible,managed_visibility.is.null')`.
    and (managed_visibility is null or managed_visibility = 'buyer_visible')
  )
  or (exists (
    select 1
    from profiles
    where ((profiles.id = auth.uid()) and (profiles.role = 'admin'::text))
  ))
);

commit;
