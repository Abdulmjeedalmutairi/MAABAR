-- ============================================================
-- Add profiles.cover_photo_url
--
-- Optional supplier-uploaded cover image rendered behind the
-- avatar on the supplier identity card (web DashboardSupplier
-- + mobile SupplierHomeScreen / SupplierProfileScreen). When
-- NULL the UI falls back to a plain cream background; no
-- factory-image fallback is used here so the supplier has full
-- control over what appears in this slot.
--
-- Storage path convention (public bucket):
--   product-images/<user.id>/cover_<timestamp>.<ext>
--
-- Safety: additive, IF NOT EXISTS — re-runnable.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_photo_url text NULL;

COMMENT ON COLUMN public.profiles.cover_photo_url
  IS 'Optional supplier cover photo URL. NULL = render plain cream fallback on the identity card.';
