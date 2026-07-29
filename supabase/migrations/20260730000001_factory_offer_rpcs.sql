-- Factories Phase 4 — factory-facing invite RPCs + a scoped offer-guard bypass.
--
-- A factory that received a quote-request email opens /f/<slug>, sees the
-- buyer-stripped brief, registers phone-only (a minimal role='supplier' profile),
-- and submits ONE offer against the invite's request. Three SECURITY DEFINER RPCs
-- drive this without exposing request_factory_invites to the client directly.
--
-- The offer INSERT is double-gated on is_verified_supplier() (RLS + the
-- guard_offer_write trigger). A phone-only factory is not verified, so we add a
-- SINGLE narrowly-scoped, transaction-local GUC bypass to guard_offer_write that
-- relaxes ONLY the verified-supplier check for this invite-bound path. Everything
-- else the guard enforces (supplier_id = auth.uid(), request_is_offerable, the
-- one-active-offer dedupe, status='pending') stays intact. Mirrors the sanctioned
-- pattern in guard_profile_sensitive_fields (maabar.allow_company_name_latin_update).
begin;

-- ── 1) guard_offer_write: add the scoped bypass (reproduced from the live
--        definition; the ONLY change is the new `allow_factory_offer` boolean and
--        its `and not allow_factory_offer` on the INSERT verified-supplier check). ──
create or replace function public.guard_offer_write()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  actor_is_admin boolean := public.is_service_role() or public.is_admin_user();
  actor_is_supplier boolean := exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'supplier'
  );
  actor_is_buyer boolean := exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'buyer'
  );
  -- Transaction-local (SET LOCAL) bypass set only inside submit_factory_offer().
  -- Unset → '' → false, so every existing offer path is byte-for-byte unchanged.
  allow_factory_offer boolean := coalesce(current_setting('maabar.allow_factory_offer', true), '') = 'submit_factory_offer';
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

    -- Verified-supplier requirement, EXCEPT the scoped factory-offer path.
    if not public.is_verified_supplier(auth.uid()) and not allow_factory_offer then
      raise exception 'Only verified suppliers can create offers.';
    end if;

    if not public.request_is_offerable(new.request_id) then
      raise exception 'This request is not open for offers.';
    end if;

    if exists (
      select 1
      from public.offers o
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

      if not public.is_verified_supplier(auth.uid()) then
        raise exception 'Only verified suppliers can update offers.';
      end if;

      if (to_jsonb(new)
            - 'price'
            - 'shipping_cost'
            - 'shipping_method'
            - 'moq'
            - 'delivery_days'
            - 'origin'
            - 'note'
            - 'seen'
            - 'status'
            - 'updated_at')
         is distinct from
         (to_jsonb(old)
            - 'price'
            - 'shipping_cost'
            - 'shipping_method'
            - 'moq'
            - 'delivery_days'
            - 'origin'
            - 'note'
            - 'seen'
            - 'status'
            - 'updated_at') then
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
          select 1
          from public.requests r
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
        select 1
        from public.requests r
        where r.id = old.request_id
          and r.buyer_id = auth.uid()
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

-- ── 2) get_factory_invite(slug) — public; buyer-stripped brief + marks opened ──
-- Returns ONLY factory/product/brief fields — never buyer identity, contact, or
-- budget (supplier_brief is already stripped). Anyone holding the emailed link
-- can view; that's acceptable (no buyer identity, offers go to admin review).
create or replace function public.get_factory_invite(p_slug text)
returns table (
  slug text,
  status text,
  expired boolean,
  factory_id uuid,
  factory_name text,
  product_name text,
  brief text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.request_factory_invites%rowtype;
begin
  select * into v_invite from public.request_factory_invites i where i.slug = p_slug;
  if not found then return; end if;

  -- First view: sent → opened (never downgrade a later state).
  if v_invite.status = 'sent' then
    update public.request_factory_invites
      set status = 'opened', opened_at = now()
      where id = v_invite.id and status = 'sent';
    v_invite.status := 'opened';
  end if;

  return query
  select
    v_invite.slug,
    v_invite.status,
    (v_invite.expires_at <= now()) as expired,
    v_invite.factory_id,
    (select coalesce(nullif(trim(f.company_name_latin), ''), f.company_name)
       from public.factory_directory f where f.id = v_invite.factory_id),
    (select coalesce(fp.name_en, fp.name_zh, fp.name_ar)
       from public.factory_products fp where fp.id = v_invite.factory_product_id),
    (select b.supplier_brief
       from public.managed_request_briefs b where b.request_id = v_invite.request_id),
    v_invite.created_at;
end;
$$;

-- ── 3) register_factory_invite(slug) — link the phone-registered factory ──
-- Called after the factory phone-signs-up (minimal role='supplier' profile).
-- First registrant wins; links the invite + the factory_directory conversion seam.
create or replace function public.register_factory_invite(p_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.request_factory_invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select * into v_invite from public.request_factory_invites i where i.slug = p_slug;
  if not found then raise exception 'Invite not found.'; end if;
  if v_invite.expires_at <= now() then raise exception 'This link has expired.'; end if;

  update public.request_factory_invites
    set registered_supplier_id = auth.uid(),
        status = case when status = 'offer_submitted' then status else 'registered' end,
        registered_at = coalesce(registered_at, now())
    where id = v_invite.id
      and (registered_supplier_id is null or registered_supplier_id = auth.uid());

  if not found then
    -- 0 rows updated → someone else already registered for this invite.
    raise exception 'This request was already claimed by another account.';
  end if;

  update public.factory_directory
    set linked_supplier_id = auth.uid(), updated_at = now()
    where id = v_invite.factory_id and linked_supplier_id is null;

  return 'registered';
end;
$$;

-- ── 4) submit_factory_offer(slug, …) — scoped offer against the invite's request ──
create or replace function public.submit_factory_offer(
  p_slug          text,
  p_price         numeric,
  p_currency      text default 'SAR',
  p_delivery_days int  default null,
  p_moq           text default null,
  p_note          text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite   public.request_factory_invites%rowtype;
  v_offer_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  if p_price is null or p_price <= 0 then raise exception 'A valid price is required.'; end if;

  select * into v_invite from public.request_factory_invites i where i.slug = p_slug;
  if not found then raise exception 'Invite not found.'; end if;
  if v_invite.expires_at <= now() then raise exception 'This link has expired.'; end if;
  if v_invite.registered_supplier_id is distinct from auth.uid() then
    raise exception 'Register for this request before submitting an offer.';
  end if;
  if v_invite.status = 'offer_submitted' then
    raise exception 'An offer has already been submitted for this request.';
  end if;

  -- SET LOCAL (is_local=true): scoped to THIS transaction; auto-reverts on
  -- commit, rollback, or exception. Relaxes ONLY the verified-supplier check.
  perform set_config('maabar.allow_factory_offer', 'submit_factory_offer', true);

  insert into public.offers
    (request_id, supplier_id, price, currency, delivery_days, moq, note, status, managed_visibility)
  values
    (v_invite.request_id, auth.uid(), p_price, coalesce(nullif(trim(p_currency), ''), 'SAR'),
     p_delivery_days, p_moq, p_note, 'pending', 'admin_only')
  returning id into v_offer_id;

  perform set_config('maabar.allow_factory_offer', '', true);

  update public.request_factory_invites
    set status = 'offer_submitted', offer_submitted_at = now()
    where id = v_invite.id;

  return v_offer_id;
end;
$$;

-- ── Grants: definer functions, least-privilege ──
alter function public.get_factory_invite(text)             owner to postgres;
alter function public.register_factory_invite(text)        owner to postgres;
alter function public.submit_factory_offer(text, numeric, text, int, text, text) owner to postgres;

revoke all on function public.get_factory_invite(text)             from public;
revoke all on function public.register_factory_invite(text)        from public;
revoke all on function public.submit_factory_offer(text, numeric, text, int, text, text) from public;

-- get_factory_invite is the public slug-open path (factory has no account yet).
grant execute on function public.get_factory_invite(text) to anon, authenticated;
grant execute on function public.register_factory_invite(text) to authenticated;
grant execute on function public.submit_factory_offer(text, numeric, text, int, text, text) to authenticated;

commit;
