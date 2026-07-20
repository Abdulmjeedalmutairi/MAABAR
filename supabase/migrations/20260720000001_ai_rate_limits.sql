-- IP-based rate limiting for the maabar-ai LLM proxy (finding #2/#4).
-- Closes anonymous cost-drain abuse of Groq/Gemini via the public anon key.
begin;

create table if not exists public.ai_rate_limits (
  bucket_key   text        not null,   -- 'ip:<ip>:<task>:<hour|day>'
  window_start timestamptz not null,   -- truncated to the hour/day (UTC)
  count        int         not null default 0,
  primary key (bucket_key, window_start)
);
create index if not exists ai_rate_limits_window_idx
  on public.ai_rate_limits (window_start);   -- for cleanup of old windows

-- No client may read/write counters. service_role (used by the edge) bypasses RLS;
-- with RLS on and zero policies, anon/authenticated are fully denied.
alter table public.ai_rate_limits enable row level security;

-- Atomic increment: bumps (key, window) and returns the NEW count. The edge calls
-- this via service_role, then compares the count to the per-task limit.
create or replace function public.ai_rate_bump(p_key text, p_window timestamptz)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.ai_rate_limits (bucket_key, window_start, count)
  values (p_key, p_window, 1)
  on conflict (bucket_key, window_start)
  do update set count = public.ai_rate_limits.count + 1
  returning count;
$$;
alter function public.ai_rate_bump(text, timestamptz) owner to postgres;
-- Only service_role should invoke it; block direct client RPC calls.
revoke all on function public.ai_rate_bump(text, timestamptz) from public, anon, authenticated;

commit;
