-- Shareable, expiring, revocable links to a supplier profile.
--
-- Need: the owner's partner runs an office in China and verifies suppliers on the
-- ground, so he must see the full profile INCLUDING the verification documents —
-- but he has no Maabar account, and the public /supplier/:id page only serves
-- already-verified suppliers, which is precisely the wrong moment.
--
-- These links expose identity documents (commercial registration, legal rep ID,
-- address proof) to whoever holds the URL, with no login. Every control below
-- exists because of that:
--   * token is 64 hex chars of UUIDv4 randomness — not guessable, not sequential
--   * expires automatically (default 30 days) so a leaked link dies on its own
--   * revocable instantly, before expiry
--   * view_count / last_viewed_at, so unexpected access is visible to the admin
--   * NO file URLs are stored here; the edge function signs them per view with a
--     short TTL, so a copied link body cannot outlive the link itself
--
-- Client writes are impossible: no INSERT/UPDATE/DELETE policy exists. Creation
-- and revocation go through the SECURITY DEFINER RPCs (admin-gated); public reads
-- go through the supplier-share edge function on service_role.
begin;

create table if not exists public.supplier_share_links (
  token          text primary key,
  supplier_id    uuid not null references public.profiles(id) on delete cascade,
  created_by     uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  revoked_at     timestamptz,
  view_count     int not null default 0,
  last_viewed_at timestamptz
);
create index if not exists supplier_share_links_supplier_idx on public.supplier_share_links (supplier_id);
create index if not exists supplier_share_links_expiry_idx   on public.supplier_share_links (expires_at);

alter table public.supplier_share_links enable row level security;

-- Admins can see the links (to list, audit and revoke them). Deliberately no
-- write policies — see the header note.
drop policy if exists supplier_share_links_admin_select on public.supplier_share_links;
create policy supplier_share_links_admin_select
  on public.supplier_share_links
  for select to authenticated
  using (public.is_admin_user());

create or replace function public.create_supplier_share_link(p_supplier_id uuid, p_days int default 30)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_days  int;
begin
  if not public.is_admin_user() then
    raise exception 'Only admins can share a supplier profile.';
  end if;
  if not exists (select 1 from public.profiles where id = p_supplier_id and role = 'supplier') then
    raise exception 'Supplier not found.';
  end if;

  -- Clamp the lifetime: an admin cannot mint an effectively permanent link.
  v_days := greatest(1, least(coalesce(p_days, 30), 90));

  -- gen_random_uuid() is built in (no pgcrypto dependency); two of them give
  -- 64 hex chars / ~244 bits of randomness.
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

  insert into public.supplier_share_links (token, supplier_id, created_by, expires_at)
  values (v_token, p_supplier_id, auth.uid(), now() + make_interval(days => v_days));

  return v_token;
end;
$$;
alter function public.create_supplier_share_link(uuid, int) owner to postgres;

create or replace function public.revoke_supplier_share_link(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Only admins can revoke a share link.';
  end if;
  update public.supplier_share_links
     set revoked_at = now()
   where token = p_token and revoked_at is null;
  return found;
end;
$$;
alter function public.revoke_supplier_share_link(text) owner to postgres;

-- View auditing, called by the supplier-share edge function on service_role.
-- Atomic so concurrent views cannot lose a count.
create or replace function public.touch_supplier_share_link(p_token text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.supplier_share_links
     set view_count = view_count + 1,
         last_viewed_at = now()
   where token = p_token;
$$;
alter function public.touch_supplier_share_link(text) owner to postgres;
revoke all on function public.touch_supplier_share_link(text) from public, anon, authenticated;

revoke all on function public.create_supplier_share_link(uuid, int) from public, anon;
revoke all on function public.revoke_supplier_share_link(text)      from public, anon;
grant execute on function public.create_supplier_share_link(uuid, int) to authenticated;
grant execute on function public.revoke_supplier_share_link(text)      to authenticated;

commit;
