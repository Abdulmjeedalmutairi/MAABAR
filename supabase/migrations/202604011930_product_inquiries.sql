create table if not exists public.product_inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  buyer_id uuid not null,
  supplier_id uuid not null,
  template_key text not null check (template_key in ('delivery_eta', 'custom_orders', 'shipping_cost')),
  question_text text not null,
  status text not null default 'open' check (status in ('open', 'answered')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists product_inquiries_supplier_status_idx
  on public.product_inquiries (supplier_id, status, updated_at desc);

create index if not exists product_inquiries_buyer_updated_idx
  on public.product_inquiries (buyer_id, updated_at desc);

create index if not exists product_inquiries_product_idx
  on public.product_inquiries (product_id);

create table if not exists public.product_inquiry_replies (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.product_inquiries(id) on delete cascade,
  sender_id uuid not null,
  receiver_id uuid not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists product_inquiry_replies_inquiry_created_idx
  on public.product_inquiry_replies (inquiry_id, created_at asc);

create or replace function public.guard_product_inquiry_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  buyer_role text;
  matched_supplier_id uuid;
begin
  new.question_text := trim(coalesce(new.question_text, ''));
  if new.question_text = '' then
    raise exception 'Product inquiry question is required.';
  end if;

  new.template_key := trim(coalesce(new.template_key, ''));
  if new.template_key not in ('delivery_eta', 'custom_orders', 'shipping_cost') then
    raise exception 'Unsupported product inquiry template.';
  end if;

  if public.is_service_role() or public.is_admin_user() then
    new.status := 'open';
    new.updated_at := timezone('utc', now());
    return new;
  end if;

  if auth.uid() is null or new.buyer_id is distinct from auth.uid() then
    raise exception 'Only the authenticated buyer can create this inquiry.';
  end if;

  select lower(coalesce(role, ''))
  into buyer_role
  from public.profiles
  where id = new.buyer_id;

  if buyer_role <> 'buyer' then
    raise exception 'Only buyer accounts can create product inquiries.';
  end if;

  select p.supplier_id
  into matched_supplier_id
  from public.products p
  where p.id = new.product_id
    and p.supplier_id = new.supplier_id
    and coalesce(p.is_active, true) = true
  limit 1;

  if matched_supplier_id is null then
    raise exception 'Product and supplier do not match for this inquiry.';
  end if;

  if not public.is_verified_supplier(new.supplier_id) then
    raise exception 'This supplier is not available for product inquiries.';
  end if;

  new.status := 'open';
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function public.guard_product_inquiry_reply_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inquiry_row public.product_inquiries%rowtype;
begin
  new.message := trim(coalesce(new.message, ''));
  if new.message = '' then
    raise exception 'Product inquiry reply message is required.';
  end if;

  select *
  into inquiry_row
  from public.product_inquiries
  where id = new.inquiry_id;

  if not found then
    raise exception 'Product inquiry not found.';
  end if;

  if public.is_service_role() or public.is_admin_user() then
    update public.product_inquiries
    set status = case when new.sender_id = inquiry_row.supplier_id then 'answered' else 'open' end,
        updated_at = timezone('utc', now())
    where id = new.inquiry_id;
    return new;
  end if;

  if auth.uid() is null or new.sender_id is distinct from auth.uid() then
    raise exception 'Reply sender does not match the authenticated user.';
  end if;

  if auth.uid() is distinct from inquiry_row.supplier_id then
    raise exception 'Only the supplier can reply to this product inquiry.';
  end if;

  if new.receiver_id is distinct from inquiry_row.buyer_id then
    raise exception 'Reply receiver must be the original buyer.';
  end if;

  update public.product_inquiries
  set status = 'answered',
      updated_at = timezone('utc', now())
  where id = new.inquiry_id;

  return new;
end;
$$;

drop trigger if exists product_inquiries_guard_before_insert on public.product_inquiries;
create trigger product_inquiries_guard_before_insert
before insert on public.product_inquiries
for each row
execute function public.guard_product_inquiry_before_insert();

drop trigger if exists product_inquiry_replies_guard_before_insert on public.product_inquiry_replies;
create trigger product_inquiry_replies_guard_before_insert
before insert on public.product_inquiry_replies
for each row
execute function public.guard_product_inquiry_reply_before_insert();

alter table public.product_inquiries enable row level security;
alter table public.product_inquiry_replies enable row level security;

drop policy if exists product_inquiries_select_participants on public.product_inquiries;
create policy product_inquiries_select_participants
on public.product_inquiries
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
  or supplier_id = auth.uid()
);

drop policy if exists product_inquiries_insert_buyer on public.product_inquiries;
create policy product_inquiries_insert_buyer
on public.product_inquiries
for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    buyer_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) = 'buyer'
    )
    and exists (
      select 1
      from public.products prod
      where prod.id = product_id
        and prod.supplier_id = supplier_id
        and coalesce(prod.is_active, true) = true
    )
    and public.is_verified_supplier(supplier_id)
  )
);

drop policy if exists product_inquiry_replies_select_participants on public.product_inquiry_replies;
create policy product_inquiry_replies_select_participants
on public.product_inquiry_replies
for select
to authenticated
using (
  public.is_admin_user()
  or exists (
    select 1
    from public.product_inquiries i
    where i.id = inquiry_id
      and (i.buyer_id = auth.uid() or i.supplier_id = auth.uid())
  )
);

drop policy if exists product_inquiry_replies_insert_supplier on public.product_inquiry_replies;
create policy product_inquiry_replies_insert_supplier
on public.product_inquiry_replies
for insert
to authenticated
with check (
  public.is_admin_user()
  or exists (
    select 1
    from public.product_inquiries i
    where i.id = inquiry_id
      and i.supplier_id = auth.uid()
      and sender_id = auth.uid()
      and receiver_id = i.buyer_id
  )
);

grant select, insert on public.product_inquiries to authenticated;
grant select, insert on public.product_inquiry_replies to authenticated;
