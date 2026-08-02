-- Dashboard reorg — distinguish factory quote-requests from generic managed.
--
-- A factory quote-request runs through the managed pipeline (sourcing_mode=
-- 'managed') for admin mediation, but it is a DISTINCT kind: the admin relays it
-- to ONE known factory rather than matching suppliers. We tag it request_kind=
-- 'factory' so both the buyer dashboard and the admin queue can label + handle it
-- correctly. Adds 'factory' to the request_kind CHECK and backfills existing ones
-- (managed requests that already have a factory invite).
begin;

alter table public.requests drop constraint if exists requests_request_kind_check;
alter table public.requests
  add constraint requests_request_kind_check
  check (request_kind is null or request_kind = any (array['direct', 'managed', 'idea_to_product', 'factory']));

update public.requests r
set request_kind = 'factory'
where r.request_kind = 'managed'
  and exists (select 1 from public.request_factory_invites i where i.request_id = r.id);

commit;
