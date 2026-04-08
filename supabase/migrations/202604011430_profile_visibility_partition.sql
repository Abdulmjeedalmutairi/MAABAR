drop view if exists public.supplier_public_profiles;
drop view if exists public.profile_directory;

create view public.supplier_public_profiles as
select
  p.id,
  p.company_name,
  p.avatar_url,
  p.status,
  p.rating,
  p.reviews_count,
  p.city,
  p.country,
  p.trade_link,
  p.wechat,
  p.whatsapp,
  p.factory_images,
  p.years_experience,
  p.maabar_supplier_id,
  p.min_order_value,
  p.speciality,
  p.company_website,
  p.company_description,
  p.bio_ar,
  p.bio_en,
  p.bio_zh,
  p.business_type,
  p.year_established,
  p.customization_support,
  p.company_address,
  p.languages,
  p.export_markets,
  p.export_years,
  null::int as deals_completed,
  p.completion_rate,
  (
    select count(*)::int
    from public.products pr
    where pr.supplier_id = p.id
      and coalesce(pr.is_active, false) = true
  ) as product_count
from public.profiles p
where lower(coalesce(p.role, '')) = 'supplier'
  and lower(coalesce(p.status, '')) in ('verified', 'approved', 'active')
  and nullif(trim(coalesce(p.maabar_supplier_id, '')), '') is not null;

alter view public.supplier_public_profiles set (security_invoker = false);

create or replace view public.profile_directory as
select
  p.id,
  p.role,
  p.status,
  p.full_name,
  p.company_name,
  p.avatar_url,
  p.city,
  p.country
from public.profiles p;

alter view public.profile_directory set (security_invoker = false);

revoke all on table public.supplier_public_profiles from public;
revoke all on table public.profile_directory from public;
grant select on table public.supplier_public_profiles to anon, authenticated;
grant select on table public.profile_directory to authenticated;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_row.policyname);
  end loop;
end
$$;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin_user()
);
