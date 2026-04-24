-- Drop concierge_connections. The admin's "Connected Suppliers" workflow was
-- migrated to public.managed_supplier_matches (see
-- src/pages/admin/AdminConciergeDetail.jsx and
-- supabase/migrations/202604012345_managed_sourcing_mvp.sql) so nothing
-- reads or writes concierge_connections anymore.
--
-- The table was introduced by 20260419000001_admin_dashboard.sql.

drop policy if exists "admin_all_concierge_connections" on public.concierge_connections;
drop policy if exists "supplier_read_own_connections"  on public.concierge_connections;

drop index if exists public.idx_cc_concierge_id;
drop index if exists public.idx_cc_supplier_id;
drop index if exists public.idx_cc_connected_by;
drop index if exists public.idx_cc_status;
drop index if exists public.idx_cc_created_at;

drop table if exists public.concierge_connections;
