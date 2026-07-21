-- Admin email segments: the ready-made recipient lists behind the admin Emails screen.
--
-- Exists as an RPC because the defining signal for two of the four segments —
-- whether a user ever confirmed their email — lives in auth.users, which is not
-- exposed through PostgREST and cannot be read by the admin client at all.
--
-- Why not mirror email_confirmed_at onto profiles: a copy needs a trigger on
-- auth.users to stay true, and a stale copy means mailing people the wrong thing.
-- Reading the source at query time cannot drift.
--
-- Signal choice per segment (deliberate, not incidental):
--   · supplier_no_docs keys off the DOCUMENT COLUMNS, not profiles.status. status
--     has no trigger keeping it current — a supplier is promoted out of
--     'registered' by client code on their next sign-in, so someone who confirmed
--     their email and never came back still reads 'registered' forever. The
--     document columns are written by the actual upload, so they cannot lie.
--   · supplier_pending_review keys off status, which IS reliable here: it is set
--     server-side by submit_supplier_verification().
--   · trader_no_requests is "zero requests ever", by product decision — not "since
--     verifying", which would need a confirmation timestamp we chose not to depend on.
--
-- The membership predicate lives in ONE place (admin_email_segment_ids) so the list
-- and the counts can never disagree, and so counts are never silently capped by the
-- list's page size.
begin;

-- Internal. Not granted to anyone: it is reached only from the two gated wrappers
-- below, which run as the owner. Returns every match, unlimited, so counts are true.
create or replace function public.admin_email_segment_ids(p_segment text)
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.id
  where case p_segment

    -- 1. Registered, never confirmed their email. Either role.
    when 'unverified_email' then
      coalesce(u.email_confirmed_at, u.confirmed_at) is null
      and lower(coalesce(p.role, '')) in ('buyer', 'trader', 'supplier')

    -- 2. Supplier, email confirmed, verification documents still missing.
    when 'supplier_no_docs' then
      lower(coalesce(p.role, '')) = 'supplier'
      and coalesce(u.email_confirmed_at, u.confirmed_at) is not null
      and lower(coalesce(p.status, '')) not in ('verified', 'active', 'approved', 'rejected', 'inactive')
      and (nullif(btrim(coalesce(p.license_photo, '')), '') is null
           or nullif(btrim(coalesce(p.factory_photo, '')), '') is null)

    -- 3. Supplier, documents submitted, sitting in the review queue.
    when 'supplier_pending_review' then
      lower(coalesce(p.role, '')) = 'supplier'
      and lower(coalesce(p.status, '')) in
          ('verification_under_review', 'pending', 'under_review', 'submitted', 'review')

    -- 4. Trader, email confirmed, has never created a request.
    when 'trader_no_requests' then
      lower(coalesce(p.role, '')) in ('buyer', 'trader')
      and coalesce(u.email_confirmed_at, u.confirmed_at) is not null
      and not exists (select 1 from public.requests r where r.buyer_id = p.id)

    -- Manual search: everyone, for the recipient who fits no segment.
    when 'all' then true

    else false
  end;
$$;
alter function public.admin_email_segment_ids(text) owner to postgres;

create or replace function public.admin_email_segment(
  p_segment text,
  p_search  text default null,
  p_limit   int  default 200
)
returns table (
  id              uuid,
  email           text,
  full_name       text,
  company_name    text,
  role            text,
  status          text,
  created_at      timestamptz,
  last_platform   text,
  email_confirmed boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit  int;
  v_search text;
begin
  -- Raise rather than return empty: "no matches" and "you are not allowed" must
  -- never look identical to the operator. That confusion is exactly what hid the
  -- concierge RLS problem for months.
  if not public.is_admin_user() then
    raise exception 'Admins only.';
  end if;

  v_limit  := greatest(1, least(coalesce(p_limit, 200), 1000));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select p.id, p.email, p.full_name, p.company_name, p.role, p.status,
         p.created_at, p.last_platform,
         (coalesce(u.email_confirmed_at, u.confirmed_at) is not null)
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id in (select public.admin_email_segment_ids(p_segment))
    and (
      v_search is null
      or p.email        ilike '%' || v_search || '%'
      or p.full_name    ilike '%' || v_search || '%'
      or p.company_name ilike '%' || v_search || '%'
    )
  order by p.created_at desc
  limit v_limit;
end;
$$;
alter function public.admin_email_segment(text, text, int) owner to postgres;

-- Sizes for the segment tabs. Counts the full membership, NOT the paged list, so a
-- segment larger than the page size still reports its real size.
create or replace function public.admin_email_segment_counts()
returns table (segment text, total bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin_user() then
    raise exception 'Admins only.';
  end if;

  return query
  select s.seg::text,
         (select count(*) from public.admin_email_segment_ids(s.seg))::bigint
  from (values
    ('unverified_email'),
    ('supplier_no_docs'),
    ('supplier_pending_review'),
    ('trader_no_requests')
  ) as s(seg);
end;
$$;
alter function public.admin_email_segment_counts() owner to postgres;

revoke all on function public.admin_email_segment_ids(text)           from public, anon, authenticated;
revoke all on function public.admin_email_segment(text, text, int)    from public, anon;
revoke all on function public.admin_email_segment_counts()            from public, anon;
grant execute on function public.admin_email_segment(text, text, int) to authenticated;
grant execute on function public.admin_email_segment_counts()         to authenticated;

commit;
