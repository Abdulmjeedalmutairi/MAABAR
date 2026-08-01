-- Phase 1D — widen get_factory_invite so the factory portal (/f/<slug>) can show
-- the new customization brief. Adds ONLY identity-safe structured fields:
-- quantity, unit, customization_types, delivery_timeframe, ship_country/city, and
-- attachment_paths (private object paths — the /f page mints signed URLs via the
-- factory-attachment-url edge function; a bare path is not a credential).
--
-- Deliberately NOT exposed: customization_details / additional_notes / the raw
-- request body — those free-text fields can carry buyer identity and are folded
-- into the AI-generated supplier_brief (already stripped), which is still the only
-- narrative returned. Everything else about the invite flow is unchanged.
--
-- RETURNS TABLE output columns changed → must DROP then recreate (create-or-replace
-- cannot alter a function's OUT signature). Re-issues the same least-privilege grants.
begin;

drop function if exists public.get_factory_invite(text);

create function public.get_factory_invite(p_slug text)
returns table (
  slug text,
  status text,
  expired boolean,
  factory_id uuid,
  factory_name text,
  product_name text,
  brief text,
  quantity text,
  unit text,
  customization_types text[],
  delivery_timeframe text,
  ship_country text,
  ship_city text,
  attachment_paths text[],
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.request_factory_invites%rowtype;
begin
  select * into v_invite from public.request_factory_invites i where i.slug = p_slug;
  if not found then return; end if;

  -- First view: sent → opened (never downgrade a later state). The WHERE column is
  -- qualified to disambiguate it from the RETURNS TABLE output param "status".
  if v_invite.status = 'sent' then
    update public.request_factory_invites
      set status = 'opened', opened_at = now()
      where id = v_invite.id and request_factory_invites.status = 'sent';
    v_invite.status := 'opened';
  end if;

  return query
  select
    v_invite.slug,
    v_invite.status,
    (v_invite.expires_at <= now()) as expired,
    v_invite.factory_id,
    (select coalesce(nullif(trim(f.company_name_latin), ''), f.company_name)
       from public.factory_directory f where f.id = v_invite.factory_id),
    (select coalesce(fp.name_en, fp.name_zh, fp.name_ar)
       from public.factory_products fp where fp.id = v_invite.factory_product_id),
    (select b.supplier_brief
       from public.managed_request_briefs b where b.request_id = v_invite.request_id),
    (select r.quantity from public.requests r where r.id = v_invite.request_id),
    (select r.unit     from public.requests r where r.id = v_invite.request_id),
    (select c.customization_types from public.request_customization c where c.request_id = v_invite.request_id),
    (select c.delivery_timeframe  from public.request_customization c where c.request_id = v_invite.request_id),
    (select c.ship_country        from public.request_customization c where c.request_id = v_invite.request_id),
    (select c.ship_city           from public.request_customization c where c.request_id = v_invite.request_id),
    (select c.attachment_paths    from public.request_customization c where c.request_id = v_invite.request_id),
    v_invite.created_at;
end;
$$;

alter function public.get_factory_invite(text) owner to postgres;
revoke all on function public.get_factory_invite(text) from public;
grant execute on function public.get_factory_invite(text) to anon, authenticated;

commit;
