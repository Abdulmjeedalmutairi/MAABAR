-- Managed offer — the ANONYMIZED factory profile shown to the trader (city, years,
-- rating, certifications, capacity, export markets, photos) WITHOUT the factory's
-- name/contact. Trust comes from Maabar's vetting + escrow, not the factory identity
-- (the named-supplier experience lives in the direct flow). Only managed offers set
-- this; direct/chat invoices leave it null.
begin;

alter table public.order_invoices add column if not exists factory_profile jsonb;

commit;
