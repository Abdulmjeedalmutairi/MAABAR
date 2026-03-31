begin;

alter table if exists public.profiles
  add column if not exists preferred_display_currency text;

alter table if exists public.profiles
  drop constraint if exists profiles_preferred_display_currency_check;

alter table if exists public.profiles
  add constraint profiles_preferred_display_currency_check
  check (
    preferred_display_currency is null
    or preferred_display_currency in ('USD', 'SAR', 'CNY')
  );

alter table if exists public.products
  add column if not exists gallery_images text[] not null default '{}'::text[];

alter table if exists public.products
  add column if not exists spec_material text,
  add column if not exists spec_dimensions text,
  add column if not exists spec_unit_weight text,
  add column if not exists spec_color_options text,
  add column if not exists spec_packaging_details text,
  add column if not exists spec_customization text,
  add column if not exists spec_lead_time_days integer;

update public.products
set gallery_images = array[image_url]
where image_url is not null
  and coalesce(array_length(gallery_images, 1), 0) = 0;

comment on column public.profiles.preferred_display_currency is 'User display-only currency preference. Does not change source transaction currency.';
comment on column public.products.gallery_images is 'Additional product gallery images. First image mirrors image_url for backward compatibility.';
comment on column public.products.spec_material is 'Supplier-entered product material summary.';
comment on column public.products.spec_dimensions is 'Supplier-entered product size or dimensions summary.';
comment on column public.products.spec_unit_weight is 'Supplier-entered per-unit weight summary.';
comment on column public.products.spec_color_options is 'Supplier-entered supported colors or variants.';
comment on column public.products.spec_packaging_details is 'Supplier-entered packaging details.';
comment on column public.products.spec_customization is 'Supplier-entered customization / OEM capability notes.';
comment on column public.products.spec_lead_time_days is 'Supplier-entered lead time estimate in days.';

commit;
