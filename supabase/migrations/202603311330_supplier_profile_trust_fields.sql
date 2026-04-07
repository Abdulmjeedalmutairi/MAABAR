alter table public.profiles
  add column if not exists company_description text,
  add column if not exists business_type text,
  add column if not exists year_established integer,
  add column if not exists languages text[] not null default '{}',
  add column if not exists customization_support text,
  add column if not exists export_markets text[] not null default '{}',
  add column if not exists company_address text,
  add column if not exists company_website text;

update public.profiles
set company_description = coalesce(
  nullif(trim(coalesce(company_description, '')), ''),
  nullif(trim(coalesce(bio_en, '')), ''),
  nullif(trim(coalesce(bio_ar, '')), ''),
  nullif(trim(coalesce(bio_zh, '')), '')
)
where role = 'supplier';

comment on column public.profiles.company_description is 'Language-agnostic supplier company description used in profile and verification flow.';
comment on column public.profiles.business_type is 'Foundational supplier trust field: company business type.';
comment on column public.profiles.year_established is 'Foundational supplier trust field: company establishment year.';
comment on column public.profiles.languages is 'Languages supported by the supplier, stored as a text array.';
comment on column public.profiles.customization_support is 'Supplier customization / OEM / ODM capability summary.';
comment on column public.profiles.export_markets is 'Supplier export markets, stored as a text array.';
comment on column public.profiles.company_address is 'Supplier company address.';
comment on column public.profiles.company_website is 'Supplier company website URL.';
