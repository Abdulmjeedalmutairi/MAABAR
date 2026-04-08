create or replace function public.request_jwt_role()
returns text
language sql
stable
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '');
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select public.request_jwt_role() = 'service_role';
$$;

create or replace function public.is_admin_user(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_service_role()
    or exists (
      select 1
      from public.profiles p
      where p.id = coalesce(target_user_id, auth.uid())
        and lower(coalesce(p.role, '')) = 'admin'
    );
$$;

create or replace function public.is_verified_supplier(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = coalesce(target_user_id, auth.uid())
      and lower(coalesce(p.role, '')) = 'supplier'
      and lower(coalesce(p.status, '')) = 'verified'
      and nullif(trim(coalesce(p.maabar_supplier_id, '')), '') is not null
  );
$$;

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
      and lower(coalesce(r.status, '')) = 'open'
  );
$$;

create or replace function public.message_pair_allowed(sender_user_id uuid, receiver_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with participants as (
    select
      p.id,
      lower(coalesce(p.role, '')) as role,
      lower(coalesce(p.status, '')) as status,
      nullif(trim(coalesce(p.maabar_supplier_id, '')), '') as maabar_supplier_id
    from public.profiles p
    where p.id in (sender_user_id, receiver_user_id)
  )
  select count(*) = 2
    and not exists (
      select 1
      from participants p
      where p.role = 'supplier'
        and not (p.status = 'verified' and p.maabar_supplier_id is not null)
    )
  from participants;
$$;

create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  if auth.uid() is distinct from old.id then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.trust_score is distinct from old.trust_score then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  return new;
end;
$$;

create or replace function public.submit_supplier_verification()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_profile public.profiles%rowtype;
  email_is_confirmed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid();

  if not found or lower(coalesce(actor_profile.role, '')) <> 'supplier' then
    raise exception 'Only suppliers can submit verification.';
  end if;

  select coalesce(u.email_confirmed_at, u.confirmed_at) is not null
  into email_is_confirmed
  from auth.users u
  where u.id = auth.uid();

  if not coalesce(email_is_confirmed, false) then
    raise exception 'Email confirmation is required before verification submission.';
  end if;

  if nullif(trim(coalesce(actor_profile.company_name, '')), '') is null
     or nullif(trim(coalesce(actor_profile.country, '')), '') is null
     or nullif(trim(coalesce(actor_profile.city, '')), '') is null
     or nullif(trim(coalesce(actor_profile.trade_link, '')), '') is null
     or nullif(trim(coalesce(actor_profile.reg_number, '')), '') is null
     or actor_profile.years_experience is null
     or nullif(trim(coalesce(actor_profile.license_photo, '')), '') is null
     or nullif(trim(coalesce(actor_profile.factory_photo, '')), '') is null then
    raise exception 'Complete the required company and verification fields before submitting.';
  end if;

  if lower(coalesce(actor_profile.status, '')) = 'verified' then
    return actor_profile;
  end if;

  update public.profiles
  set status = 'verification_under_review'
  where id = auth.uid()
  returning * into actor_profile;

  return actor_profile;
end;
$$;

create or replace function public.guard_offer_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

    if not public.is_verified_supplier(auth.uid()) then
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
$$;

create or replace function public.guard_message_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if tg_op = 'INSERT' then
    if new.sender_id is distinct from auth.uid() then
      raise exception 'You can only send messages as the authenticated user.';
    end if;

    if new.sender_id = new.receiver_id then
      raise exception 'You cannot message yourself.';
    end if;

    if nullif(trim(coalesce(new.content, '')), '') is null then
      raise exception 'Message content cannot be empty.';
    end if;

    if not public.message_pair_allowed(new.sender_id, new.receiver_id) then
      raise exception 'Messaging is locked until supplier verification is approved.';
    end if;

    new.is_read := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.receiver_id is distinct from auth.uid()
       or new.receiver_id is distinct from auth.uid() then
      raise exception 'Only the receiver can update message read state.';
    end if;

    if (to_jsonb(new) - 'is_read' - 'updated_at') is distinct from (to_jsonb(old) - 'is_read' - 'updated_at') then
      raise exception 'Only message read state can be updated.';
    end if;

    if not public.message_pair_allowed(old.sender_id, old.receiver_id) then
      raise exception 'Messaging is locked until supplier verification is approved.';
    end if;

    return new;
  end if;

  return new;
end;
$$;

alter function public.is_admin_user(uuid) owner to postgres;
alter function public.is_verified_supplier(uuid) owner to postgres;
alter function public.request_is_offerable(uuid) owner to postgres;
alter function public.message_pair_allowed(uuid, uuid) owner to postgres;
alter function public.guard_profile_sensitive_fields() owner to postgres;
alter function public.submit_supplier_verification() owner to postgres;
alter function public.guard_offer_write() owner to postgres;
alter function public.guard_message_write() owner to postgres;

revoke all on function public.is_admin_user(uuid) from public;
revoke all on function public.is_verified_supplier(uuid) from public;
revoke all on function public.request_is_offerable(uuid) from public;
revoke all on function public.message_pair_allowed(uuid, uuid) from public;
revoke all on function public.submit_supplier_verification() from public;

grant execute on function public.is_admin_user(uuid) to authenticated;
grant execute on function public.is_verified_supplier(uuid) to authenticated;
grant execute on function public.request_is_offerable(uuid) to authenticated;
grant execute on function public.message_pair_allowed(uuid, uuid) to authenticated;
grant execute on function public.submit_supplier_verification() to authenticated;

drop trigger if exists trg_profiles_guard_sensitive_fields on public.profiles;
create trigger trg_profiles_guard_sensitive_fields
before update on public.profiles
for each row
execute function public.guard_profile_sensitive_fields();

drop trigger if exists trg_offers_guard_write on public.offers;
create trigger trg_offers_guard_write
before insert or update on public.offers
for each row
execute function public.guard_offer_write();

drop trigger if exists trg_messages_guard_write on public.messages;
create trigger trg_messages_guard_write
before insert or update on public.messages
for each row
execute function public.guard_message_write();

drop policy if exists profiles_restrict_self_or_admin_update on public.profiles;
create policy profiles_restrict_self_or_admin_update
on public.profiles
as restrictive
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin_user()
)
with check (
  id = auth.uid()
  or public.is_admin_user()
);

