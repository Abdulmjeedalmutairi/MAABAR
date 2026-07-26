-- First-product nudge flag: whether a supplier has dismissed the first-visit
-- "add your first product" prompt, or already acted on it.
--
-- Deliberately SEPARATE from onboarding_completed. That column gates the
-- POST-APPROVAL welcome sequence (isApprovedStage && onboarding_completed != true).
-- Reusing it here would let a registered supplier who dismisses this earlier,
-- distinct prompt permanently suppress the post-approval sequence once verified.
-- Two different lifecycle moments -> two different flags.
begin;

alter table public.profiles
  add column if not exists first_product_prompt_dismissed boolean not null default false;

comment on column public.profiles.first_product_prompt_dismissed is
  'True once the supplier dismissed the first-visit "add your first product" nudge OR saved their first product. Distinct from onboarding_completed (post-approval welcome sequence).';

-- Backfill so it never appears retroactively: a supplier who is already verified,
-- or who already has products, has no need for a first-product invitation.
--
-- Writing profiles directly must assume the service_role claim in-transaction:
-- guard_profile_sensitive_fields() rejects a bare postgres UPDATE (auth.uid() is
-- null, so old.id is "not your own profile") unless service_role/admin. Same
-- sanctioned bypass used by the other operator backfills.
set local request.jwt.claim.role = 'service_role';

update public.profiles p
set first_product_prompt_dismissed = true
where role = 'supplier'
  and coalesce(first_product_prompt_dismissed, false) = false
  and (
    lower(coalesce(status, '')) = 'verified'
    or exists (select 1 from public.products pr where pr.supplier_id = p.id)
  );

commit;
