-- Factory certifications — [{ code, name_ar, name_en }] shown as green pills on
-- the factory card + profile. Known codes (ISO 9001, CE, FSC, OEKO-TEX…) render
-- a friendly meaning; unknown ones keep the name Gemini/the admin supplied.

alter table public.factory_directory
  add column if not exists certifications jsonb not null default '[]'::jsonb;

-- Buyer-facing view must expose it (recreate with the column appended).
create or replace view public.factory_directory_public as
 select id,
    company_name,
    company_name_latin,
    category,
    description_ar,
    description_en,
    description_zh,
    city,
    country,
    factory_images,
    sort_order,
    profile_image,
    founded_year,
    export_markets,
    is_verified,
    is_featured,
    moq_note,
    private_label,
    address,
    certifications
   from factory_directory f
  where is_active;
