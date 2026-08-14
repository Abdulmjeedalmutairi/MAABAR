-- C4 — Owner-facing list of PENDING quote-request invites for the factories a
-- supplier owns (linked_supplier_id = auth.uid()). Lets the dashboard show "you
-- have a quote request waiting" to a factory that linked via email/phone match or
-- a code (i.e. never clicked the /f/<slug> RFQ link), so the request that brought
-- them in is never lost.
--
-- Buyer identity is NOT exposed (mirrors get_factory_invite's stripped brief):
-- only the request title + quantity + the slug needed to open the response page.
begin;

create or replace function public.get_my_factory_invites()
returns table (
  slug text,
  request_id uuid,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  factory_id uuid,
  factory_product_id uuid,
  title_ar text,
  title_en text,
  quantity text            -- requests.quantity is a text column; keep it as-is
)
language sql stable security definer set search_path to 'public' as $function$
  select i.slug, i.request_id, i.status, i.created_at, i.expires_at,
         i.factory_id, i.factory_product_id,
         r.title_ar, r.title_en, r.quantity::text
  from public.request_factory_invites i
  join public.factory_directory d
    on d.id = i.factory_id and d.linked_supplier_id = auth.uid()
  join public.requests r on r.id = i.request_id
  where i.status in ('sent', 'opened', 'registered')   -- not yet answered
    and i.expires_at > now()
  order by i.created_at desc;
$function$;

grant execute on function public.get_my_factory_invites() to authenticated;

commit;
