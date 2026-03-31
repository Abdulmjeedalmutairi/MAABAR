alter table public.profiles
  add column if not exists trade_links text[] not null default '{}';

update public.profiles
set trade_links = case
  when coalesce(array_length(trade_links, 1), 0) > 0 then trade_links
  when nullif(trim(coalesce(trade_link, '')), '') is not null then array[trim(trade_link)]
  else '{}'
end
where role = 'supplier';

comment on column public.profiles.trade_links is 'Optional list of supplier trade page links. trade_link remains the canonical primary link for backward compatibility.';