drop policy if exists offers_restrict_verified_supplier_insert on public.offers;
create policy offers_restrict_verified_supplier_insert
on public.offers
as restrictive
for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    supplier_id = auth.uid()
    and public.is_verified_supplier(auth.uid())
    and public.request_is_offerable(request_id)
  )
);

drop policy if exists offers_restrict_actor_update on public.offers;
create policy offers_restrict_actor_update
on public.offers
as restrictive
for update
to authenticated
using (
  public.is_admin_user()
  or (
    supplier_id = auth.uid()
    and public.is_verified_supplier(auth.uid())
  )
  or exists (
    select 1
    from public.requests r
    where r.id = offers.request_id
      and r.buyer_id = auth.uid()
  )
)
with check (
  public.is_admin_user()
  or (
    supplier_id = auth.uid()
    and public.is_verified_supplier(auth.uid())
  )
  or exists (
    select 1
    from public.requests r
    where r.id = offers.request_id
      and r.buyer_id = auth.uid()
  )
);

drop policy if exists offers_restrict_verified_supplier_delete on public.offers;
create policy offers_restrict_verified_supplier_delete
on public.offers
as restrictive
for delete
to authenticated
using (
  public.is_admin_user()
  or (
    supplier_id = auth.uid()
    and public.is_verified_supplier(auth.uid())
    and lower(coalesce(status, '')) = 'pending'
  )
);

drop policy if exists messages_restrict_verified_pair_select on public.messages;
create policy messages_restrict_verified_pair_select
on public.messages
as restrictive
for select
to authenticated
using (
  public.is_admin_user()
  or (
    (sender_id = auth.uid() or receiver_id = auth.uid())
    and public.message_pair_allowed(sender_id, receiver_id)
  )
);

drop policy if exists messages_restrict_verified_pair_insert on public.messages;
create policy messages_restrict_verified_pair_insert
on public.messages
as restrictive
for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    sender_id = auth.uid()
    and public.message_pair_allowed(sender_id, receiver_id)
  )
);

drop policy if exists messages_restrict_verified_pair_update on public.messages;
create policy messages_restrict_verified_pair_update
on public.messages
as restrictive
for update
to authenticated
using (
  public.is_admin_user()
  or (
    receiver_id = auth.uid()
    and public.message_pair_allowed(sender_id, receiver_id)
  )
)
with check (
  public.is_admin_user()
  or (
    receiver_id = auth.uid()
    and public.message_pair_allowed(sender_id, receiver_id)
  )
);