-- Chat unification (Phase 1, step 2) — let a buyer address a factory in `messages`
-- and let the factory owner read/reply, WITHOUT weakening direct-DM security.
--
-- The direct-message rules require both ends to be real profiles (message_pair_
-- allowed) — enforced by the guard trigger + the RESTRICTIVE/PERMISSIVE policies.
-- A "factory inbound" message (buyer → factory, receiver_id NULL, factory_id set)
-- can never satisfy that, so we add a NARROW exception for exactly that shape:
--   • a buyer may INSERT a message to an EXISTING factory (receiver_id NULL),
--   • the factory OWNER (factory_directory.linked_supplier_id = auth.uid()) may
--     SELECT those rows and UPDATE their read state,
--   • the buyer keeps SELECT on their own sent rows.
-- A factory owner's REPLY has a real receiver (the buyer) and therefore passes the
-- ordinary pair rules unchanged — it only additionally carries factory_id for
-- thread grouping. Direct-DM behaviour is byte-for-byte unchanged.
--
-- All six live definitions (the trigger + 5 policies) are reproduced verbatim from
-- pg_catalog; only the factory branch is appended. Policies are patched with
-- ALTER POLICY (surgical — no drop/recreate window on the hardened table).
begin;

-- Definer helper: does this factory exist (is it a real directory row a buyer can
-- message)? SECURITY DEFINER so the check never trips over factory_directory RLS.
create or replace function public.factory_is_messageable(p_factory_id uuid)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (select 1 from public.factory_directory d where d.id = p_factory_id);
$$;

-- ── Guard trigger: add the factory-inbound branches ─────────────────────────
create or replace function public.guard_message_write()
returns trigger
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if tg_op = 'INSERT' then
    if new.sender_id is distinct from auth.uid() then
      raise exception 'You can only send messages as the authenticated user.';
    end if;

    -- Factory-inbound: buyer → factory, no direct recipient. Allowed without
    -- message_pair_allowed; the factory just has to exist. It waits until the
    -- factory registers (linked_supplier_id) and the owner resolves the thread.
    if new.factory_id is not null and new.receiver_id is null then
      if not public.factory_is_messageable(new.factory_id) then
        raise exception 'Unknown factory.';
      end if;
      if nullif(trim(coalesce(new.content, '')), '') is null then
        raise exception 'Message content cannot be empty.';
      end if;
      new.is_read := false;
      return new;
    end if;

    -- Ordinary account↔account message (incl. a factory owner's reply, which has
    -- a real receiver so the pair check passes).
    if new.sender_id = new.receiver_id then
      raise exception 'You cannot message yourself.';
    end if;

    if nullif(trim(coalesce(new.content, '')), '') is null then
      raise exception 'Message content cannot be empty.';
    end if;

    if not public.message_pair_allowed(new.sender_id, new.receiver_id) then
      raise exception 'Messaging is locked until supplier verification is approved.';
    end if;

    new.is_read := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Factory-inbound row: only the factory owner may touch it, and only read
    -- state (mirrors the receiver-only rule for ordinary messages).
    if old.factory_id is not null and old.receiver_id is null then
      if not public.factory_linked_to_me(old.factory_id) then
        raise exception 'Only the factory owner can update this message.';
      end if;
      if (to_jsonb(new) - 'is_read' - 'updated_at') is distinct from (to_jsonb(old) - 'is_read' - 'updated_at') then
        raise exception 'Only message read state can be updated.';
      end if;
      return new;
    end if;

    if old.receiver_id is distinct from auth.uid()
       or new.receiver_id is distinct from auth.uid() then
      raise exception 'Only the receiver can update message read state.';
    end if;

    if (to_jsonb(new) - 'is_read' - 'updated_at') is distinct from (to_jsonb(old) - 'is_read' - 'updated_at') then
      raise exception 'Only message read state can be updated.';
    end if;

    if not public.message_pair_allowed(old.sender_id, old.receiver_id) then
      raise exception 'Messaging is locked until supplier verification is approved.';
    end if;

    return new;
  end if;

  return new;
end;
$function$;

-- ── SELECT ──────────────────────────────────────────────────────────────────
-- Permissive: sender/receiver, OR the owner of the addressed factory.
alter policy messages_select on public.messages
using (
  (auth.uid() = sender_id)
  or (auth.uid() = receiver_id)
  or (factory_id is not null and public.factory_linked_to_me(factory_id))
);

-- Restrictive: keep the verified-pair gate for direct DMs; add a factory branch
-- (buyer sender, buyer receiver, or factory owner) that does NOT require the pair.
alter policy messages_restrict_verified_pair_select on public.messages
using (
  is_admin_user()
  or (((sender_id = auth.uid()) or (receiver_id = auth.uid())) and message_pair_allowed(sender_id, receiver_id))
  or (factory_id is not null and ((sender_id = auth.uid()) or (receiver_id = auth.uid()) or public.factory_linked_to_me(factory_id)))
);

-- ── INSERT ──────────────────────────────────────────────────────────────────
-- Permissive messages_insert (sender_id = auth.uid()) already covers both a
-- buyer's inbound and an owner's reply, so it is left unchanged.
-- Restrictive: add the factory-inbound shape (sender = me, receiver NULL,
-- existing factory) alongside the verified-pair gate.
alter policy messages_restrict_verified_pair_insert on public.messages
with check (
  is_admin_user()
  or ((sender_id = auth.uid()) and message_pair_allowed(sender_id, receiver_id))
  or ((sender_id = auth.uid()) and factory_id is not null and receiver_id is null and public.factory_is_messageable(factory_id))
);

-- ── UPDATE ──────────────────────────────────────────────────────────────────
-- Permissive: receiver, OR the factory owner marking an inbound row read.
alter policy messages_update on public.messages
using (
  (auth.uid() = receiver_id)
  or (factory_id is not null and receiver_id is null and public.factory_linked_to_me(factory_id))
);

-- Restrictive: verified-pair gate for DMs; factory-owner branch for inbound rows.
alter policy messages_restrict_verified_pair_update on public.messages
using (
  is_admin_user()
  or ((receiver_id = auth.uid()) and message_pair_allowed(sender_id, receiver_id))
  or (factory_id is not null and receiver_id is null and public.factory_linked_to_me(factory_id))
)
with check (
  is_admin_user()
  or ((receiver_id = auth.uid()) and message_pair_allowed(sender_id, receiver_id))
  or (factory_id is not null and receiver_id is null and public.factory_linked_to_me(factory_id))
);

commit;
