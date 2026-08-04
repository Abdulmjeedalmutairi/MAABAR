-- Factory CLAIM invites — a general "claim your factory profile" flow, distinct
-- from the per-request /f invite (request_factory_invites). One slug per factory
-- lets a manually-onboarded factory sign up (phone auth, same path as the /f
-- portal) and bind to its existing factory_directory row via linked_supplier_id.
begin;

create table if not exists public.factory_claim_invites (
  id                     uuid primary key default gen_random_uuid(),
  factory_id             uuid not null references public.factory_directory(id) on delete cascade,
  slug                   text not null unique default public.gen_short_slug(),
  status                 text not null default 'sent' check (status in ('sent', 'opened', 'claimed')),
  registered_supplier_id uuid references public.profiles(id) on delete set null,
  opened_at              timestamptz,
  claimed_at             timestamptz,
  expires_at             timestamptz not null default (now() + interval '60 days'),
  created_by             uuid references public.profiles(id) on delete set null,
  created_at             timestamptz not null default now()
);
-- At most one un-claimed invite per factory (re-issue = a new row after expiry).
create unique index if not exists factory_claim_invites_one_open
  on public.factory_claim_invites (factory_id) where status <> 'claimed';

alter table public.factory_claim_invites enable row level security;
-- Admin-managed only; the factory reads/claims via the SECURITY DEFINER RPCs below.
drop policy if exists factory_claim_invites_admin_all on public.factory_claim_invites;
create policy factory_claim_invites_admin_all on public.factory_claim_invites
  for all to authenticated using (public.is_admin_user()) with check (public.is_admin_user());

-- get_factory_claim(slug): ANONYMOUS read — shows the factory's public identity so the
-- claimer sees "Claim {factory name}". Flips sent -> opened. No trader/buyer data at all.
create or replace function public.get_factory_claim(p_slug text)
returns table (slug text, status text, expired boolean, factory_id uuid,
               factory_name text, city text, country text, already_claimed boolean)
language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select ci.id, ci.slug, ci.status, ci.expires_at, ci.factory_id,
         d.company_name, d.company_name_latin, d.city as d_city, d.country as d_country,
         d.linked_supplier_id
    into v
  from public.factory_claim_invites ci
  join public.factory_directory d on d.id = ci.factory_id
  where ci.slug = p_slug;
  if not found then return; end if;

  if v.status = 'sent' then
    update public.factory_claim_invites set status = 'opened', opened_at = now() where id = v.id;
  end if;

  return query select
    v.slug,
    (case when v.status = 'sent' then 'opened' else v.status end),
    (v.expires_at <= now()),
    v.factory_id,
    coalesce(nullif(trim(v.company_name_latin), ''), v.company_name),
    v.d_city, v.d_country,
    (v.linked_supplier_id is not null);
end; $$;
revoke all on function public.get_factory_claim(text) from public;
grant execute on function public.get_factory_claim(text) to anon, authenticated;

-- register_factory_claim(slug): AUTH required (phone signup happens first, client-side).
-- Binds the factory to the caller. First-claimant-wins; refuses a factory already linked
-- to a different account. Only UPDATEs an existing factory_directory row (never creates).
create or replace function public.register_factory_claim(p_slug text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ci public.factory_claim_invites%rowtype; v_linked uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select * into v_ci from public.factory_claim_invites where slug = p_slug;
  if not found then raise exception 'Claim link not found.'; end if;
  if v_ci.expires_at <= now() then raise exception 'This link has expired.'; end if;

  select linked_supplier_id into v_linked from public.factory_directory where id = v_ci.factory_id;
  if v_linked is not null and v_linked <> auth.uid() then
    raise exception 'This factory was already claimed by another account.';
  end if;

  update public.factory_directory
     set linked_supplier_id = auth.uid(), updated_at = now()
   where id = v_ci.factory_id and (linked_supplier_id is null or linked_supplier_id = auth.uid());

  update public.factory_claim_invites
     set registered_supplier_id = auth.uid(), status = 'claimed',
         claimed_at = coalesce(claimed_at, now())
   where id = v_ci.id and (registered_supplier_id is null or registered_supplier_id = auth.uid());

  return 'claimed';
end; $$;
revoke all on function public.register_factory_claim(text) from public;
grant execute on function public.register_factory_claim(text) to authenticated;

commit;
