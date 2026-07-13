-- Products draft status — let a supplier save an incomplete product and finish
-- it later, without it going live on approval.
--
-- Background: the C-1 visibility model stages a supplier's products at
-- is_active=false before approval, and auto_publish_products_on_supplier_verified
-- flips them to is_active=true when the supplier becomes verified. A DRAFT is
-- different: it may be incomplete (validation was bypassed) and must NEVER
-- auto-publish on approval. This migration adds products.is_draft and teaches the
-- auto-publish trigger to skip drafts, so an unfinished draft stays private until
-- the supplier explicitly finishes and publishes it.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Draft flag (idempotent).
-- ────────────────────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists is_draft boolean not null default false;

comment on column public.products.is_draft
  is 'True while the supplier is still filling in this product (Save as Draft — validation bypassed, fields may be incomplete). Drafts stay is_active=false and are skipped by auto_publish_products_on_supplier_verified so an incomplete draft never goes live on approval. Set to false when the supplier saves the complete product.';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Auto-publish must not publish drafts. Same body as
--    20260429000001 plus the `and coalesce(is_draft,false) = false` guard.
-- ────────────────────────────────────────────────────────────────────────────
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
       and coalesce(is_active, false) = false
       and coalesce(is_draft, false) = false;   -- never auto-publish an unfinished draft
  end if;
  return new;
end;
$$;

comment on function public.auto_publish_products_on_supplier_verified()
  is 'Flips a supplier''s staged products (is_active=false) to active when their profile status transitions into a verified state (verified | active | approved). Skips is_draft=true rows so an incomplete draft never goes live on approval.';

alter function public.auto_publish_products_on_supplier_verified() owner to postgres;

-- Trigger already exists and points at this function; create-or-replace above
-- updates the body in place, so no trigger re-creation is needed.

commit;
