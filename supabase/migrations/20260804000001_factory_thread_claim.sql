-- B0 — Fold the factory "claim" into the thread system.
--
-- The claim is no longer a standalone concept. A factory is onboarded THROUGH a
-- real trader conversation: the admin shares a specific thread's link, the factory
-- opens it, signs up, and in one step (a) binds to its factory_directory row
-- (linked_supplier_id) AND (b) lands inside that exact conversation.
--
-- So: drop factory_claim_invites, give factory_threads its own share_slug, and add
-- two RPCs — an anonymous preview + an authenticated claim-and-enter. Also fixes a
-- real bug: guard_factory_owner_update (migration 05) froze linked_supplier_id for
-- every non-admin caller, so register_factory_claim could never actually set it
-- (the invite flipped to 'claimed' but the factory stayed unlinked). The trigger now
-- permits the one-time null -> claimant transition scoped to the claim RPC.
begin;

-- ── 1. Remove the standalone claim system ────────────────────────────────────
drop function if exists public.get_factory_claim(text);
drop function if exists public.register_factory_claim(text);
drop table if exists public.factory_claim_invites cascade;

-- ── 2. The share slug now lives on the thread ────────────────────────────────
-- gen_short_slug() is volatile, so the backfill UPDATE evaluates it per row →
-- distinct slugs for any existing threads.
alter table public.factory_threads add column if not exists share_slug text;
update public.factory_threads set share_slug = public.gen_short_slug() where share_slug is null;
alter table public.factory_threads alter column share_slug set default public.gen_short_slug();
alter table public.factory_threads alter column share_slug set not null;
create unique index if not exists factory_threads_share_slug_key
  on public.factory_threads (share_slug);

-- ── 3. Anonymous preview of a thread link ────────────────────────────────────
-- Shows the factory's public identity so the opener sees "Talk to {factory}" and
-- whether it's already claimed / already theirs. NO trader identity is exposed.
create or replace function public.get_factory_thread_invite(p_slug text)
returns table (slug text, thread_id uuid, factory_id uuid,
               factory_name text, city text, country text,
               already_claimed boolean, is_owner boolean)
language sql stable security definer set search_path = public as $$
  select t.share_slug, t.id, t.factory_id,
         coalesce(nullif(trim(d.company_name_latin), ''), d.company_name),
         d.city, d.country,
         (d.linked_supplier_id is not null),
         (d.linked_supplier_id is not null and d.linked_supplier_id = auth.uid())
  from public.factory_threads t
  join public.factory_directory d on d.id = t.factory_id
  where t.share_slug = p_slug;
$$;
revoke all on function public.get_factory_thread_invite(text) from public;
grant execute on function public.get_factory_thread_invite(text) to anon, authenticated;

-- ── 4. Claim-and-enter (phone signup happens first, client-side) ─────────────
-- Binds the factory to the caller on first claim (first-claimant-wins), or no-ops
-- if the caller already owns it; refuses a factory claimed by someone else. Returns
-- the thread_id so the client lands directly in that conversation. Only ever
-- UPDATEs an existing factory_directory row — never creates one.
create or replace function public.claim_and_enter_thread(p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_thread uuid; v_factory uuid; v_linked uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;

  select t.id, t.factory_id into v_thread, v_factory
  from public.factory_threads t where t.share_slug = p_slug;
  if v_thread is null then raise exception 'Conversation link not found.'; end if;

  select linked_supplier_id into v_linked from public.factory_directory where id = v_factory;
  if v_linked is not null and v_linked <> auth.uid() then
    raise exception 'This factory was already claimed by another account.';
  end if;

  if v_linked is null then
    -- Signal the guard trigger to allow this one-time first-claim binding.
    perform set_config('maabar.claiming', v_factory::text, true);
    update public.factory_directory
       set linked_supplier_id = auth.uid(), updated_at = now()
     where id = v_factory and linked_supplier_id is null;
  end if;

  return v_thread;
end; $$;
revoke all on function public.claim_and_enter_thread(text) from public;
grant execute on function public.claim_and_enter_thread(text) to authenticated;

-- ── 5. Fix the ownership guard so a first claim can set linked_supplier_id ────
-- Identity/trust columns stay frozen for owner edits. linked_supplier_id is also
-- frozen EXCEPT the one-time null -> claimant transition performed by
-- claim_and_enter_thread (which set the txn-local 'maabar.claiming' flag for this
-- exact factory). An already-linked factory can never be reassigned.
create or replace function public.guard_factory_owner_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin_user() or public.is_service_role() then
    return new;
  end if;

  new.id          := old.id;
  new.email       := old.email;         -- contact used for /f invites — admin-only
  new.is_verified := old.is_verified;   -- trust signal — admin-only
  new.is_featured := old.is_featured;   -- editorial — admin-only
  new.sort_order  := old.sort_order;
  new.created_at  := old.created_at;
  new.updated_at  := now();

  if old.linked_supplier_id is null
     and new.linked_supplier_id = auth.uid()
     and current_setting('maabar.claiming', true) = old.id::text then
    null;                               -- allow the first-claim binding through
  else
    new.linked_supplier_id := old.linked_supplier_id;   -- otherwise frozen
  end if;

  return new;
end; $$;

commit;
