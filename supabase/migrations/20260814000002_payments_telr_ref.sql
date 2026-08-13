-- Phase 4 (Telr) step 4a — record the Telr order reference on payments + keep the
-- write-lockdown guard's denylist complete.
--
-- Moyasar is being removed; Telr is the sole gateway. Payments now carry a
-- telr_ref (the Telr order ref) for idempotency/replay protection, mirroring the
-- existing moyasar_id. The guard trigger denylist is extended so telr_ref (and
-- moyasar_id, already listed) can never be changed client-side. Guard body is
-- otherwise reproduced from the live definition (20260719000002).
begin;

alter table public.payments add column if not exists telr_ref text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payments_telr_ref_unique') then
    alter table public.payments add constraint payments_telr_ref_unique unique (telr_ref);
  end if;
end $$;

create or replace function public.guard_payments_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_service_role() or public.is_admin_user() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Payments can only be created server-side.';
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Payments can only be deleted server-side.';
  end if;

  if new.status          is distinct from old.status
     or new.amount           is distinct from old.amount
     or new.amount_first     is distinct from old.amount_first
     or new.amount_second    is distinct from old.amount_second
     or new.supplier_amount  is distinct from old.supplier_amount
     or new.maabar_fee       is distinct from old.maabar_fee
     or new.payment_pct      is distinct from old.payment_pct
     or new.moyasar_id       is distinct from old.moyasar_id
     or new.telr_ref         is distinct from old.telr_ref
     or new.buyer_id         is distinct from old.buyer_id
     or new.supplier_id      is distinct from old.supplier_id
     or new.request_id       is distinct from old.request_id then
    raise exception 'Payment fields can only be changed server-side.';
  end if;

  return new;
end;
$$;
alter function public.guard_payments_write() owner to postgres;

commit;
