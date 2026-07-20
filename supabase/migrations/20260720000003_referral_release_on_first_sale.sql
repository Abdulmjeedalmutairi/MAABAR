-- Referral rewards: implement "…يتحوّل لك مع أول عملية بيع" (transfers on your first sale).
--
-- The program was always designed in two stages, matching the supplier-facing copy:
--   EARN      -> reward row created when the referred supplier gets verified and the
--                referrer has published a product (20260713000001). Written as 'pending'.
--   TRANSFER  -> the reward becomes withdrawable on the referrer's FIRST SALE.
-- Only the first stage was ever implemented. Nothing in the codebase writes
-- 'withdrawable', so every reward ever earned is stuck at 'pending' forever and no
-- supplier can be paid. The wallet UI already renders both states
-- (DashboardSupplier.jsx: 'قابل للسحب' vs 'قيد التفعيل') — it just never sees the first.
--
-- "A sale" = a payments row for that supplier in a real paid state. payments is now
-- server-only (guard_payments_write, 20260719000002), so this signal is trustworthy.
-- Note: payments are platform-disabled today, so this lies dormant until they go live —
-- which is exactly when it must already be in place.
begin;

-- Has this supplier ever actually sold anything?
create or replace function public.supplier_has_sale(p_supplier_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.payments
     where supplier_id = p_supplier_id
       and lower(coalesce(status, '')) in ('first_paid', 'second_paid', 'completed')
  );
$$;
alter function public.supplier_has_sale(uuid) owner to postgres;

-- Flip a referrer's earned-but-pending rewards to withdrawable, and tell them once.
-- Idempotent: after the first run there are no 'pending' rows left to move.
create or replace function public.release_referral_rewards_on_sale(p_supplier_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count  int := 0;
  v_amount numeric := 0;
begin
  if p_supplier_id is null then return 0; end if;

  with released as (
    update public.referral_rewards
       set state = 'withdrawable'
     where referrer_id = p_supplier_id
       and state = 'pending'
    returning amount
  )
  select count(*), coalesce(sum(amount), 0) into v_count, v_amount from released;

  if v_count > 0 then
    insert into public.notifications (user_id, type, title_ar, title_en, title_zh, ref_id, is_read)
    values (
      p_supplier_id,
      'referral_reward',
      'تهانينا! تحوّلت مكافأة الإحالة ' || v_amount || '$ — صارت قابلة للسحب بعد أول عملية بيع',
      'Congratulations! Your $' || v_amount || ' referral reward is now withdrawable after your first sale',
      '恭喜！首笔成交后，您的 $' || v_amount || ' 推荐奖励现已可提现',
      null,
      false
    );
  end if;

  return v_count;
end;
$$;
alter function public.release_referral_rewards_on_sale(uuid) owner to postgres;

-- (1) The first sale releases everything already earned.
create or replace function public.trg_payments_release_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.supplier_id is not null
     and lower(coalesce(new.status, '')) in ('first_paid', 'second_paid', 'completed')
     and (tg_op = 'INSERT' or lower(coalesce(old.status, '')) is distinct from lower(coalesce(new.status, '')))
  then
    perform public.release_referral_rewards_on_sale(new.supplier_id);
  end if;
  return null;
end;
$$;
alter function public.trg_payments_release_referral() owner to postgres;

drop trigger if exists trg_payments_release_referral on public.payments;
create trigger trg_payments_release_referral
after insert or update of status on public.payments
for each row execute function public.trg_payments_release_referral();

-- (2) A reward earned AFTER the referrer already sells is withdrawable immediately —
--     otherwise it would wait for a *second* sale, which the copy never promised.
--     Additive: leaves the existing award triggers (20260713000001) untouched.
create or replace function public.trg_referral_reward_autorelease()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.state = 'pending' and public.supplier_has_sale(new.referrer_id) then
    update public.referral_rewards set state = 'withdrawable' where id = new.id;
  end if;
  return null;
end;
$$;
alter function public.trg_referral_reward_autorelease() owner to postgres;

drop trigger if exists trg_referral_reward_autorelease on public.referral_rewards;
create trigger trg_referral_reward_autorelease
after insert on public.referral_rewards
for each row execute function public.trg_referral_reward_autorelease();

-- (3) Backfill: any existing pending reward whose referrer has already sold.
--     Expected to affect 0 rows today (payments are disabled), but keeps the
--     invariant true from the moment this lands.
update public.referral_rewards r
   set state = 'withdrawable'
 where r.state = 'pending'
   and public.supplier_has_sale(r.referrer_id);

commit;
