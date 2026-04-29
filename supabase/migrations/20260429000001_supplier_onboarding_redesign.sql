-- Supplier onboarding redesign — phase 1 schema additions
--
-- 1. legal_rep_id_photo, address_proof_photo
--    Storage paths for the two new verification documents added to Step 2 of
--    the supplier verification form (legal representative ID, factory/office
--    address proof).
--
-- 2. onboarding_completed
--    Boolean flag that drives the post-approval onboarding sequence (welcome
--    -> profile -> bank -> ready). Default false; flipped to true when the
--    supplier dismisses the sequence on the final step.
--
-- 3. auto_publish_products_on_supplier_verified trigger
--    When an admin transitions a supplier into a verified status
--    ('verified' / 'active' / 'approved'), every one of that supplier's
--    currently-draft products (is_active=false) flips to is_active=true.
--    This honors the C-1 visibility model: pre-approval suppliers can stage
--    products in draft, and the products only become buyer-visible at
--    approval time.

begin;

-- 1 + 2: profile columns
alter table public.profiles
  add column if not exists legal_rep_id_photo   text,
  add column if not exists address_proof_photo  text,
  add column if not exists onboarding_completed boolean not null default false;

comment on column public.profiles.legal_rep_id_photo
  is 'Storage path of the legal-representative ID photo (verification document).';
comment on column public.profiles.address_proof_photo
  is 'Storage path of the factory / office address proof (verification document).';
comment on column public.profiles.onboarding_completed
  is 'True once the supplier finishes the post-approval onboarding sequence (welcome -> profile -> bank -> ready).';

-- 3: auto-publish trigger
create or replace function public.auto_publish_products_on_supplier_verified()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_is_verified boolean := lower(coalesce(new.status, '')) in ('verified', 'active', 'approved');
  old_is_verified boolean := lower(coalesce(old.status, '')) in ('verified', 'active', 'approved');
begin
  if new.role = 'supplier' and new_is_verified and not old_is_verified then
    update public.products
       set is_active = true
     where supplier_id = new.id
       and coalesce(is_active, false) = false;
  end if;
  return new;
end;
$$;

comment on function public.auto_publish_products_on_supplier_verified()
  is 'Flips a supplier''s draft products (is_active=false) to active when their profile status transitions into a verified state (verified | active | approved). Honors the C-1 visibility model: pre-approval suppliers stage products in draft, products go live at approval.';

alter function public.auto_publish_products_on_supplier_verified() owner to postgres;

drop trigger if exists trg_auto_publish_products_on_supplier_verified on public.profiles;
create trigger trg_auto_publish_products_on_supplier_verified
  after update of status on public.profiles
  for each row
  when (new.status is distinct from old.status)
  execute function public.auto_publish_products_on_supplier_verified();

commit;
