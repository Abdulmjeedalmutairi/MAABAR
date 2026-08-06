-- Supplier self-claim by a thread-independent link (Admin Console phase 5).
-- A factory can be sent its OWN claim link (no buyer conversation required): the
-- Chinese factory opens /claim/<slug>, sees its prepared profile + waiting
-- activity, signs in, and binds to its existing factory_directory row. Mirrors
-- the claim_and_enter_thread security model exactly (first-claimant-wins, steal
-- protection, the txn-local 'maabar.claiming' GUC the ownership guard already
-- honours — so NO trigger change is needed here).
begin;

-- ── 1. A stable, unguessable claim slug per factory ──────────────────────────
alter table public.factory_directory add column if not exists claim_slug text;
update public.factory_directory set claim_slug = public.gen_short_slug() where claim_slug is null;
alter table public.factory_directory alter column claim_slug set default public.gen_short_slug();
alter table public.factory_directory alter column claim_slug set not null;
create unique index if not exists factory_directory_claim_slug_key on public.factory_directory (claim_slug);

-- ── 2. Rich anonymous preview (the slug is the credential) ───────────────────
-- Returns the prepared public profile + COUNTS of waiting activity. Deliberately
-- exposes NO email/phone, NO trader identity, and NO raw message text — only that
-- N messages / N quote requests are waiting (+ the latest RFQ's product & qty,
-- which is content meant for this factory anyway). Full detail unlocks post-auth.
create or replace function public.get_factory_claim_preview(p_slug text)
returns table (
  factory_id uuid, company_name text, company_name_latin text,
  category text, city text, country text, profile_image text, factory_images text[],
  description_ar text, description_en text, description_zh text,
  is_verified boolean, export_markets text, moq_note text,
  product_count bigint, catalog_count bigint, section_count bigint,
  unread_message_count bigint, pending_request_count bigint,
  latest_request_name text, latest_request_qty integer,
  already_claimed boolean, is_owner boolean
) language sql stable security definer set search_path = public as $$
  select
    d.id, d.company_name, d.company_name_latin,
    d.category, d.city, d.country, d.profile_image, d.factory_images,
    d.description_ar, d.description_en, d.description_zh,
    d.is_verified, d.export_markets, d.moq_note,
    (select count(*) from public.factory_products p where p.factory_id = d.id),
    (select count(*) from public.factory_catalog_imports i where i.factory_id = d.id),
    (select count(distinct coalesce(nullif(trim(p.section_en), ''), nullif(trim(p.section_ar), '')))
       from public.factory_products p
      where p.factory_id = d.id
        and (nullif(trim(p.section_en), '') is not null or nullif(trim(p.section_ar), '') is not null)),
    (select count(*) from public.factory_thread_messages m
       join public.factory_threads t on t.id = m.thread_id
      where t.factory_id = d.id and m.sender_role = 'trader' and m.read_by_factory = false),
    (select count(*) from public.request_factory_invites fi
      where fi.factory_id = d.id and fi.status <> 'offer_submitted'),
    (select coalesce(nullif(trim(r.title_en), ''), r.title_ar)
       from public.request_factory_invites fi join public.requests r on r.id = fi.request_id
      where fi.factory_id = d.id order by fi.created_at desc limit 1),
    (select r.quantity
       from public.request_factory_invites fi join public.requests r on r.id = fi.request_id
      where fi.factory_id = d.id order by fi.created_at desc limit 1),
    (d.linked_supplier_id is not null),
    (d.linked_supplier_id is not null and d.linked_supplier_id = auth.uid())
  from public.factory_directory d
  where d.claim_slug = p_slug;
$$;
revoke all on function public.get_factory_claim_preview(text) from public;
grant execute on function public.get_factory_claim_preview(text) to anon, authenticated;

-- ── 3. Claim by slug — binds ownership, returns the latest thread to enter ────
-- First-claimant-wins; no-op if the caller already owns it; refuses a factory
-- owned by someone else. Only ever UPDATEs an existing row — never creates one.
create or replace function public.claim_factory_by_slug(p_slug text)
returns table (factory_id uuid, thread_id uuid)
language plpgsql security definer set search_path = public as $$
declare v_factory uuid; v_linked uuid; v_thread uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select d.id, d.linked_supplier_id into v_factory, v_linked
  from public.factory_directory d where d.claim_slug = p_slug;
  if v_factory is null then raise exception 'Claim link not found.'; end if;

  if v_linked is not null and v_linked <> auth.uid() then
    raise exception 'This factory was already claimed by another account.';
  end if;

  if v_linked is null then
    perform set_config('maabar.claiming', v_factory::text, true);
    update public.factory_directory
       set linked_supplier_id = auth.uid(), updated_at = now()
     where id = v_factory and linked_supplier_id is null;
  end if;

  select t.id into v_thread from public.factory_threads t
   where t.factory_id = v_factory order by t.last_message_at desc nulls last limit 1;

  factory_id := v_factory; thread_id := v_thread; return next;
end; $$;
revoke all on function public.claim_factory_by_slug(text) from public;
grant execute on function public.claim_factory_by_slug(text) to authenticated;

commit;
