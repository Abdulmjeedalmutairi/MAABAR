-- FIX (critical) — request_jwt_role() read the DEPRECATED PostgREST GUC
-- `request.jwt.claim.role`, which current PostgREST/Supabase no longer sets (it
-- now exposes the whole claims object under `request.jwt.claims`). So the function
-- always returned '' → is_service_role() was ALWAYS false → guard_payments_write
-- rejected EVERY server-side payments insert ("Payments can only be created
-- server-side."), i.e. Telr/telr-verify could never record a payment.
--
-- Read the modern JSON claims first, fall back to the legacy GUC for safety. This
-- also repairs is_service_role() everywhere else it is relied on.
begin;

create or replace function public.request_jwt_role()
returns text
language sql
stable
as $function$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    nullif(current_setting('request.jwt.claim.role', true), ''),
    ''
  );
$function$;

commit;
