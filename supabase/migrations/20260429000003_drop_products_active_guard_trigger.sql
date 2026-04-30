-- Revert: drop the products is_active guard trigger.
--
-- Migration 20260429000002 added a BEFORE INSERT/UPDATE trigger on
-- public.products that forced is_active=false unless the joined supplier
-- was in a verified state. That guard was the belt-and-suspenders side
-- of the C-1 visibility model, where verification_under_review suppliers
-- could create products in draft.
--
-- The C-1 model has now been pulled back: the products tab is gated
-- entirely until the supplier reaches a verified status, the same as
-- every other operational feature. There is no longer a non-verified
-- write surface that needs guarding, so the trigger is removed.
--
-- The companion auto-publish trigger trg_auto_publish_products_on_supplier_verified
-- (Migration 20260429000001) is intentionally left in place — it's
-- harmless under the new gating rule (no draft products exist for it
-- to flip on a verification transition) and keeps the door open for
-- any future C-1-style staging that may be reintroduced.
--
-- The columns added in Migration 20260429000001 (legal_rep_id_photo,
-- address_proof_photo, onboarding_completed) are also untouched —
-- those serve verification-flow concerns unrelated to the product
-- visibility model.

begin;

drop trigger if exists trg_guard_products_is_active on public.products;
drop function if exists public.guard_products_is_active_for_unverified_supplier();

commit;
