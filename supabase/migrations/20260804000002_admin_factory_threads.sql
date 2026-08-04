-- B3 — Admin oversight of every trader<->factory conversation.
--
-- The admin is NOT masked (unlike the factory): it sees the trader's identity, the
-- factory, a last-message preview, how many trader messages the factory hasn't seen
-- yet, and the thread's share_slug (so the admin can copy the /factory-chat/:slug
-- link and hand it to the factory). One aggregated, admin-gated read.
begin;

create or replace function public.admin_list_factory_threads()
returns table (
  thread_id         uuid,
  factory_id        uuid,
  factory_name      text,
  share_slug        text,
  trader_id         uuid,
  trader_name       text,
  trader_company    text,
  trader_phone      text,
  last_message_at   timestamptz,
  created_at        timestamptz,
  last_preview      text,
  last_sender_role  text,
  msg_count         integer,
  unread_by_factory integer
)
language sql stable security definer set search_path = public as $$
  select
    t.id,
    t.factory_id,
    coalesce(nullif(trim(d.company_name_latin), ''), d.company_name),
    t.share_slug,
    t.trader_id,
    p.full_name,
    p.company_name,
    p.phone,
    t.last_message_at,
    t.created_at,
    (select m.content     from public.factory_thread_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    (select m.sender_role from public.factory_thread_messages m where m.thread_id = t.id order by m.created_at desc limit 1),
    (select count(*)::int from public.factory_thread_messages m where m.thread_id = t.id),
    (select count(*)::int from public.factory_thread_messages m
       where m.thread_id = t.id and m.sender_role = 'trader' and not m.read_by_factory)
  from public.factory_threads t
  join public.factory_directory d on d.id = t.factory_id
  left join public.profiles p on p.id = t.trader_id
  where public.is_admin_user()          -- non-admins get zero rows (no leak)
  order by t.last_message_at desc;
$$;
revoke all on function public.admin_list_factory_threads() from public;
grant execute on function public.admin_list_factory_threads() to authenticated;

commit;
