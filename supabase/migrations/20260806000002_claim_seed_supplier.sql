-- Claim-seeding: when a factory is claimed (any of the 3 claim paths), copy its
-- factory_directory profile + factory_products catalog into the LEGACY profiles +
-- products tables, so the owner lands in the standard supplier dashboard already
-- populated. factory_directory/factory_products rows are KEPT (archival); the
-- factory is deactivated (is_active=false) AFTER its seeded products go live, so
-- the company is never absent from both browse surfaces at once.
--
-- Product model differs, so we TRANSFORM (never silently drop):
--   • factory_products.price (free text)      → one product_pricing_tiers row (numeric)
--   • factory_products.specifications_ar/en   → appended to the product description
--   • rows we can't parse (bad/negotiable price, seed error) → factory_seed_issues (for admin review)
--
-- NOTE: the 2 already-claimed factories predate this and are NOT auto-seeded here
-- (they're already linked, so the "first claim" branch won't fire). Backfilling
-- them is a separate, explicit admin step (call seed_supplier_from_factory + set
-- is_active=false for those two) — intentionally not bundled.
begin;

-- ═══ 1. Review log for un-transformable rows ═══════════════════════════════
create table if not exists public.factory_seed_issues (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid,
  account_id uuid,
  factory_product_id uuid,
  issue text not null,           -- 'unparseable_price' | 'seed_error'
  raw_value text,
  created_at timestamptz not null default now()
);
alter table public.factory_seed_issues enable row level security;
drop policy if exists factory_seed_issues_admin_all on public.factory_seed_issues;
create policy factory_seed_issues_admin_all on public.factory_seed_issues
  for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

-- ═══ 2. Guard exception: let the seed set role→'supplier' + initial status ══
-- Scoped one-txn GUC 'maabar.seeding_supplier' = the account id. Mirrors the
-- existing submit_supplier_verification allow-path. maabar_supplier_id, trust_score
-- and rating stay frozen; the ONLY additions are role→'supplier' and the initial
-- status write during a seed.
create or replace function public.guard_profile_sensitive_fields()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  rating_recalc boolean := coalesce(current_setting('app.allow_rating_recalc', true), '') = 'on';
  allow_verification_submission_status_update boolean :=
    current_setting('maabar.allow_profile_status_update', true) = 'submit_supplier_verification';
  allow_company_name_latin_update boolean :=
    current_setting('maabar.allow_company_name_latin_update', true) = 'set_company_name_latin';
  allow_supplier_seed boolean :=
    current_setting('maabar.seeding_supplier', true) = new.id::text;
begin
  if tg_op <> 'UPDATE' then return new; end if;
  if public.is_service_role() or public.is_admin_user() then return new; end if;

  if auth.uid() is distinct from old.id and not rating_recalc
     and not allow_company_name_latin_update and not allow_supplier_seed then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role then
    if not (allow_supplier_seed and lower(coalesce(new.role, '')) = 'supplier') then
      raise exception 'Protected profile fields cannot be updated directly.';
    end if;
  end if;

  if new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or (to_jsonb(new) -> 'trust_score') is distinct from (to_jsonb(old) -> 'trust_score') then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  if new.status is distinct from old.status then
    if allow_supplier_seed then
      null;                                   -- seed sets the initial supplier status
    elsif not allow_verification_submission_status_update
       or lower(coalesce(new.status, '')) <> 'verification_under_review'
       or lower(coalesce(old.status, '')) in ('verification_under_review', 'verified') then
      raise exception 'Protected profile fields cannot be updated directly.';
    end if;
  end if;

  if not rating_recalc
     and (new.rating is distinct from old.rating or new.reviews_count is distinct from old.reviews_count) then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  return new;
end; $function$;

-- ═══ 3. The seed ═══════════════════════════════════════════════════════════
create or replace function public.seed_supplier_from_factory(p_factory uuid, p_account uuid)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare
  fd public.factory_directory%rowtype;
  fp public.factory_products%rowtype;
  v_pid uuid; v_num numeric; v_qty int; v_desc_ar text; v_desc_en text;
