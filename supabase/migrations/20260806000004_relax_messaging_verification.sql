-- Step 3 of the unified-onboarding change: verification no longer gates MESSAGING.
--
-- A supplier can chat with buyers/traders the moment they register. Verification
-- now only drives badge/ranking and (later) payout — and the trader sees a small
-- "verification pending" indicator on the counterpart (added client-side, web +
-- mobile), so the relaxation stays transparent rather than silent.
--
-- Messaging was gated in one shared predicate, message_pair_allowed(), used by
-- three RLS policies on `messages` and by the guard_message_write() trigger. We
-- relax ONLY that predicate: it previously required every supplier in the pair to
-- be verified; now it only requires both participants to be real, distinct users.
-- Every other guard (sender = auth.uid, no self-message, non-empty content,
-- receiver-only read-state updates) lives in guard_message_write and is untouched.
--
-- Note: the policy names (messages_restrict_verified_pair_*) and the trigger's
-- "locked until verification" error text are now historical — kept as-is to avoid
-- a churny rename; the predicate they call no longer enforces verification.

create or replace function public.message_pair_allowed(sender_user_id uuid, receiver_user_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  -- Both users must exist and be distinct. (Self-messaging is additionally blocked
  -- in guard_message_write.) Supplier verification is no longer required.
  with participants as (
    select p.id
    from public.profiles p
    where p.id in (sender_user_id, receiver_user_id)
  )
  select count(*) = 2 from participants;
$function$;
