-- Multi-supplier competition on a request.
--
-- Problem: request_is_offerable() (supplier_lockdown_hotfix) returned true ONLY
-- for status = 'open'. The first offer flips a request to 'offers_received', so
-- every *subsequent* supplier was blocked from bidding with "This request is not
-- open for offers." — even though the request is still open for competition and
-- the buyer hasn't accepted anyone yet.
--
-- This contradicted the visibility layer, which has always shown suppliers BOTH
-- 'open' and 'offers_received' requests (see requests_verified_visibility_simple,
-- requests_offer_holder_visibility, relax_requests_visibility). Suppliers could
-- SEE an offers_received request but not bid on it — a latent bug, not a policy.
--
-- Fix: a request is offerable while it is still collecting offers, i.e. status in
-- ('open','offers_received'). Once the buyer accepts, acceptOffer sets the request
-- to 'closed' (DashboardBuyer.jsx), which correctly drops out of this set — no
-- further offers after acceptance.
--
-- Unchanged and still enforced by guard_offer_write():
--   * one active (non-cancelled) offer per supplier per request (no double-bids),
--   * new offers must start in 'pending',
--   * a supplier may only write their own offer.
--
-- Both the INSERT row-guard trigger and the offers INSERT RLS policy call this
-- one function, so replacing it fixes both paths at once.
--
-- Idempotent (create or replace); no data migration.

create or replace function public.request_is_offerable(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requests r
    where r.id = target_request_id
      and lower(coalesce(r.status, '')) in ('open', 'offers_received')
  );
$$;

alter function public.request_is_offerable(uuid) owner to postgres;
revoke all on function public.request_is_offerable(uuid) from public;
grant execute on function public.request_is_offerable(uuid) to authenticated;
