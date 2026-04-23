-- Drop Schema A managed request tables.
-- Schema A (managed_requests + managed_request_suppliers) was superseded by
-- Schema B: requests.managed_status column + managed_request_briefs /
-- managed_supplier_matches / managed_shortlisted_offers / managed_shortlist_feedback
-- (introduced in 202604012345_managed_sourcing_mvp.sql).
--
-- Confirmed 0 rows in production before running.
-- CASCADE removes dependent indexes, RLS policies, and the FK from
-- managed_request_suppliers.request_id -> managed_requests(id).

DROP TABLE IF EXISTS public.managed_request_suppliers CASCADE;
DROP TABLE IF EXISTS public.managed_requests CASCADE;
