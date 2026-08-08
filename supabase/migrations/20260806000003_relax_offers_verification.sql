-- Step 2 of the unified-onboarding change: verification no longer gates OFFERS.
--
-- New model: a supplier can send offers the moment they register; digital
-- verification only drives badge/ranking and (later) payout. Previously two
-- layers blocked unverified suppliers from the offers table:
--   1) guard_offer_write() trigger  — raised "Only verified suppliers can ..."
--   2) three RESTRICTIVE RLS policies carrying is_verified_supplier(auth.uid())
--
-- We remove ONLY the verification term from each. Every other guard stays:
-- ownership (supplier_id = auth.uid()), request_is_offerable(), one-active-offer,
-- pending-start, content-fields-only edits, and the cancel rules. Buyers are
-- untouched.

-- 1) Trigger: drop the two verification checks (INSERT + supplier UPDATE).
create or replace function public.guard_offer_write()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  actor_is_admin boolean := public.is_service_role() or public.is_admin_user();
  actor_is_supplier boolean := exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'supplier'
  );
  actor_is_buyer boolean := exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'buyer'
  );
begin
  if actor_is_admin then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if tg_op = 'INSERT' then
    if new.supplier_id is distinct from auth.uid() then
      raise exception 'Offers can only be created for the authenticated supplier.';
    end if;

    -- (verification requirement removed — any registered supplier may offer)

    if not public.request_is_offerable(new.request_id) then
      raise exception 'This request is not open for offers.';
    end if;

    if exists (
      select 1 from public.offers o
      where o.request_id = new.request_id
        and o.supplier_id = new.supplier_id
        and lower(coalesce(o.status, '')) <> 'cancelled'
    ) then
      raise exception 'An active offer already exists for this request.';
    end if;

    if nullif(trim(coalesce(new.status, '')), '') is not null
       and lower(coalesce(new.status, '')) <> 'pending' then
      raise exception 'New offers must start in pending status.';
    end if;

    new.status := 'pending';
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if actor_is_supplier then
      if old.supplier_id is distinct from auth.uid()
         or new.supplier_id is distinct from auth.uid() then
        raise exception 'You can only update your own offers.';
      end if;

      -- (verification requirement removed)

      if (to_jsonb(new)
            - 'price' - 'shipping_cost' - 'shipping_method' - 'moq'
            - 'delivery_days' - 'origin' - 'note' - 'seen' - 'status' - 'updated_at')
         is distinct from
         (to_jsonb(old)
            - 'price' - 'shipping_cost' - 'shipping_method' - 'moq'
            - 'delivery_days' - 'origin' - 'note' - 'seen' - 'status' - 'updated_at') then
        raise exception 'Suppliers can only edit offer content fields.';
      end if;

      if new.status is distinct from old.status then
        if lower(coalesce(new.status, '')) <> 'cancelled' then
          raise exception 'Suppliers can only cancel offers.';
        end if;

        if lower(coalesce(old.status, '')) not in ('pending', 'accepted') then
          raise exception 'Only pending or accepted offers can be cancelled.';
        end if;

        if exists (
          select 1 from public.requests r
          where r.id = old.request_id
            and lower(coalesce(r.status, '')) in ('paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered')
        ) then
          raise exception 'Offers cannot be cancelled after payment or shipment progression.';
        end if;
      end if;

      return new;
    end if;

    if actor_is_buyer then
      if not exists (
        select 1 from public.requests r
        where r.id = old.request_id and r.buyer_id = auth.uid()
      ) then
        raise exception 'You can only update offers on your own requests.';
      end if;

      if (to_jsonb(new) - 'status' - 'updated_at') is distinct from (to_jsonb(old) - 'status' - 'updated_at') then
        raise exception 'Buyers can only update offer status.';
      end if;

      if lower(coalesce(new.status, '')) not in ('accepted', 'rejected', 'completed') then
        raise exception 'Unsupported offer status update.';
      end if;

      return new;
    end if;

    raise exception 'Offer updates are not allowed for this account.';
  end if;

  return new;
end;
$function$;

-- 2) RLS: recreate the three restrictive policies without is_verified_supplier,
--    keeping every other condition. Names change to reflect the new intent.
drop policy if exists offers_restrict_verified_supplier_insert on public.offers;
create policy offers_restrict_offerable_insert on public.offers
  as restrictive for insert to authenticated
  with check (
    public.is_admin_user()
    or ((supplier_id = auth.uid()) and public.request_is_offerable(request_id))
  );

drop policy if exists offers_restrict_actor_update on public.offers;
create policy offers_restrict_actor_update on public.offers
  as restrictive for update to authenticated
  using (
    public.is_admin_user()
    or (supplier_id = auth.uid())
    or (exists (select 1 from public.requests r where r.id = offers.request_id and r.buyer_id = auth.uid()))
  )
  with check (
    public.is_admin_user()
    or (supplier_id = auth.uid())
    or (exists (select 1 from public.requests r where r.id = offers.request_id and r.buyer_id = auth.uid()))
  );

drop policy if exists offers_restrict_verified_supplier_delete on public.offers;
create policy offers_restrict_supplier_delete on public.offers
  as restrictive for delete to authenticated
  using (
    public.is_admin_user()
    or ((supplier_id = auth.uid()) and (lower(coalesce(status, '')) = 'pending'))
  );