begin
  if p_account is null then return; end if;
  select * into fd from public.factory_directory where id = p_factory;
  if fd.id is null then return; end if;

  -- 3a. profile — authoritative role, fill-empty everything else (never overwrite the user's own edits)
  perform set_config('maabar.seeding_supplier', p_account::text, true);
  update public.profiles p set
    role   = 'supplier',
    status = case when lower(coalesce(p.status, '')) in
      ('registered','verification_required','verification_under_review','verified','rejected','inactive','pending')
      then p.status else 'registered' end,
    company_name       = coalesce(nullif(p.company_name, ''), fd.company_name),
    company_name_latin = coalesce(nullif(p.company_name_latin, ''), fd.company_name_latin),
    city               = coalesce(nullif(p.city, ''), fd.city),
    country            = coalesce(nullif(p.country, ''), fd.country),
    company_address    = coalesce(nullif(p.company_address, ''), fd.address),
    phone              = coalesce(nullif(p.phone, ''), fd.phone),
    whatsapp           = coalesce(nullif(p.whatsapp, ''), fd.phone),
    wechat             = coalesce(nullif(p.wechat, ''), fd.wechat),
    company_website    = coalesce(nullif(p.company_website, ''), fd.website),
    year_established   = coalesce(p.year_established, fd.founded_year),
    avatar_url         = coalesce(nullif(p.avatar_url, ''), fd.profile_image),
    export_markets     = case
                           when p.export_markets is not null and array_length(p.export_markets, 1) is not null then p.export_markets
                           when nullif(fd.export_markets, '') is not null then array[fd.export_markets]::text[]
                           else p.export_markets end,
    factory_images     = case
                           when p.factory_images is not null and array_length(p.factory_images, 1) is not null then p.factory_images
                           else fd.factory_images end,
    bio_ar             = coalesce(nullif(p.bio_ar, ''), fd.description_ar),
    bio_en             = coalesce(nullif(p.bio_en, ''), fd.description_en),
    bio_zh             = coalesce(nullif(p.bio_zh, ''), fd.description_zh),
    certifications     = case when p.certifications is not null and p.certifications <> '[]'::jsonb then p.certifications else fd.certifications end,
    business_type      = coalesce(nullif(p.business_type, ''), case when fd.private_label then 'OEM/ODM' end)
    -- NOT seeded (no clean mapping): factory category (profiles has none), moq_note
    -- (profiles.moq is integer, moq_note is free text), is_verified (must be earned).
  where p.id = p_account;

  -- 3b. products — only if this account has none yet (idempotent). Each product is
  -- seeded in its own sub-block so one bad row is logged, not fatal to the rest.
  if not exists (select 1 from public.products where supplier_id = p_account) then
    for fp in select * from public.factory_products where factory_id = p_factory order by sort_order, created_at loop
      begin
        v_desc_ar := nullif(trim(coalesce(fp.description_ar, '') ||
          case when nullif(trim(coalesce(fp.specifications_ar, '')), '') is not null then chr(10) || chr(10) || fp.specifications_ar else '' end), '');
        v_desc_en := nullif(trim(coalesce(fp.description_en, '') ||
          case when nullif(trim(coalesce(fp.specifications_en, '')), '') is not null then chr(10) || chr(10) || fp.specifications_en else '' end), '');

        begin v_qty := nullif(regexp_replace(coalesce(fp.moq, ''), '[^0-9]', '', 'g'), '')::int;
        exception when others then v_qty := null; end;

        insert into public.products
          (supplier_id, name_ar, name_en, name_zh, category, image_url, gallery_images,
           desc_ar, desc_en, moq, currency,
           is_active, is_draft, has_variants, incoterms, lead_time_negotiable, oem_available, odm_available, created_at)
        values
          (p_account, fp.name_ar, fp.name_en, fp.name_zh, fd.category, fp.image, coalesce(fp.gallery_images, '{}'::text[]),
           v_desc_ar, v_desc_en, v_qty, nullif(fp.currency, ''),
           true, false, false, '{}'::text[], true, fd.private_label, fd.private_label, now())
        returning id into v_pid;

        -- price (free text) → one product-level pricing tier; flag non-empty-but-unparseable
        begin v_num := nullif(regexp_replace(coalesce(fp.price, ''), '[^0-9.]', '', 'g'), '')::numeric;
        exception when others then v_num := null; end;

        if v_num is not null and v_num > 0 then
          insert into public.product_pricing_tiers (product_id, qty_from, qty_to, unit_price)
          values (v_pid, greatest(coalesce(v_qty, 1), 1), null, v_num);
        elsif nullif(trim(coalesce(fp.price, '')), '') is not null then
          insert into public.factory_seed_issues (factory_id, account_id, factory_product_id, issue, raw_value)
          values (p_factory, p_account, fp.id, 'unparseable_price', fp.price);
        end if;
        -- empty price = "on request" → no tier, no issue (expected)
      exception when others then
        insert into public.factory_seed_issues (factory_id, account_id, factory_product_id, issue, raw_value)
        values (p_factory, p_account, fp.id, 'seed_error', left(sqlerrm, 300));
      end;
    end loop;
  end if;
end; $function$;

-- ═══ 4. Hook seed + factory-deactivation into the three claim paths ═════════
-- Order per decision: bind ownership → seed (products go is_active=true) → deactivate factory.

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
    update public.factory_directory set is_active = false, updated_at = now() where id = v_factory;
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
    update public.factory_directory set is_active = false, updated_at = now() where id = v_factory;
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
    update public.factory_directory set is_active = false, updated_at = now() where id = v_invite.factory_id;
  end if;
  return 'registered';
end; $function$;

-- ═══ 5. One-time backfill: seed + deactivate factories already claimed before now ══
-- (Idempotent: the seed fills empty profile fields only and inserts products only
--  when the account has none, so re-running is safe.)
do $backfill$
declare r record;
begin
  for r in
    select id, linked_supplier_id from public.factory_directory
    where linked_supplier_id is not null and is_active = true
  loop
    perform public.seed_supplier_from_factory(r.id, r.linked_supplier_id);
    update public.factory_directory set is_active = false, updated_at = now() where id = r.id;
  end loop;
end $backfill$;

commit;
