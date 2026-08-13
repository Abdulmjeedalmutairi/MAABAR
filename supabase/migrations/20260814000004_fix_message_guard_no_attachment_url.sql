-- HOTFIX — the messages table has NO `attachment_url` column, but migration
-- 20260813000009 added `and new.attachment_url is null` to guard_message_write.
-- That makes the trigger reference an undefined column, so EVERY message insert
-- failed with PostgREST error 42703 (undefined_column). This restores the guard to
-- the 20260813000008 version (require non-empty content; no attachment reference).
--
-- Attachments (mobile) rely on an attachment_url column that doesn't exist — a
-- separate pre-existing gap; if attachments are wanted, add the column first, then
-- re-introduce the "empty content allowed when attachment present" exception.
begin;

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

commit;
