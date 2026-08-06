-- Step 4 of the unified-onboarding change: the verification checkpoint for PAYOUT.
--
-- New model: verification gates neither registration, offers, nor messaging — it
-- gates only PAYOUT (releasing funds to the supplier). There is, however, no
-- payout / disbursement / withdrawal flow in the system yet: supplier money-out
-- happens off-platform. So this migration adds ONLY the rule, as a ready-to-call
-- scaffold, with:
--   * no trigger,
--   * no call-site,
--   * no change to any existing table, policy, or function.
-- It therefore has zero behavioral effect today. When the payout flow is built,
-- its server-side path calls assert_supplier_payout_eligible(supplier_id) as the
-- single, documented checkpoint — instead of re-deriving the rule inline.

create or replace function public.assert_supplier_payout_eligible(p_supplier uuid)
returns void
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if p_supplier is null then
    raise exception 'Payout target supplier is required.'
      using errcode = 'check_violation';
  end if;

  if not public.is_verified_supplier(p_supplier) then
    raise exception 'Supplier % is not verified — payout is blocked until verification is approved.', p_supplier
      using errcode = 'check_violation';
  end if;
end;
$function$;

alter function public.assert_supplier_payout_eligible(uuid) owner to postgres;

comment on function public.assert_supplier_payout_eligible(uuid) is
  'Payout checkpoint (unified-onboarding step 4). Raises unless the supplier is a '
  'verified supplier. Scaffold only — as of 2026-08-06 it has no trigger and no '
  'call-site. Wire it into the payout/disbursement path when that flow is built.';
