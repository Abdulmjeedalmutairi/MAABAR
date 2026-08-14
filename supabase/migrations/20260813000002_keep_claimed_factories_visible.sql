-- Keep claimed / linked factories VISIBLE to buyers.
--
-- The three claim paths used to deactivate the factory_directory row
-- (is_active=false) right after seeding, on the assumption the company would
-- reappear in the "suppliers" browse. That browse is not live, so deactivating
-- removed the company from the ONLY working browse (the factory catalog).
--
-- Fix: the claim RPCs still bind + seed, but NO LONGER deactivate. A side effect
-- we want: every linked factory now stays is_active=true, so all owners route
-- consistently to the same dashboard (App.js sends active-linked owners to the
-- factory view). De-duplication of the factory-vs-supplier twin is deferred to
-- the unified-browse phase (Phase 5).
--
-- Also reactivates any factory a PRIOR claim already deactivated, so those
-- companies return to the browse immediately.
begin;

create or replace function public.claim_factory_by_slug(p_slug text)
returns table(factory_id uuid, thread_id uuid) language plpgsql security definer set search_path to 'public' as $function$
declare v_factory uuid; v_linked uuid; v_thread uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select d.id, d.linked_supplier_id into v_factory, v_linked from public.factory_directory d where d.claim_slug = p_slug;
  if v_factory is null then raise exception 'Claim link not found.'; end if;
  if v_linked is not null and v_linked <> auth.uid() then raise exception 'This factory was already claimed by another account.'; end if;
  if v_linked is null then
    perform set_config('maabar.claiming', v_factory::text, true);
    update public.factory_directory set linked_supplier_id = auth.uid(), updated_at = now() where id = v_factory and linked_supplier_id is null;
    perform public.seed_supplier_from_factory(v_factory, auth.uid());
    -- (visibility) NO deactivation — factory stays in the buyer browse
  end if;
  select t.id into v_thread from public.factory_threads t where t.factory_id = v_factory order by t.last_message_at desc nulls last limit 1;
  factory_id := v_factory; thread_id := v_thread; return next;
end; $function$;

create or replace function public.claim_and_enter_thread(p_slug text)
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare v_thread uuid; v_factory uuid; v_linked uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select t.id, t.factory_id into v_thread, v_factory from public.factory_threads t where t.share_slug = p_slug;
  if v_thread is null then raise exception 'Conversation link not found.'; end if;
  select linked_supplier_id into v_linked from public.factory_directory where id = v_factory;
  if v_linked is not null and v_linked <> auth.uid() then raise exception 'This factory was already claimed by another account.'; end if;
  if v_linked is null then
    perform set_config('maabar.claiming', v_factory::text, true);
    update public.factory_directory set linked_supplier_id = auth.uid(), updated_at = now() where id = v_factory and linked_supplier_id is null;
    perform public.seed_supplier_from_factory(v_factory, auth.uid());
    -- (visibility) NO deactivation
  end if;
  return v_thread;
end; $function$;

create or replace function public.register_factory_invite(p_slug text)
returns text language plpgsql security definer set search_path to 'public' as $function$
declare v_invite public.request_factory_invites%rowtype; v_linked uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  select * into v_invite from public.request_factory_invites i where i.slug = p_slug;
  if not found then raise exception 'Invite not found.'; end if;
  if v_invite.expires_at <= now() then raise exception 'This link has expired.'; end if;
  update public.request_factory_invites
    set registered_supplier_id = auth.uid(),
        status = case when status = 'offer_submitted' then status else 'registered' end,
        registered_at = coalesce(registered_at, now())
    where id = v_invite.id and (registered_supplier_id is null or registered_supplier_id = auth.uid());
  if not found then raise exception 'This request was already claimed by another account.'; end if;
  select linked_supplier_id into v_linked from public.factory_directory where id = v_invite.factory_id;
  if v_linked is null then
    perform set_config('maabar.claiming', v_invite.factory_id::text, true);
    update public.factory_directory set linked_supplier_id = auth.uid(), updated_at = now() where id = v_invite.factory_id and linked_supplier_id is null;
    perform public.seed_supplier_from_factory(v_invite.factory_id, auth.uid());
    -- (visibility) NO deactivation
  end if;
  return 'registered';
end; $function$;

-- Reactivate factories a prior claim deactivated, so they return to the browse.
update public.factory_directory
   set is_active = true, updated_at = now()
 where linked_supplier_id is not null and is_active = false;

commit;
