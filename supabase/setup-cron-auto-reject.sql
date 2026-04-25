-- ============================================================================
-- Cron schedule for the auto-reject-orders edge function
-- ----------------------------------------------------------------------------
-- Runs every hour at minute 0 and POSTs to the auto-reject-orders function.
-- The function looks for direct purchase orders with
--   status='pending_supplier_confirmation' AND created_at < now() - 24h
-- and flips them to status='supplier_rejected', notifying the buyer.
--
-- ⚠️  This file is NOT inside supabase/migrations/ on purpose.
--    Run it manually in the Supabase SQL editor (Project → SQL → New query)
--    AFTER the edge function has been deployed.
--
-- The edge function is deployed with `--no-verify-jwt` (option a — no shared
-- secret), so the cron call does not need an Authorization header. The function
-- is idempotent: re-running it on the same hour produces zero updates after the
-- first successful run.
-- ============================================================================

-- 1. Enable the extensions (idempotent — safe to re-run).
create extension if not exists pg_cron;
create extension if not exists pg_net;


-- 2. Drop a previous schedule with the same name, if any.
--    (cron.unschedule throws if the job doesn't exist; do_block to swallow.)
do $$
begin
  perform cron.unschedule('auto-reject-direct-orders');
exception when others then
  null;
end $$;


-- 3. Schedule the job. Runs every hour at minute 0.
--    REPLACE the URL below with your project's edge function URL if it differs.
--    The default Maabar URL is https://utzalmszfqfcofywfetv.supabase.co
select cron.schedule(
  'auto-reject-direct-orders',
  '0 * * * *',
  $cron$
  select net.http_post(
    url := 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/auto-reject-orders',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) as request_id;
  $cron$
);


-- 4. (Optional) Inspect scheduled jobs:
--    select jobid, schedule, command, active from cron.job;
--
--    Inspect run history (most recent first):
--    select * from cron.job_run_details order by start_time desc limit 20;
--
--    Trigger an immediate one-off run for testing:
--    select net.http_post(
--      url := 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/auto-reject-orders',
--      headers := jsonb_build_object('Content-Type', 'application/json'),
--      body := '{}'::jsonb
--    );
