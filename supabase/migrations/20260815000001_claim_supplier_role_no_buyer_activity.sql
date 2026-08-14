-- Restrict self-service supplier conversion: an account that has already traded
-- as a BUYER (posted any request) cannot silently flip into a supplier. Genuinely
-- new supplier signups (no buyer activity) still pass with zero friction. The real
-- anti-abuse control stays the verification→payout gate + admin review, not signup.
-- Preserves the rest of claim_supplier_role verbatim (seeding_supplier escape hatch).

create or replace function public.claim_supplier_role()
 returns profiles
 language plpgsql
 security definer
 set search_path to 'public', 'auth'
as $function$
declare
  me public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select * into me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profile not found.';
  end if;

  if lower(coalesce(me.role, '')) not in ('', 'buyer', 'supplier') then
    raise exception 'This account cannot be converted to a supplier.';
  end if;

  -- Account integrity: block conversion once the account has buyer activity.
  if lower(coalesce(me.role, '')) <> 'supplier'
     and exists (select 1 from public.requests where buyer_id = auth.uid()) then
    raise exception 'This account has buyer activity and cannot become a supplier. Register a separate supplier account or contact Maabar.';
  end if;

  perform set_config('maabar.seeding_supplier', auth.uid()::text, true);

  update public.profiles
     set role = 'supplier',
         status = case
                    when status is null or btrim(status) = '' or lower(status) = 'active'
                    then 'registered'
                    else status
                  end
   where id = auth.uid()
   returning * into me;

  return me;
end;
$function$;
