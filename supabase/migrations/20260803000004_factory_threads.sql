-- Trader <-> factory direct conversations, that can EXIST BEFORE the factory has an
-- account (keyed by factory_id, not an auth user) and become visible to the factory
-- the moment it claims (linked_supplier_id = auth.uid()). Kept OFF the hardened
-- `messages` table on purpose (that one requires two verified profiles).
--
-- IDENTITY MASKING (same principle as request briefs): the factory must NOT see the
-- trader's identity. Enforced by NOT giving the factory base-table access — the
-- factory reads/sends ONLY through the SECURITY DEFINER RPCs below, which omit the
-- trader's id. The trader and admin use the base tables.
begin;

create table if not exists public.factory_threads (
  id              uuid primary key default gen_random_uuid(),
  factory_id      uuid not null references public.factory_directory(id) on delete cascade,
  trader_id       uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (factory_id, trader_id)                 -- one thread per (factory, trader)
);
create index if not exists factory_threads_factory_idx on public.factory_threads (factory_id);
create index if not exists factory_threads_trader_idx  on public.factory_threads (trader_id);

create table if not exists public.factory_thread_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.factory_threads(id) on delete cascade,
  sender_role     text not null check (sender_role in ('trader', 'factory', 'admin')),
  sender_id       uuid references public.profiles(id) on delete set null,
  content         text not null check (length(trim(content)) > 0),
  read_by_trader  boolean not null default false,
  read_by_factory boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists ftm_thread_idx on public.factory_thread_messages (thread_id, created_at);

alter table public.factory_threads         enable row level security;
alter table public.factory_thread_messages enable row level security;

-- Is the current user the claimed owner of this factory?
create or replace function public.factory_linked_to_me(p_factory_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.factory_directory d
                 where d.id = p_factory_id and d.linked_supplier_id = auth.uid());
$$;
grant execute on function public.factory_linked_to_me(uuid) to authenticated;

-- ── Base-table RLS: TRADER + ADMIN only (the factory never touches base tables) ──
-- Threads
drop policy if exists ft_trader_admin_select on public.factory_threads;
create policy ft_trader_admin_select on public.factory_threads for select to authenticated
  using (public.is_admin_user() or trader_id = auth.uid());
drop policy if exists ft_trader_insert on public.factory_threads;
create policy ft_trader_insert on public.factory_threads for insert to authenticated
  with check (trader_id = auth.uid());
-- Messages (trader reads own thread + admin; trader sends as 'trader')
drop policy if exists ftm_ta_select on public.factory_thread_messages;
create policy ftm_ta_select on public.factory_thread_messages for select to authenticated
  using (public.is_admin_user() or exists (
    select 1 from public.factory_threads t where t.id = thread_id and t.trader_id = auth.uid()));
drop policy if exists ftm_trader_insert on public.factory_thread_messages;
create policy ftm_trader_insert on public.factory_thread_messages for insert to authenticated
  with check (sender_role = 'trader' and exists (
    select 1 from public.factory_threads t where t.id = thread_id and t.trader_id = auth.uid()));
drop policy if exists ftm_ta_update on public.factory_thread_messages;
create policy ftm_ta_update on public.factory_thread_messages for update to authenticated
  using (public.is_admin_user() or exists (
    select 1 from public.factory_threads t where t.id = thread_id and t.trader_id = auth.uid()));

-- Bump last_message_at on every new message.
create or replace function public.bump_factory_thread() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.factory_threads set last_message_at = now() where id = new.thread_id;
  return new;
end; $$;
drop trigger if exists trg_bump_factory_thread on public.factory_thread_messages;
create trigger trg_bump_factory_thread after insert on public.factory_thread_messages
  for each row execute function public.bump_factory_thread();

-- ── Trader entry point: open (or reuse) a thread with a factory ──
create or replace function public.start_factory_thread(p_factory_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required.'; end if;
  perform 1 from public.factory_directory d where d.id = p_factory_id and d.is_active;
  if not found then raise exception 'Factory not found.'; end if;
  insert into public.factory_threads (factory_id, trader_id)
    values (p_factory_id, auth.uid())
    on conflict (factory_id, trader_id) do update set last_message_at = public.factory_threads.last_message_at
    returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.start_factory_thread(uuid) to authenticated;

-- ── FACTORY side: masked read/send via definer RPCs (trader identity omitted) ──
-- List my factory's threads (I'm the claimed owner). No trader identity exposed.
create or replace function public.get_my_factory_threads()
returns table (thread_id uuid, factory_id uuid, last_message_at timestamptz,
               unread integer, last_preview text)
language sql stable security definer set search_path = public as $$
  select t.id, t.factory_id, t.last_message_at,
         (select count(*)::int from public.factory_thread_messages m
            where m.thread_id = t.id and m.sender_role = 'trader' and not m.read_by_factory),
         (select m2.content from public.factory_thread_messages m2
            where m2.thread_id = t.id order by m2.created_at desc limit 1)
  from public.factory_threads t
  where public.factory_linked_to_me(t.factory_id)
  order by t.last_message_at desc;
$$;
grant execute on function public.get_my_factory_threads() to authenticated;

-- Read one thread's messages as the factory — sender_id / trader identity omitted.
create or replace function public.get_factory_thread_messages(p_thread_id uuid)
returns table (id uuid, sender_role text, content text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.factory_threads t
                 where t.id = p_thread_id and public.factory_linked_to_me(t.factory_id)) then
    raise exception 'Not authorized.';
  end if;
  update public.factory_thread_messages set read_by_factory = true
   where thread_id = p_thread_id and sender_role = 'trader' and not read_by_factory;
  return query
    select m.id, m.sender_role, m.content, m.created_at
    from public.factory_thread_messages m
    where m.thread_id = p_thread_id
    order by m.created_at;   -- sender_id deliberately NOT returned
end; $$;
grant execute on function public.get_factory_thread_messages(uuid) to authenticated;

-- Factory sends a reply.
create or replace function public.send_factory_thread_message(p_thread_id uuid, p_content text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if length(trim(coalesce(p_content, ''))) = 0 then raise exception 'Empty message.'; end if;
  if not exists (select 1 from public.factory_threads t
                 where t.id = p_thread_id and public.factory_linked_to_me(t.factory_id)) then
    raise exception 'Not authorized.';
  end if;
  insert into public.factory_thread_messages (thread_id, sender_role, sender_id, content, read_by_factory)
    values (p_thread_id, 'factory', auth.uid(), trim(p_content), true)
    returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.send_factory_thread_message(uuid, text) to authenticated;

commit;
