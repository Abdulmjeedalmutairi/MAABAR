-- Referral abuse watch — run manually in the Supabase SQL Editor periodically.
-- NOT a migration (lives outside supabase/migrations so it is never auto-applied).
--
-- Surfaces referrers whose code has accumulated a relatively high number of
-- sign-ups (>= 5 of the 10 cap) with ZERO verification progress — the tell-tale
-- pattern of dead-account spam exhausting a real supplier's referral cap. Review
-- these by hand until a proper admin dashboard exists.

select
  r.referrer_id,
  p.company_name                                                       as referrer_company,
  p.maabar_supplier_id                                                 as referrer_code,
  count(*)                                                             as total_signups,
  count(*) filter (where r.referred_verified_at is not null)           as verified,
  count(*) filter (where r.referred_verified_at is null)               as pending_unverified,
  min(r.created_at)                                                    as first_signup,
  max(r.created_at)                                                    as last_signup
from public.referrals r
join public.profiles p on p.id = r.referrer_id
group by r.referrer_id, p.company_name, p.maabar_supplier_id
having count(*) >= 5
   and count(*) filter (where r.referred_verified_at is not null) = 0
order by total_signups desc, last_signup desc;
