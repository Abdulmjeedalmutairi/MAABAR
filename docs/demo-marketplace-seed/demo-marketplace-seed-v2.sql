-- ============================================================================
-- MAABAR synthetic demo marketplace seed (v2)
-- Idempotent. Paste into the Supabase SQL Editor and run.
-- Synthetic demo-safe data only — no real companies, licenses, or documents.
--
-- Contents: 50 suppliers (verified, MS-009001..MS-009050, across all 23 categories),
--           5 traders, 200 products (4/supplier, is_active=true, price in product_pricing_tiers), 30 open requests.
-- Demo logins: demo-supplier@maabar.io / Demo1234!   demo-trader@maabar.io / Demo1234!
-- ============================================================================
begin;
select set_config('request.jwt.claim.role', 'service_role', true);

-- ── 1. Supplier accounts (auth user + identity + profile shell) ──────────────
-- supplier 1: Maabar Demo Manufacturing Co., Ltd. [electronics] MS-009001
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'demo-supplier@maabar.io' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'demo-supplier@maabar.io',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'demo-supplier@maabar.io', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'demo-supplier@maabar.io', 'supplier', 'verified', 'Lina Zhou', 'Maabar Demo Manufacturing Co., Ltd.', 'Guangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 2: Shenzhen Apex Electronics Co., Ltd. [electronics] MS-009002
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-02@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-02@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-02@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-02@example.com', 'supplier', 'verified', 'Amy Chen', 'Shenzhen Apex Electronics Co., Ltd.', 'Shenzhen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 3: Yiwu Sino Home Appliance Co., Ltd. [home_appliances] MS-009003
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-03@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-03@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-03@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-03@example.com', 'supplier', 'verified', 'Kevin Wang', 'Yiwu Sino Home Appliance Co., Ltd.', 'Yiwu', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 4: Ningbo GrandEast Home Appliance Co., Ltd. [home_appliances] MS-009004
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-04@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-04@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-04@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-04@example.com', 'supplier', 'verified', 'Grace Li', 'Ningbo GrandEast Home Appliance Co., Ltd.', 'Ningbo', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 5: Foshan Nova Furniture Co., Ltd. [furniture] MS-009005
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-05@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-05@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-05@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-05@example.com', 'supplier', 'verified', 'Tony Huang', 'Foshan Nova Furniture Co., Ltd.', 'Foshan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 6: Dongguan Orient Furniture Co., Ltd. [furniture] MS-009006
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-06@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-06@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-06@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-06@example.com', 'supplier', 'verified', 'Cindy Wu', 'Dongguan Orient Furniture Co., Ltd.', 'Dongguan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 7: Xiamen Summit Office Furniture Co., Ltd. [office_furniture] MS-009007
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-07@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-07@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-07@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-07@example.com', 'supplier', 'verified', 'Jack Lin', 'Xiamen Summit Office Furniture Co., Ltd.', 'Xiamen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 8: Hangzhou Pacific Office Furniture Co., Ltd. [office_furniture] MS-009008
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-08@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-08@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-08@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-08@example.com', 'supplier', 'verified', 'Fiona Yang', 'Hangzhou Pacific Office Furniture Co., Ltd.', 'Hangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 9: Suzhou Golden Bedroom Furniture Co., Ltd. [bedroom_furniture] MS-009009
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-09@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-09@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-09@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-09@example.com', 'supplier', 'verified', 'Leo Zhang', 'Suzhou Golden Bedroom Furniture Co., Ltd.', 'Suzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 10: Qingdao Evergreen Bedroom Furniture Co., Ltd. [bedroom_furniture] MS-009010
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-10@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-10@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-10@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-10@example.com', 'supplier', 'verified', 'Nancy Xu', 'Qingdao Evergreen Bedroom Furniture Co., Ltd.', 'Qingdao', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 11: Guangzhou Skyline Kitchen Furniture Co., Ltd. [kitchen_furniture] MS-009011
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-11@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-11@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-11@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-11@example.com', 'supplier', 'verified', 'Daniel Chen', 'Guangzhou Skyline Kitchen Furniture Co., Ltd.', 'Guangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 12: Shenzhen Unison Kitchen Furniture Co., Ltd. [kitchen_furniture] MS-009012
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-12@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-12@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-12@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-12@example.com', 'supplier', 'verified', 'Sophie Zhao', 'Shenzhen Unison Kitchen Furniture Co., Ltd.', 'Shenzhen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 13: Yiwu Brightway Outdoor Furniture Co., Ltd. [outdoor_furniture] MS-009013
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-13@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-13@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-13@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-13@example.com', 'supplier', 'verified', 'Bruce Tan', 'Yiwu Brightway Outdoor Furniture Co., Ltd.', 'Yiwu', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 14: Ningbo EastPort Outdoor Furniture Co., Ltd. [outdoor_furniture] MS-009014
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-14@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-14@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-14@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-14@example.com', 'supplier', 'verified', 'Helen Guo', 'Ningbo EastPort Outdoor Furniture Co., Ltd.', 'Ningbo', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 15: Foshan Crownway Home Décor Co., Ltd. [home_decor] MS-009015
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-15@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-15@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-15@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-15@example.com', 'supplier', 'verified', 'Victor Sun', 'Foshan Crownway Home Décor Co., Ltd.', 'Foshan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 16: Dongguan Maxwell Home Décor Co., Ltd. [home_decor] MS-009016
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-16@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-16@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-16@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-16@example.com', 'supplier', 'verified', 'Emily Deng', 'Dongguan Maxwell Home Décor Co., Ltd.', 'Dongguan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 17: Xiamen Silkroad Apparel Co., Ltd. [clothing] MS-009017
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-17@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-17@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-17@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-17@example.com', 'supplier', 'verified', 'Ryan Ma', 'Xiamen Silkroad Apparel Co., Ltd.', 'Xiamen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 18: Hangzhou Harbor Apparel Co., Ltd. [clothing] MS-009018
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-18@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-18@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-18@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-18@example.com', 'supplier', 'verified', 'Coco Liang', 'Hangzhou Harbor Apparel Co., Ltd.', 'Hangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 19: Suzhou Vanguard Building Materials Co., Ltd. [building] MS-009019
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-19@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-19@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-19@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-19@example.com', 'supplier', 'verified', 'Sam Feng', 'Suzhou Vanguard Building Materials Co., Ltd.', 'Suzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 20: Qingdao Pinnacle Building Materials Co., Ltd. [building] MS-009020
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-20@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-20@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-20@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-20@example.com', 'supplier', 'verified', 'Iris Cao', 'Qingdao Pinnacle Building Materials Co., Ltd.', 'Qingdao', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 21: Guangzhou Trinity Food Co., Ltd. [food] MS-009021
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-21@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-21@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-21@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-21@example.com', 'supplier', 'verified', 'Lina Zhou', 'Guangzhou Trinity Food Co., Ltd.', 'Guangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 22: Shenzhen Zenith Food Co., Ltd. [food] MS-009022
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-22@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-22@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-22@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-22@example.com', 'supplier', 'verified', 'Amy Chen', 'Shenzhen Zenith Food Co., Ltd.', 'Shenzhen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 23: Yiwu Cardinal Beauty Co., Ltd. [beauty] MS-009023
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-23@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-23@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-23@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-23@example.com', 'supplier', 'verified', 'Kevin Wang', 'Yiwu Cardinal Beauty Co., Ltd.', 'Yiwu', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 24: Ningbo Meridian Beauty Co., Ltd. [beauty] MS-009024
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-24@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-24@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-24@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-24@example.com', 'supplier', 'verified', 'Grace Li', 'Ningbo Meridian Beauty Co., Ltd.', 'Ningbo', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 25: Foshan Falcon Sports Co., Ltd. [sports] MS-009025
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-25@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-25@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-25@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-25@example.com', 'supplier', 'verified', 'Tony Huang', 'Foshan Falcon Sports Co., Ltd.', 'Foshan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 26: Dongguan Volt Sports Co., Ltd. [sports] MS-009026
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-26@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-26@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-26@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-26@example.com', 'supplier', 'verified', 'Cindy Wu', 'Dongguan Volt Sports Co., Ltd.', 'Dongguan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 27: Xiamen Apex Toys Co., Ltd. [toys] MS-009027
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-27@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-27@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-27@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-27@example.com', 'supplier', 'verified', 'Jack Lin', 'Xiamen Apex Toys Co., Ltd.', 'Xiamen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 28: Hangzhou Sino Toys Co., Ltd. [toys] MS-009028
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-28@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-28@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-28@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-28@example.com', 'supplier', 'verified', 'Fiona Yang', 'Hangzhou Sino Toys Co., Ltd.', 'Hangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 29: Suzhou GrandEast Auto Parts Co., Ltd. [auto_parts] MS-009029
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-29@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-29@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-29@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-29@example.com', 'supplier', 'verified', 'Leo Zhang', 'Suzhou GrandEast Auto Parts Co., Ltd.', 'Suzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 30: Qingdao Nova Auto Parts Co., Ltd. [auto_parts] MS-009030
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-30@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-30@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-30@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-30@example.com', 'supplier', 'verified', 'Nancy Xu', 'Qingdao Nova Auto Parts Co., Ltd.', 'Qingdao', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 31: Guangzhou Orient Car Accessories Co., Ltd. [car_accessories] MS-009031
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-31@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-31@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-31@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-31@example.com', 'supplier', 'verified', 'Daniel Chen', 'Guangzhou Orient Car Accessories Co., Ltd.', 'Guangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 32: Shenzhen Summit Car Accessories Co., Ltd. [car_accessories] MS-009032
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-32@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-32@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-32@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-32@example.com', 'supplier', 'verified', 'Sophie Zhao', 'Shenzhen Summit Car Accessories Co., Ltd.', 'Shenzhen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 33: Yiwu Pacific Tire Co., Ltd. [tires] MS-009033
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-33@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-33@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-33@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-33@example.com', 'supplier', 'verified', 'Bruce Tan', 'Yiwu Pacific Tire Co., Ltd.', 'Yiwu', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 34: Ningbo Golden Tire Co., Ltd. [tires] MS-009034
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-34@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-34@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-34@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-34@example.com', 'supplier', 'verified', 'Helen Guo', 'Ningbo Golden Tire Co., Ltd.', 'Ningbo', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 35: Foshan Evergreen Lubricants Co., Ltd. [lubricants] MS-009035
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-35@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-35@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-35@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-35@example.com', 'supplier', 'verified', 'Victor Sun', 'Foshan Evergreen Lubricants Co., Ltd.', 'Foshan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 36: Dongguan Skyline Lubricants Co., Ltd. [lubricants] MS-009036
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-36@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-36@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-36@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-36@example.com', 'supplier', 'verified', 'Emily Deng', 'Dongguan Skyline Lubricants Co., Ltd.', 'Dongguan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 37: Xiamen Unison Medical Co., Ltd. [health] MS-009037
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-37@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-37@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-37@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-37@example.com', 'supplier', 'verified', 'Ryan Ma', 'Xiamen Unison Medical Co., Ltd.', 'Xiamen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 38: Hangzhou Brightway Medical Co., Ltd. [health] MS-009038
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-38@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-38@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-38@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-38@example.com', 'supplier', 'verified', 'Coco Liang', 'Hangzhou Brightway Medical Co., Ltd.', 'Hangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 39: Suzhou EastPort Packaging Co., Ltd. [packaging] MS-009039
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-39@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-39@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-39@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-39@example.com', 'supplier', 'verified', 'Sam Feng', 'Suzhou EastPort Packaging Co., Ltd.', 'Suzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 40: Qingdao Crownway Packaging Co., Ltd. [packaging] MS-009040
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-40@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-40@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-40@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-40@example.com', 'supplier', 'verified', 'Iris Cao', 'Qingdao Crownway Packaging Co., Ltd.', 'Qingdao', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 41: Guangzhou Maxwell Gifts Co., Ltd. [gifts] MS-009041
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-41@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-41@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-41@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-41@example.com', 'supplier', 'verified', 'Lina Zhou', 'Guangzhou Maxwell Gifts Co., Ltd.', 'Guangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 42: Shenzhen Silkroad Gifts Co., Ltd. [gifts] MS-009042
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-42@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-42@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-42@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-42@example.com', 'supplier', 'verified', 'Amy Chen', 'Shenzhen Silkroad Gifts Co., Ltd.', 'Shenzhen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 43: Yiwu Harbor Agriculture Co., Ltd. [agriculture] MS-009043
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-43@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-43@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-43@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-43@example.com', 'supplier', 'verified', 'Kevin Wang', 'Yiwu Harbor Agriculture Co., Ltd.', 'Yiwu', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 44: Ningbo Vanguard Agriculture Co., Ltd. [agriculture] MS-009044
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-44@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-44@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-44@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-44@example.com', 'supplier', 'verified', 'Grace Li', 'Ningbo Vanguard Agriculture Co., Ltd.', 'Ningbo', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 45: Foshan Pinnacle Industrial Supplies Co., Ltd. [other] MS-009045
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-45@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-45@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-45@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-45@example.com', 'supplier', 'verified', 'Tony Huang', 'Foshan Pinnacle Industrial Supplies Co., Ltd.', 'Foshan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 46: Dongguan Trinity Industrial Supplies Co., Ltd. [other] MS-009046
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-46@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-46@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-46@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-46@example.com', 'supplier', 'verified', 'Cindy Wu', 'Dongguan Trinity Industrial Supplies Co., Ltd.', 'Dongguan', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 47: Xiamen Zenith Electronics Co., Ltd. [electronics] MS-009047
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-47@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-47@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-47@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-47@example.com', 'supplier', 'verified', 'Jack Lin', 'Xiamen Zenith Electronics Co., Ltd.', 'Xiamen', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 48: Hangzhou Cardinal Home Appliance Co., Ltd. [home_appliances] MS-009048
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-48@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-48@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-48@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-48@example.com', 'supplier', 'verified', 'Fiona Yang', 'Hangzhou Cardinal Home Appliance Co., Ltd.', 'Hangzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 49: Suzhou Meridian Furniture Co., Ltd. [furniture] MS-009049
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-49@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-49@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-49@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-49@example.com', 'supplier', 'verified', 'Leo Zhang', 'Suzhou Meridian Furniture Co., Ltd.', 'Suzhou', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- supplier 50: Qingdao Falcon Office Furniture Co., Ltd. [office_furniture] MS-009050
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-supplier-50@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-supplier-50@example.com',
      extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"supplier","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('MaabarDemo!2026Seed#', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-supplier-50@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-supplier-50@example.com', 'supplier', 'verified', 'Nancy Xu', 'Qingdao Falcon Office Furniture Co., Ltd.', 'Qingdao', 'China')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- ── 2. Trader accounts (auth user + identity + profile shell) ────────────────
-- trader 1: Maabar Demo Trading Est.
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'demo-trader@maabar.io' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'demo-trader@maabar.io',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('Demo1234!', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'demo-trader@maabar.io', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'demo-trader@maabar.io', 'buyer', 'active', 'Demo Trader', 'Maabar Demo Trading Est.', 'Riyadh', 'Saudi Arabia')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- trader 2: Najd Retail Group
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-trader-2@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-trader-2@example.com',
      extensions.crypt('undefined', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('undefined', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-trader-2@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-trader-2@example.com', 'buyer', 'active', 'Abdullah Al-Qahtani', 'Najd Retail Group', 'Riyadh', 'Saudi Arabia')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- trader 3: Red Sea Import House
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-trader-3@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-trader-3@example.com',
      extensions.crypt('undefined', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('undefined', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-trader-3@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-trader-3@example.com', 'buyer', 'active', 'Sara Al-Harbi', 'Red Sea Import House', 'Jeddah', 'Saudi Arabia')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- trader 4: Gulf Eastern Traders
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-trader-4@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-trader-4@example.com',
      extensions.crypt('undefined', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('undefined', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-trader-4@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-trader-4@example.com', 'buyer', 'active', 'Faisal Al-Otaibi', 'Gulf Eastern Traders', 'Dammam', 'Saudi Arabia')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- trader 5: Haramain Supplies Co.
do $$
declare v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'seed-trader-5@example.com' limit 1;
  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', 'seed-trader-5@example.com',
      extensions.crypt('undefined', extensions.gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"],"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      '{"role":"buyer","is_seed":true,"seed_group":"demo-marketplace-v2"}'::jsonb,
      false, now(), now(), false, false
    );
  else
    update auth.users set
      encrypted_password = extensions.crypt('undefined', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = v_user_id;
  end if;

  if not exists (select 1 from auth.identities where user_id = v_user_id and provider = 'email') then
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id)
    values (v_user_id::text, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'seed-trader-5@example.com', 'email_verified', true),
      'email', now(), now(), now(), gen_random_uuid());
  end if;

  insert into public.profiles (id, email, role, status, full_name, company_name, city, country)
  values (v_user_id, 'seed-trader-5@example.com', 'buyer', 'active', 'Noura Al-Shehri', 'Haramain Supplies Co.', 'Mecca', 'Saudi Arabia')
  on conflict (id) do update set
    email = excluded.email, role = excluded.role, status = excluded.status,
    full_name = excluded.full_name, company_name = excluded.company_name,
    city = excluded.city, country = excluded.country;
end $$;

-- ── 3. Rich supplier profiles (by email) ─────────────────────────────────────
update public.profiles set
  speciality = 'Electronics',
  whatsapp = '+8613800000000',
  wechat = 'demo_electronics_1',
  trade_link = 'https://trade.maabar-demo.example/electronics/1',
  trade_links = array['https://trade.maabar-demo.example/electronics/1', 'https://maabar-demo.example/electronics/catalog']::text[],
  min_order_value = 800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2008,
  years_experience = 18,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Guangzhou Industrial Export Park, Guangzhou, China',
  company_website = 'https://maabar-demo.example/electronics/1',
  company_description = 'Synthetic demo supplier in Electronics. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Electronics. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إلكترونيات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '电子产品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Maabar%20Demo%20Manufacturing%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-electronics-factory-1-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-factory-1-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-factory-1-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-electronics-factory-1-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 11,
  reg_number = 'DEMO-0001',
  num_employees = 20,
  maabar_supplier_id = 'MS-009001'
where email = 'demo-supplier@maabar.io';

update public.profiles set
  speciality = 'Electronics',
  whatsapp = '+8613800000001',
  wechat = 'demo_electronics_2',
  trade_link = 'https://trade.maabar-demo.example/electronics/2',
  trade_links = array['https://trade.maabar-demo.example/electronics/2', 'https://maabar-demo.example/electronics/catalog']::text[],
  min_order_value = 1000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2009,
  years_experience = 17,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Shenzhen Industrial Export Park, Shenzhen, China',
  company_website = 'https://maabar-demo.example/electronics/2',
  company_description = 'Synthetic demo supplier in Electronics. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Electronics. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إلكترونيات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '电子产品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Shenzhen%20Apex%20Electronics%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-electronics-factory-2-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-factory-2-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-factory-2-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-electronics-factory-2-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 24,
  reg_number = 'DEMO-0002',
  num_employees = 25,
  maabar_supplier_id = 'MS-009002'
where email = 'seed-supplier-02@example.com';

update public.profiles set
  speciality = 'Home Appliances',
  whatsapp = '+8613800000002',
  wechat = 'demo_home_appliances_3',
  trade_link = 'https://trade.maabar-demo.example/home_appliances/3',
  trade_links = array['https://trade.maabar-demo.example/home_appliances/3', 'https://maabar-demo.example/home_appliances/catalog']::text[],
  min_order_value = 1200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2010,
  years_experience = 16,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Yiwu Industrial Export Park, Yiwu, China',
  company_website = 'https://maabar-demo.example/home_appliances/3',
  company_description = 'Synthetic demo supplier in Home Appliances. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Home Appliances. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أجهزة منزلية لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家用电器行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Yiwu%20Sino%20Home%20Appliance%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-home_appliances-factory-3-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-factory-3-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-factory-3-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-home_appliances-factory-3-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 37,
  reg_number = 'DEMO-0003',
  num_employees = 30,
  maabar_supplier_id = 'MS-009003'
where email = 'seed-supplier-03@example.com';

update public.profiles set
  speciality = 'Home Appliances',
  whatsapp = '+8613800000003',
  wechat = 'demo_home_appliances_4',
  trade_link = 'https://trade.maabar-demo.example/home_appliances/4',
  trade_links = array['https://trade.maabar-demo.example/home_appliances/4', 'https://maabar-demo.example/home_appliances/catalog']::text[],
  min_order_value = 1400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2011,
  years_experience = 15,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Ningbo Industrial Export Park, Ningbo, China',
  company_website = 'https://maabar-demo.example/home_appliances/4',
  company_description = 'Synthetic demo supplier in Home Appliances. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Home Appliances. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أجهزة منزلية لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家用电器行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Ningbo%20GrandEast%20Home%20Appliance%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-home_appliances-factory-4-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-factory-4-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-factory-4-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-home_appliances-factory-4-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 50,
  reg_number = 'DEMO-0004',
  num_employees = 35,
  maabar_supplier_id = 'MS-009004'
where email = 'seed-supplier-04@example.com';

update public.profiles set
  speciality = 'Furniture',
  whatsapp = '+8613800000004',
  wechat = 'demo_furniture_5',
  trade_link = 'https://trade.maabar-demo.example/furniture/5',
  trade_links = array['https://trade.maabar-demo.example/furniture/5', 'https://maabar-demo.example/furniture/catalog']::text[],
  min_order_value = 1600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2012,
  years_experience = 14,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Foshan Industrial Export Park, Foshan, China',
  company_website = 'https://maabar-demo.example/furniture/5',
  company_description = 'Synthetic demo supplier in Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Foshan%20Nova%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-furniture-factory-5-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-factory-5-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-factory-5-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-furniture-factory-5-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 23,
  reg_number = 'DEMO-0005',
  num_employees = 40,
  maabar_supplier_id = 'MS-009005'
where email = 'seed-supplier-05@example.com';

update public.profiles set
  speciality = 'Furniture',
  whatsapp = '+8613800000005',
  wechat = 'demo_furniture_6',
  trade_link = 'https://trade.maabar-demo.example/furniture/6',
  trade_links = array['https://trade.maabar-demo.example/furniture/6', 'https://maabar-demo.example/furniture/catalog']::text[],
  min_order_value = 1800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2013,
  years_experience = 13,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Dongguan Industrial Export Park, Dongguan, China',
  company_website = 'https://maabar-demo.example/furniture/6',
  company_description = 'Synthetic demo supplier in Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Dongguan%20Orient%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-furniture-factory-6-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-factory-6-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-factory-6-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-furniture-factory-6-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 36,
  reg_number = 'DEMO-0006',
  num_employees = 45,
  maabar_supplier_id = 'MS-009006'
where email = 'seed-supplier-06@example.com';

update public.profiles set
  speciality = 'Office Furniture',
  whatsapp = '+8613800000006',
  wechat = 'demo_office_furniture_7',
  trade_link = 'https://trade.maabar-demo.example/office_furniture/7',
  trade_links = array['https://trade.maabar-demo.example/office_furniture/7', 'https://maabar-demo.example/office_furniture/catalog']::text[],
  min_order_value = 2000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2014,
  years_experience = 12,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Xiamen Industrial Export Park, Xiamen, China',
  company_website = 'https://maabar-demo.example/office_furniture/7',
  company_description = 'Synthetic demo supplier in Office Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Office Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث مكتبي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '办公家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Xiamen%20Summit%20Office%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-office_furniture-factory-7-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-factory-7-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-factory-7-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-office_furniture-factory-7-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 49,
  reg_number = 'DEMO-0007',
  num_employees = 50,
  maabar_supplier_id = 'MS-009007'
where email = 'seed-supplier-07@example.com';

update public.profiles set
  speciality = 'Office Furniture',
  whatsapp = '+8613800000007',
  wechat = 'demo_office_furniture_8',
  trade_link = 'https://trade.maabar-demo.example/office_furniture/8',
  trade_links = array['https://trade.maabar-demo.example/office_furniture/8', 'https://maabar-demo.example/office_furniture/catalog']::text[],
  min_order_value = 2200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2015,
  years_experience = 11,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Hangzhou Industrial Export Park, Hangzhou, China',
  company_website = 'https://maabar-demo.example/office_furniture/8',
  company_description = 'Synthetic demo supplier in Office Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Office Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث مكتبي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '办公家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Hangzhou%20Pacific%20Office%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-office_furniture-factory-8-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-factory-8-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-factory-8-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-office_furniture-factory-8-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 22,
  reg_number = 'DEMO-0008',
  num_employees = 55,
  maabar_supplier_id = 'MS-009008'
where email = 'seed-supplier-08@example.com';

update public.profiles set
  speciality = 'Bedroom Furniture',
  whatsapp = '+8613800000008',
  wechat = 'demo_bedroom_furniture_9',
  trade_link = 'https://trade.maabar-demo.example/bedroom_furniture/9',
  trade_links = array['https://trade.maabar-demo.example/bedroom_furniture/9', 'https://maabar-demo.example/bedroom_furniture/catalog']::text[],
  min_order_value = 2400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2016,
  years_experience = 10,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Suzhou Industrial Export Park, Suzhou, China',
  company_website = 'https://maabar-demo.example/bedroom_furniture/9',
  company_description = 'Synthetic demo supplier in Bedroom Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Bedroom Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث غرف النوم لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '卧室家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Suzhou%20Golden%20Bedroom%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-bedroom_furniture-factory-9-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-factory-9-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-factory-9-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-bedroom_furniture-factory-9-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 35,
  reg_number = 'DEMO-0009',
  num_employees = 60,
  maabar_supplier_id = 'MS-009009'
where email = 'seed-supplier-09@example.com';

update public.profiles set
  speciality = 'Bedroom Furniture',
  whatsapp = '+8613800000009',
  wechat = 'demo_bedroom_furniture_10',
  trade_link = 'https://trade.maabar-demo.example/bedroom_furniture/10',
  trade_links = array['https://trade.maabar-demo.example/bedroom_furniture/10', 'https://maabar-demo.example/bedroom_furniture/catalog']::text[],
  min_order_value = 2600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2017,
  years_experience = 9,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Qingdao Industrial Export Park, Qingdao, China',
  company_website = 'https://maabar-demo.example/bedroom_furniture/10',
  company_description = 'Synthetic demo supplier in Bedroom Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Bedroom Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث غرف النوم لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '卧室家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Qingdao%20Evergreen%20Bedroom%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-bedroom_furniture-factory-10-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-factory-10-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-factory-10-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-bedroom_furniture-factory-10-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 48,
  reg_number = 'DEMO-0010',
  num_employees = 65,
  maabar_supplier_id = 'MS-009010'
where email = 'seed-supplier-10@example.com';

update public.profiles set
  speciality = 'Kitchen Furniture',
  whatsapp = '+8613800000010',
  wechat = 'demo_kitchen_furniture_11',
  trade_link = 'https://trade.maabar-demo.example/kitchen_furniture/11',
  trade_links = array['https://trade.maabar-demo.example/kitchen_furniture/11', 'https://maabar-demo.example/kitchen_furniture/catalog']::text[],
  min_order_value = 800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2018,
  years_experience = 8,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Guangzhou Industrial Export Park, Guangzhou, China',
  company_website = 'https://maabar-demo.example/kitchen_furniture/11',
  company_description = 'Synthetic demo supplier in Kitchen Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Kitchen Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث المطبخ لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '厨房家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Guangzhou%20Skyline%20Kitchen%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-kitchen_furniture-factory-11-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-factory-11-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-factory-11-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-kitchen_furniture-factory-11-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 21,
  reg_number = 'DEMO-0011',
  num_employees = 70,
  maabar_supplier_id = 'MS-009011'
where email = 'seed-supplier-11@example.com';

update public.profiles set
  speciality = 'Kitchen Furniture',
  whatsapp = '+8613800000011',
  wechat = 'demo_kitchen_furniture_12',
  trade_link = 'https://trade.maabar-demo.example/kitchen_furniture/12',
  trade_links = array['https://trade.maabar-demo.example/kitchen_furniture/12', 'https://maabar-demo.example/kitchen_furniture/catalog']::text[],
  min_order_value = 1000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2019,
  years_experience = 7,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Shenzhen Industrial Export Park, Shenzhen, China',
  company_website = 'https://maabar-demo.example/kitchen_furniture/12',
  company_description = 'Synthetic demo supplier in Kitchen Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Kitchen Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث المطبخ لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '厨房家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Shenzhen%20Unison%20Kitchen%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-kitchen_furniture-factory-12-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-factory-12-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-factory-12-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-kitchen_furniture-factory-12-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 34,
  reg_number = 'DEMO-0012',
  num_employees = 75,
  maabar_supplier_id = 'MS-009012'
where email = 'seed-supplier-12@example.com';

update public.profiles set
  speciality = 'Outdoor Furniture',
  whatsapp = '+8613800000012',
  wechat = 'demo_outdoor_furniture_13',
  trade_link = 'https://trade.maabar-demo.example/outdoor_furniture/13',
  trade_links = array['https://trade.maabar-demo.example/outdoor_furniture/13', 'https://maabar-demo.example/outdoor_furniture/catalog']::text[],
  min_order_value = 1200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2020,
  years_experience = 6,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Yiwu Industrial Export Park, Yiwu, China',
  company_website = 'https://maabar-demo.example/outdoor_furniture/13',
  company_description = 'Synthetic demo supplier in Outdoor Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Outdoor Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث خارجي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '户外家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Yiwu%20Brightway%20Outdoor%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-outdoor_furniture-factory-13-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-factory-13-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-factory-13-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-outdoor_furniture-factory-13-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 47,
  reg_number = 'DEMO-0013',
  num_employees = 20,
  maabar_supplier_id = 'MS-009013'
where email = 'seed-supplier-13@example.com';

update public.profiles set
  speciality = 'Outdoor Furniture',
  whatsapp = '+8613800000013',
  wechat = 'demo_outdoor_furniture_14',
  trade_link = 'https://trade.maabar-demo.example/outdoor_furniture/14',
  trade_links = array['https://trade.maabar-demo.example/outdoor_furniture/14', 'https://maabar-demo.example/outdoor_furniture/catalog']::text[],
  min_order_value = 1400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2021,
  years_experience = 5,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Ningbo Industrial Export Park, Ningbo, China',
  company_website = 'https://maabar-demo.example/outdoor_furniture/14',
  company_description = 'Synthetic demo supplier in Outdoor Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Outdoor Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث خارجي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '户外家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Ningbo%20EastPort%20Outdoor%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-outdoor_furniture-factory-14-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-factory-14-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-factory-14-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-outdoor_furniture-factory-14-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 20,
  reg_number = 'DEMO-0014',
  num_employees = 25,
  maabar_supplier_id = 'MS-009014'
where email = 'seed-supplier-14@example.com';

update public.profiles set
  speciality = 'Home Décor',
  whatsapp = '+8613800000014',
  wechat = 'demo_home_decor_15',
  trade_link = 'https://trade.maabar-demo.example/home_decor/15',
  trade_links = array['https://trade.maabar-demo.example/home_decor/15', 'https://maabar-demo.example/home_decor/catalog']::text[],
  min_order_value = 1600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2008,
  years_experience = 18,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Foshan Industrial Export Park, Foshan, China',
  company_website = 'https://maabar-demo.example/home_decor/15',
  company_description = 'Synthetic demo supplier in Home Décor. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Home Décor. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع ديكور منزلي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家居装饰行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Foshan%20Crownway%20Home%20D%C3%A9cor%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-home_decor-factory-15-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-factory-15-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-factory-15-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-home_decor-factory-15-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 33,
  reg_number = 'DEMO-0015',
  num_employees = 30,
  maabar_supplier_id = 'MS-009015'
where email = 'seed-supplier-15@example.com';

update public.profiles set
  speciality = 'Home Décor',
  whatsapp = '+8613800000015',
  wechat = 'demo_home_decor_16',
  trade_link = 'https://trade.maabar-demo.example/home_decor/16',
  trade_links = array['https://trade.maabar-demo.example/home_decor/16', 'https://maabar-demo.example/home_decor/catalog']::text[],
  min_order_value = 1800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2009,
  years_experience = 17,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Dongguan Industrial Export Park, Dongguan, China',
  company_website = 'https://maabar-demo.example/home_decor/16',
  company_description = 'Synthetic demo supplier in Home Décor. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Home Décor. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع ديكور منزلي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家居装饰行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Dongguan%20Maxwell%20Home%20D%C3%A9cor%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-home_decor-factory-16-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-factory-16-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-factory-16-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-home_decor-factory-16-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 46,
  reg_number = 'DEMO-0016',
  num_employees = 35,
  maabar_supplier_id = 'MS-009016'
where email = 'seed-supplier-16@example.com';

update public.profiles set
  speciality = 'Clothing',
  whatsapp = '+8613800000016',
  wechat = 'demo_clothing_17',
  trade_link = 'https://trade.maabar-demo.example/clothing/17',
  trade_links = array['https://trade.maabar-demo.example/clothing/17', 'https://maabar-demo.example/clothing/catalog']::text[],
  min_order_value = 2000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2010,
  years_experience = 16,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Xiamen Industrial Export Park, Xiamen, China',
  company_website = 'https://maabar-demo.example/clothing/17',
  company_description = 'Synthetic demo supplier in Clothing. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Clothing. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع ملابس لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '服装行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Xiamen%20Silkroad%20Apparel%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-clothing-factory-17-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-factory-17-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-factory-17-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-clothing-factory-17-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 19,
  reg_number = 'DEMO-0017',
  num_employees = 40,
  maabar_supplier_id = 'MS-009017'
where email = 'seed-supplier-17@example.com';

update public.profiles set
  speciality = 'Clothing',
  whatsapp = '+8613800000017',
  wechat = 'demo_clothing_18',
  trade_link = 'https://trade.maabar-demo.example/clothing/18',
  trade_links = array['https://trade.maabar-demo.example/clothing/18', 'https://maabar-demo.example/clothing/catalog']::text[],
  min_order_value = 2200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2011,
  years_experience = 15,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Hangzhou Industrial Export Park, Hangzhou, China',
  company_website = 'https://maabar-demo.example/clothing/18',
  company_description = 'Synthetic demo supplier in Clothing. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Clothing. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع ملابس لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '服装行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Hangzhou%20Harbor%20Apparel%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-clothing-factory-18-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-factory-18-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-factory-18-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-clothing-factory-18-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 32,
  reg_number = 'DEMO-0018',
  num_employees = 45,
  maabar_supplier_id = 'MS-009018'
where email = 'seed-supplier-18@example.com';

update public.profiles set
  speciality = 'Building Materials',
  whatsapp = '+8613800000018',
  wechat = 'demo_building_19',
  trade_link = 'https://trade.maabar-demo.example/building/19',
  trade_links = array['https://trade.maabar-demo.example/building/19', 'https://maabar-demo.example/building/catalog']::text[],
  min_order_value = 2400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2012,
  years_experience = 14,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Suzhou Industrial Export Park, Suzhou, China',
  company_website = 'https://maabar-demo.example/building/19',
  company_description = 'Synthetic demo supplier in Building Materials. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Building Materials. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع مواد بناء لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '建材行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Suzhou%20Vanguard%20Building%20Materials%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-building-factory-19-1/1200/900', 'https://picsum.photos/seed/maabar-building-factory-19-2/1200/900', 'https://picsum.photos/seed/maabar-building-factory-19-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-building-factory-19-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 45,
  reg_number = 'DEMO-0019',
  num_employees = 50,
  maabar_supplier_id = 'MS-009019'
where email = 'seed-supplier-19@example.com';

update public.profiles set
  speciality = 'Building Materials',
  whatsapp = '+8613800000019',
  wechat = 'demo_building_20',
  trade_link = 'https://trade.maabar-demo.example/building/20',
  trade_links = array['https://trade.maabar-demo.example/building/20', 'https://maabar-demo.example/building/catalog']::text[],
  min_order_value = 2600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2013,
  years_experience = 13,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Qingdao Industrial Export Park, Qingdao, China',
  company_website = 'https://maabar-demo.example/building/20',
  company_description = 'Synthetic demo supplier in Building Materials. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Building Materials. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع مواد بناء لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '建材行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Qingdao%20Pinnacle%20Building%20Materials%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-building-factory-20-1/1200/900', 'https://picsum.photos/seed/maabar-building-factory-20-2/1200/900', 'https://picsum.photos/seed/maabar-building-factory-20-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-building-factory-20-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 18,
  reg_number = 'DEMO-0020',
  num_employees = 55,
  maabar_supplier_id = 'MS-009020'
where email = 'seed-supplier-20@example.com';

update public.profiles set
  speciality = 'Food',
  whatsapp = '+8613800000020',
  wechat = 'demo_food_21',
  trade_link = 'https://trade.maabar-demo.example/food/21',
  trade_links = array['https://trade.maabar-demo.example/food/21', 'https://maabar-demo.example/food/catalog']::text[],
  min_order_value = 800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2014,
  years_experience = 12,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Guangzhou Industrial Export Park, Guangzhou, China',
  company_website = 'https://maabar-demo.example/food/21',
  company_description = 'Synthetic demo supplier in Food. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Food. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع غذاء لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '食品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Guangzhou%20Trinity%20Food%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-food-factory-21-1/1200/900', 'https://picsum.photos/seed/maabar-food-factory-21-2/1200/900', 'https://picsum.photos/seed/maabar-food-factory-21-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-food-factory-21-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 31,
  reg_number = 'DEMO-0021',
  num_employees = 60,
  maabar_supplier_id = 'MS-009021'
where email = 'seed-supplier-21@example.com';

update public.profiles set
  speciality = 'Food',
  whatsapp = '+8613800000021',
  wechat = 'demo_food_22',
  trade_link = 'https://trade.maabar-demo.example/food/22',
  trade_links = array['https://trade.maabar-demo.example/food/22', 'https://maabar-demo.example/food/catalog']::text[],
  min_order_value = 1000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2015,
  years_experience = 11,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Shenzhen Industrial Export Park, Shenzhen, China',
  company_website = 'https://maabar-demo.example/food/22',
  company_description = 'Synthetic demo supplier in Food. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Food. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع غذاء لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '食品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Shenzhen%20Zenith%20Food%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-food-factory-22-1/1200/900', 'https://picsum.photos/seed/maabar-food-factory-22-2/1200/900', 'https://picsum.photos/seed/maabar-food-factory-22-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-food-factory-22-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 44,
  reg_number = 'DEMO-0022',
  num_employees = 65,
  maabar_supplier_id = 'MS-009022'
where email = 'seed-supplier-22@example.com';

update public.profiles set
  speciality = 'Beauty & Personal Care',
  whatsapp = '+8613800000022',
  wechat = 'demo_beauty_23',
  trade_link = 'https://trade.maabar-demo.example/beauty/23',
  trade_links = array['https://trade.maabar-demo.example/beauty/23', 'https://maabar-demo.example/beauty/catalog']::text[],
  min_order_value = 1200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2016,
  years_experience = 10,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Yiwu Industrial Export Park, Yiwu, China',
  company_website = 'https://maabar-demo.example/beauty/23',
  company_description = 'Synthetic demo supplier in Beauty & Personal Care. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Beauty & Personal Care. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع عناية وتجميل لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '美容护肤行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Yiwu%20Cardinal%20Beauty%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-beauty-factory-23-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-factory-23-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-factory-23-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-beauty-factory-23-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 17,
  reg_number = 'DEMO-0023',
  num_employees = 70,
  maabar_supplier_id = 'MS-009023'
where email = 'seed-supplier-23@example.com';

update public.profiles set
  speciality = 'Beauty & Personal Care',
  whatsapp = '+8613800000023',
  wechat = 'demo_beauty_24',
  trade_link = 'https://trade.maabar-demo.example/beauty/24',
  trade_links = array['https://trade.maabar-demo.example/beauty/24', 'https://maabar-demo.example/beauty/catalog']::text[],
  min_order_value = 1400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2017,
  years_experience = 9,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Ningbo Industrial Export Park, Ningbo, China',
  company_website = 'https://maabar-demo.example/beauty/24',
  company_description = 'Synthetic demo supplier in Beauty & Personal Care. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Beauty & Personal Care. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع عناية وتجميل لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '美容护肤行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Ningbo%20Meridian%20Beauty%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-beauty-factory-24-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-factory-24-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-factory-24-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-beauty-factory-24-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 30,
  reg_number = 'DEMO-0024',
  num_employees = 75,
  maabar_supplier_id = 'MS-009024'
where email = 'seed-supplier-24@example.com';

update public.profiles set
  speciality = 'Sports',
  whatsapp = '+8613800000024',
  wechat = 'demo_sports_25',
  trade_link = 'https://trade.maabar-demo.example/sports/25',
  trade_links = array['https://trade.maabar-demo.example/sports/25', 'https://maabar-demo.example/sports/catalog']::text[],
  min_order_value = 1600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2018,
  years_experience = 8,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Foshan Industrial Export Park, Foshan, China',
  company_website = 'https://maabar-demo.example/sports/25',
  company_description = 'Synthetic demo supplier in Sports. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Sports. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع رياضة لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '运动行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Foshan%20Falcon%20Sports%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-sports-factory-25-1/1200/900', 'https://picsum.photos/seed/maabar-sports-factory-25-2/1200/900', 'https://picsum.photos/seed/maabar-sports-factory-25-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-sports-factory-25-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 43,
  reg_number = 'DEMO-0025',
  num_employees = 20,
  maabar_supplier_id = 'MS-009025'
where email = 'seed-supplier-25@example.com';

update public.profiles set
  speciality = 'Sports',
  whatsapp = '+8613800000025',
  wechat = 'demo_sports_26',
  trade_link = 'https://trade.maabar-demo.example/sports/26',
  trade_links = array['https://trade.maabar-demo.example/sports/26', 'https://maabar-demo.example/sports/catalog']::text[],
  min_order_value = 1800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2019,
  years_experience = 7,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Dongguan Industrial Export Park, Dongguan, China',
  company_website = 'https://maabar-demo.example/sports/26',
  company_description = 'Synthetic demo supplier in Sports. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Sports. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع رياضة لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '运动行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Dongguan%20Volt%20Sports%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-sports-factory-26-1/1200/900', 'https://picsum.photos/seed/maabar-sports-factory-26-2/1200/900', 'https://picsum.photos/seed/maabar-sports-factory-26-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-sports-factory-26-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 16,
  reg_number = 'DEMO-0026',
  num_employees = 25,
  maabar_supplier_id = 'MS-009026'
where email = 'seed-supplier-26@example.com';

update public.profiles set
  speciality = 'Toys',
  whatsapp = '+8613800000026',
  wechat = 'demo_toys_27',
  trade_link = 'https://trade.maabar-demo.example/toys/27',
  trade_links = array['https://trade.maabar-demo.example/toys/27', 'https://maabar-demo.example/toys/catalog']::text[],
  min_order_value = 2000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2020,
  years_experience = 6,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Xiamen Industrial Export Park, Xiamen, China',
  company_website = 'https://maabar-demo.example/toys/27',
  company_description = 'Synthetic demo supplier in Toys. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Toys. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع ألعاب لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '玩具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Xiamen%20Apex%20Toys%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-toys-factory-27-1/1200/900', 'https://picsum.photos/seed/maabar-toys-factory-27-2/1200/900', 'https://picsum.photos/seed/maabar-toys-factory-27-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-toys-factory-27-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 29,
  reg_number = 'DEMO-0027',
  num_employees = 30,
  maabar_supplier_id = 'MS-009027'
where email = 'seed-supplier-27@example.com';

update public.profiles set
  speciality = 'Toys',
  whatsapp = '+8613800000027',
  wechat = 'demo_toys_28',
  trade_link = 'https://trade.maabar-demo.example/toys/28',
  trade_links = array['https://trade.maabar-demo.example/toys/28', 'https://maabar-demo.example/toys/catalog']::text[],
  min_order_value = 2200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2021,
  years_experience = 5,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Hangzhou Industrial Export Park, Hangzhou, China',
  company_website = 'https://maabar-demo.example/toys/28',
  company_description = 'Synthetic demo supplier in Toys. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Toys. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع ألعاب لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '玩具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Hangzhou%20Sino%20Toys%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-toys-factory-28-1/1200/900', 'https://picsum.photos/seed/maabar-toys-factory-28-2/1200/900', 'https://picsum.photos/seed/maabar-toys-factory-28-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-toys-factory-28-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 42,
  reg_number = 'DEMO-0028',
  num_employees = 35,
  maabar_supplier_id = 'MS-009028'
where email = 'seed-supplier-28@example.com';

update public.profiles set
  speciality = 'Auto Parts',
  whatsapp = '+8613800000028',
  wechat = 'demo_auto_parts_29',
  trade_link = 'https://trade.maabar-demo.example/auto_parts/29',
  trade_links = array['https://trade.maabar-demo.example/auto_parts/29', 'https://maabar-demo.example/auto_parts/catalog']::text[],
  min_order_value = 2400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2008,
  years_experience = 18,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Suzhou Industrial Export Park, Suzhou, China',
  company_website = 'https://maabar-demo.example/auto_parts/29',
  company_description = 'Synthetic demo supplier in Auto Parts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Auto Parts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع قطع غيار لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '汽车配件行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Suzhou%20GrandEast%20Auto%20Parts%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-auto_parts-factory-29-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-factory-29-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-factory-29-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-auto_parts-factory-29-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 15,
  reg_number = 'DEMO-0029',
  num_employees = 40,
  maabar_supplier_id = 'MS-009029'
where email = 'seed-supplier-29@example.com';

update public.profiles set
  speciality = 'Auto Parts',
  whatsapp = '+8613800000029',
  wechat = 'demo_auto_parts_30',
  trade_link = 'https://trade.maabar-demo.example/auto_parts/30',
  trade_links = array['https://trade.maabar-demo.example/auto_parts/30', 'https://maabar-demo.example/auto_parts/catalog']::text[],
  min_order_value = 2600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2009,
  years_experience = 17,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Qingdao Industrial Export Park, Qingdao, China',
  company_website = 'https://maabar-demo.example/auto_parts/30',
  company_description = 'Synthetic demo supplier in Auto Parts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Auto Parts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع قطع غيار لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '汽车配件行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Qingdao%20Nova%20Auto%20Parts%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-auto_parts-factory-30-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-factory-30-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-factory-30-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-auto_parts-factory-30-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 28,
  reg_number = 'DEMO-0030',
  num_employees = 45,
  maabar_supplier_id = 'MS-009030'
where email = 'seed-supplier-30@example.com';

update public.profiles set
  speciality = 'Car Accessories',
  whatsapp = '+8613800000030',
  wechat = 'demo_car_accessories_31',
  trade_link = 'https://trade.maabar-demo.example/car_accessories/31',
  trade_links = array['https://trade.maabar-demo.example/car_accessories/31', 'https://maabar-demo.example/car_accessories/catalog']::text[],
  min_order_value = 800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2010,
  years_experience = 16,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Guangzhou Industrial Export Park, Guangzhou, China',
  company_website = 'https://maabar-demo.example/car_accessories/31',
  company_description = 'Synthetic demo supplier in Car Accessories. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Car Accessories. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إكسسوارات سيارات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '汽车周边行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Guangzhou%20Orient%20Car%20Accessories%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-car_accessories-factory-31-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-factory-31-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-factory-31-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-car_accessories-factory-31-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 41,
  reg_number = 'DEMO-0031',
  num_employees = 50,
  maabar_supplier_id = 'MS-009031'
where email = 'seed-supplier-31@example.com';

update public.profiles set
  speciality = 'Car Accessories',
  whatsapp = '+8613800000031',
  wechat = 'demo_car_accessories_32',
  trade_link = 'https://trade.maabar-demo.example/car_accessories/32',
  trade_links = array['https://trade.maabar-demo.example/car_accessories/32', 'https://maabar-demo.example/car_accessories/catalog']::text[],
  min_order_value = 1000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2011,
  years_experience = 15,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Shenzhen Industrial Export Park, Shenzhen, China',
  company_website = 'https://maabar-demo.example/car_accessories/32',
  company_description = 'Synthetic demo supplier in Car Accessories. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Car Accessories. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إكسسوارات سيارات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '汽车周边行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Shenzhen%20Summit%20Car%20Accessories%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-car_accessories-factory-32-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-factory-32-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-factory-32-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-car_accessories-factory-32-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 14,
  reg_number = 'DEMO-0032',
  num_employees = 55,
  maabar_supplier_id = 'MS-009032'
where email = 'seed-supplier-32@example.com';

update public.profiles set
  speciality = 'Tires',
  whatsapp = '+8613800000032',
  wechat = 'demo_tires_33',
  trade_link = 'https://trade.maabar-demo.example/tires/33',
  trade_links = array['https://trade.maabar-demo.example/tires/33', 'https://maabar-demo.example/tires/catalog']::text[],
  min_order_value = 1200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2012,
  years_experience = 14,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Yiwu Industrial Export Park, Yiwu, China',
  company_website = 'https://maabar-demo.example/tires/33',
  company_description = 'Synthetic demo supplier in Tires. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Tires. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إطارات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '轮胎行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Yiwu%20Pacific%20Tire%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-tires-factory-33-1/1200/900', 'https://picsum.photos/seed/maabar-tires-factory-33-2/1200/900', 'https://picsum.photos/seed/maabar-tires-factory-33-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-tires-factory-33-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 27,
  reg_number = 'DEMO-0033',
  num_employees = 60,
  maabar_supplier_id = 'MS-009033'
where email = 'seed-supplier-33@example.com';

update public.profiles set
  speciality = 'Tires',
  whatsapp = '+8613800000033',
  wechat = 'demo_tires_34',
  trade_link = 'https://trade.maabar-demo.example/tires/34',
  trade_links = array['https://trade.maabar-demo.example/tires/34', 'https://maabar-demo.example/tires/catalog']::text[],
  min_order_value = 1400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2013,
  years_experience = 13,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Ningbo Industrial Export Park, Ningbo, China',
  company_website = 'https://maabar-demo.example/tires/34',
  company_description = 'Synthetic demo supplier in Tires. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Tires. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إطارات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '轮胎行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Ningbo%20Golden%20Tire%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-tires-factory-34-1/1200/900', 'https://picsum.photos/seed/maabar-tires-factory-34-2/1200/900', 'https://picsum.photos/seed/maabar-tires-factory-34-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-tires-factory-34-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 40,
  reg_number = 'DEMO-0034',
  num_employees = 65,
  maabar_supplier_id = 'MS-009034'
where email = 'seed-supplier-34@example.com';

update public.profiles set
  speciality = 'Lubricants & Oils',
  whatsapp = '+8613800000034',
  wechat = 'demo_lubricants_35',
  trade_link = 'https://trade.maabar-demo.example/lubricants/35',
  trade_links = array['https://trade.maabar-demo.example/lubricants/35', 'https://maabar-demo.example/lubricants/catalog']::text[],
  min_order_value = 1600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2014,
  years_experience = 12,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Foshan Industrial Export Park, Foshan, China',
  company_website = 'https://maabar-demo.example/lubricants/35',
  company_description = 'Synthetic demo supplier in Lubricants & Oils. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Lubricants & Oils. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع زيوت ومواد تشحيم لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '润滑油行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Foshan%20Evergreen%20Lubricants%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-lubricants-factory-35-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-factory-35-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-factory-35-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-lubricants-factory-35-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 13,
  reg_number = 'DEMO-0035',
  num_employees = 70,
  maabar_supplier_id = 'MS-009035'
where email = 'seed-supplier-35@example.com';

update public.profiles set
  speciality = 'Lubricants & Oils',
  whatsapp = '+8613800000035',
  wechat = 'demo_lubricants_36',
  trade_link = 'https://trade.maabar-demo.example/lubricants/36',
  trade_links = array['https://trade.maabar-demo.example/lubricants/36', 'https://maabar-demo.example/lubricants/catalog']::text[],
  min_order_value = 1800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2015,
  years_experience = 11,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Dongguan Industrial Export Park, Dongguan, China',
  company_website = 'https://maabar-demo.example/lubricants/36',
  company_description = 'Synthetic demo supplier in Lubricants & Oils. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Lubricants & Oils. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع زيوت ومواد تشحيم لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '润滑油行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Dongguan%20Skyline%20Lubricants%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-lubricants-factory-36-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-factory-36-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-factory-36-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-lubricants-factory-36-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 26,
  reg_number = 'DEMO-0036',
  num_employees = 75,
  maabar_supplier_id = 'MS-009036'
where email = 'seed-supplier-36@example.com';

update public.profiles set
  speciality = 'Health & Medical',
  whatsapp = '+8613800000036',
  wechat = 'demo_health_37',
  trade_link = 'https://trade.maabar-demo.example/health/37',
  trade_links = array['https://trade.maabar-demo.example/health/37', 'https://maabar-demo.example/health/catalog']::text[],
  min_order_value = 2000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2016,
  years_experience = 10,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Xiamen Industrial Export Park, Xiamen, China',
  company_website = 'https://maabar-demo.example/health/37',
  company_description = 'Synthetic demo supplier in Health & Medical. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Health & Medical. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع صحة وطب لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '健康医疗行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Xiamen%20Unison%20Medical%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-health-factory-37-1/1200/900', 'https://picsum.photos/seed/maabar-health-factory-37-2/1200/900', 'https://picsum.photos/seed/maabar-health-factory-37-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-health-factory-37-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 39,
  reg_number = 'DEMO-0037',
  num_employees = 20,
  maabar_supplier_id = 'MS-009037'
where email = 'seed-supplier-37@example.com';

update public.profiles set
  speciality = 'Health & Medical',
  whatsapp = '+8613800000037',
  wechat = 'demo_health_38',
  trade_link = 'https://trade.maabar-demo.example/health/38',
  trade_links = array['https://trade.maabar-demo.example/health/38', 'https://maabar-demo.example/health/catalog']::text[],
  min_order_value = 2200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2017,
  years_experience = 9,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Hangzhou Industrial Export Park, Hangzhou, China',
  company_website = 'https://maabar-demo.example/health/38',
  company_description = 'Synthetic demo supplier in Health & Medical. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Health & Medical. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع صحة وطب لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '健康医疗行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Hangzhou%20Brightway%20Medical%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-health-factory-38-1/1200/900', 'https://picsum.photos/seed/maabar-health-factory-38-2/1200/900', 'https://picsum.photos/seed/maabar-health-factory-38-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-health-factory-38-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 12,
  reg_number = 'DEMO-0038',
  num_employees = 25,
  maabar_supplier_id = 'MS-009038'
where email = 'seed-supplier-38@example.com';

update public.profiles set
  speciality = 'Packaging',
  whatsapp = '+8613800000038',
  wechat = 'demo_packaging_39',
  trade_link = 'https://trade.maabar-demo.example/packaging/39',
  trade_links = array['https://trade.maabar-demo.example/packaging/39', 'https://maabar-demo.example/packaging/catalog']::text[],
  min_order_value = 2400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2018,
  years_experience = 8,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Suzhou Industrial Export Park, Suzhou, China',
  company_website = 'https://maabar-demo.example/packaging/39',
  company_description = 'Synthetic demo supplier in Packaging. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Packaging. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع تعبئة وتغليف لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '包装材料行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Suzhou%20EastPort%20Packaging%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-packaging-factory-39-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-factory-39-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-factory-39-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-packaging-factory-39-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 25,
  reg_number = 'DEMO-0039',
  num_employees = 30,
  maabar_supplier_id = 'MS-009039'
where email = 'seed-supplier-39@example.com';

update public.profiles set
  speciality = 'Packaging',
  whatsapp = '+8613800000039',
  wechat = 'demo_packaging_40',
  trade_link = 'https://trade.maabar-demo.example/packaging/40',
  trade_links = array['https://trade.maabar-demo.example/packaging/40', 'https://maabar-demo.example/packaging/catalog']::text[],
  min_order_value = 2600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2019,
  years_experience = 7,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Qingdao Industrial Export Park, Qingdao, China',
  company_website = 'https://maabar-demo.example/packaging/40',
  company_description = 'Synthetic demo supplier in Packaging. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Packaging. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع تعبئة وتغليف لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '包装材料行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Qingdao%20Crownway%20Packaging%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-packaging-factory-40-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-factory-40-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-factory-40-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-packaging-factory-40-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 38,
  reg_number = 'DEMO-0040',
  num_employees = 35,
  maabar_supplier_id = 'MS-009040'
where email = 'seed-supplier-40@example.com';

update public.profiles set
  speciality = 'Gifts',
  whatsapp = '+8613800000040',
  wechat = 'demo_gifts_41',
  trade_link = 'https://trade.maabar-demo.example/gifts/41',
  trade_links = array['https://trade.maabar-demo.example/gifts/41', 'https://maabar-demo.example/gifts/catalog']::text[],
  min_order_value = 800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2020,
  years_experience = 6,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Guangzhou Industrial Export Park, Guangzhou, China',
  company_website = 'https://maabar-demo.example/gifts/41',
  company_description = 'Synthetic demo supplier in Gifts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Gifts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع هدايا لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '礼品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Guangzhou%20Maxwell%20Gifts%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-gifts-factory-41-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-factory-41-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-factory-41-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-gifts-factory-41-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 11,
  reg_number = 'DEMO-0041',
  num_employees = 40,
  maabar_supplier_id = 'MS-009041'
where email = 'seed-supplier-41@example.com';

update public.profiles set
  speciality = 'Gifts',
  whatsapp = '+8613800000041',
  wechat = 'demo_gifts_42',
  trade_link = 'https://trade.maabar-demo.example/gifts/42',
  trade_links = array['https://trade.maabar-demo.example/gifts/42', 'https://maabar-demo.example/gifts/catalog']::text[],
  min_order_value = 1000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2021,
  years_experience = 5,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Shenzhen Industrial Export Park, Shenzhen, China',
  company_website = 'https://maabar-demo.example/gifts/42',
  company_description = 'Synthetic demo supplier in Gifts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Gifts. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع هدايا لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '礼品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Shenzhen%20Silkroad%20Gifts%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-gifts-factory-42-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-factory-42-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-factory-42-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-gifts-factory-42-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 24,
  reg_number = 'DEMO-0042',
  num_employees = 45,
  maabar_supplier_id = 'MS-009042'
where email = 'seed-supplier-42@example.com';

update public.profiles set
  speciality = 'Agriculture',
  whatsapp = '+8613800000042',
  wechat = 'demo_agriculture_43',
  trade_link = 'https://trade.maabar-demo.example/agriculture/43',
  trade_links = array['https://trade.maabar-demo.example/agriculture/43', 'https://maabar-demo.example/agriculture/catalog']::text[],
  min_order_value = 1200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2008,
  years_experience = 18,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Yiwu Industrial Export Park, Yiwu, China',
  company_website = 'https://maabar-demo.example/agriculture/43',
  company_description = 'Synthetic demo supplier in Agriculture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Agriculture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع زراعة لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '农业行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Yiwu%20Harbor%20Agriculture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-agriculture-factory-43-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-factory-43-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-factory-43-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-agriculture-factory-43-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 37,
  reg_number = 'DEMO-0043',
  num_employees = 50,
  maabar_supplier_id = 'MS-009043'
where email = 'seed-supplier-43@example.com';

update public.profiles set
  speciality = 'Agriculture',
  whatsapp = '+8613800000043',
  wechat = 'demo_agriculture_44',
  trade_link = 'https://trade.maabar-demo.example/agriculture/44',
  trade_links = array['https://trade.maabar-demo.example/agriculture/44', 'https://maabar-demo.example/agriculture/catalog']::text[],
  min_order_value = 1400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2009,
  years_experience = 17,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Ningbo Industrial Export Park, Ningbo, China',
  company_website = 'https://maabar-demo.example/agriculture/44',
  company_description = 'Synthetic demo supplier in Agriculture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Agriculture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع زراعة لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '农业行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Ningbo%20Vanguard%20Agriculture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-agriculture-factory-44-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-factory-44-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-factory-44-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-agriculture-factory-44-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 50,
  reg_number = 'DEMO-0044',
  num_employees = 55,
  maabar_supplier_id = 'MS-009044'
where email = 'seed-supplier-44@example.com';

update public.profiles set
  speciality = 'Other',
  whatsapp = '+8613800000044',
  wechat = 'demo_other_45',
  trade_link = 'https://trade.maabar-demo.example/other/45',
  trade_links = array['https://trade.maabar-demo.example/other/45', 'https://maabar-demo.example/other/catalog']::text[],
  min_order_value = 1600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2010,
  years_experience = 16,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Foshan Industrial Export Park, Foshan, China',
  company_website = 'https://maabar-demo.example/other/45',
  company_description = 'Synthetic demo supplier in Other. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Other. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أخرى لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '其他行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Foshan%20Pinnacle%20Industrial%20Supplies%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-other-factory-45-1/1200/900', 'https://picsum.photos/seed/maabar-other-factory-45-2/1200/900', 'https://picsum.photos/seed/maabar-other-factory-45-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-other-factory-45-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 23,
  reg_number = 'DEMO-0045',
  num_employees = 60,
  maabar_supplier_id = 'MS-009045'
where email = 'seed-supplier-45@example.com';

update public.profiles set
  speciality = 'Other',
  whatsapp = '+8613800000045',
  wechat = 'demo_other_46',
  trade_link = 'https://trade.maabar-demo.example/other/46',
  trade_links = array['https://trade.maabar-demo.example/other/46', 'https://maabar-demo.example/other/catalog']::text[],
  min_order_value = 1800,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2011,
  years_experience = 15,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Dongguan Industrial Export Park, Dongguan, China',
  company_website = 'https://maabar-demo.example/other/46',
  company_description = 'Synthetic demo supplier in Other. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Other. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أخرى لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '其他行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Dongguan%20Trinity%20Industrial%20Supplies%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-other-factory-46-1/1200/900', 'https://picsum.photos/seed/maabar-other-factory-46-2/1200/900', 'https://picsum.photos/seed/maabar-other-factory-46-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-other-factory-46-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 36,
  reg_number = 'DEMO-0046',
  num_employees = 65,
  maabar_supplier_id = 'MS-009046'
where email = 'seed-supplier-46@example.com';

update public.profiles set
  speciality = 'Electronics',
  whatsapp = '+8613800000046',
  wechat = 'demo_electronics_47',
  trade_link = 'https://trade.maabar-demo.example/electronics/47',
  trade_links = array['https://trade.maabar-demo.example/electronics/47', 'https://maabar-demo.example/electronics/catalog']::text[],
  min_order_value = 2000,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2012,
  years_experience = 14,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Xiamen Industrial Export Park, Xiamen, China',
  company_website = 'https://maabar-demo.example/electronics/47',
  company_description = 'Synthetic demo supplier in Electronics. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Electronics. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع إلكترونيات لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '电子产品行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Xiamen%20Zenith%20Electronics%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-electronics-factory-47-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-factory-47-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-factory-47-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-electronics-factory-47-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 49,
  reg_number = 'DEMO-0047',
  num_employees = 70,
  maabar_supplier_id = 'MS-009047'
where email = 'seed-supplier-47@example.com';

update public.profiles set
  speciality = 'Home Appliances',
  whatsapp = '+8613800000047',
  wechat = 'demo_home_appliances_48',
  trade_link = 'https://trade.maabar-demo.example/home_appliances/48',
  trade_links = array['https://trade.maabar-demo.example/home_appliances/48', 'https://maabar-demo.example/home_appliances/catalog']::text[],
  min_order_value = 2200,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2013,
  years_experience = 13,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Hangzhou Industrial Export Park, Hangzhou, China',
  company_website = 'https://maabar-demo.example/home_appliances/48',
  company_description = 'Synthetic demo supplier in Home Appliances. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Home Appliances. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أجهزة منزلية لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家用电器行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Hangzhou%20Cardinal%20Home%20Appliance%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-home_appliances-factory-48-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-factory-48-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-factory-48-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-home_appliances-factory-48-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 22,
  reg_number = 'DEMO-0048',
  num_employees = 75,
  maabar_supplier_id = 'MS-009048'
where email = 'seed-supplier-48@example.com';

update public.profiles set
  speciality = 'Furniture',
  whatsapp = '+8613800000048',
  wechat = 'demo_furniture_49',
  trade_link = 'https://trade.maabar-demo.example/furniture/49',
  trade_links = array['https://trade.maabar-demo.example/furniture/49', 'https://maabar-demo.example/furniture/catalog']::text[],
  min_order_value = 2400,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2014,
  years_experience = 12,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Suzhou Industrial Export Park, Suzhou, China',
  company_website = 'https://maabar-demo.example/furniture/49',
  company_description = 'Synthetic demo supplier in Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Suzhou%20Meridian%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-furniture-factory-49-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-factory-49-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-factory-49-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-furniture-factory-49-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 35,
  reg_number = 'DEMO-0049',
  num_employees = 20,
  maabar_supplier_id = 'MS-009049'
where email = 'seed-supplier-49@example.com';

update public.profiles set
  speciality = 'Office Furniture',
  whatsapp = '+8613800000049',
  wechat = 'demo_office_furniture_50',
  trade_link = 'https://trade.maabar-demo.example/office_furniture/50',
  trade_links = array['https://trade.maabar-demo.example/office_furniture/50', 'https://maabar-demo.example/office_furniture/catalog']::text[],
  min_order_value = 2600,
  business_type = 'Manufacturer / OEM / ODM',
  year_established = 2015,
  years_experience = 11,
  languages = array['English', 'Mandarin']::text[],
  customization_support = 'Private-label packaging, logo printing, and custom specifications for bulk orders.',
  export_markets = array['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Kuwait']::text[],
  company_address = 'Qingdao Industrial Export Park, Qingdao, China',
  company_website = 'https://maabar-demo.example/office_furniture/50',
  company_description = 'Synthetic demo supplier in Office Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_en = 'Synthetic demo supplier in Office Furniture. Export-ready manufacturer for marketplace presentation only — not a real company or real documents.',
  bio_ar = 'مورد تجريبي آمن في قطاع أثاث مكتبي لعرض تجربة مَعبر فقط. لا يمثل شركة حقيقية أو وثائق حقيقية.',
  bio_zh = '办公家具行业的演示供应商，仅用于市场展示。',
  avatar_url = 'https://ui-avatars.com/api/?name=Qingdao%20Falcon%20Office%20Furniture%20Co.%2C%20Ltd.&background=101828&color=F5F7FA&bold=true&size=256',
  factory_images = array['https://picsum.photos/seed/maabar-office_furniture-factory-50-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-factory-50-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-factory-50-3/1200/900']::text[],
  factory_photo = 'https://picsum.photos/seed/maabar-office_furniture-factory-50-1/1200/900',
  preferred_display_currency = 'USD',
  onboarding_completed = true,
  rating = 4.3,
  reviews_count = 48,
  reg_number = 'DEMO-0050',
  num_employees = 25,
  maabar_supplier_id = 'MS-009050'
where email = 'seed-supplier-50@example.com';

-- ── 4. Trader profile details (by email) ─────────────────────────────────────
update public.profiles set company_name = 'Maabar Demo Trading Est.', city = 'Riyadh', country = 'Saudi Arabia', preferred_display_currency = 'SAR', lang = 'ar' where email = 'demo-trader@maabar.io';
update public.profiles set company_name = 'Najd Retail Group', city = 'Riyadh', country = 'Saudi Arabia', preferred_display_currency = 'SAR', lang = 'ar' where email = 'seed-trader-2@example.com';
update public.profiles set company_name = 'Red Sea Import House', city = 'Jeddah', country = 'Saudi Arabia', preferred_display_currency = 'SAR', lang = 'ar' where email = 'seed-trader-3@example.com';
update public.profiles set company_name = 'Gulf Eastern Traders', city = 'Dammam', country = 'Saudi Arabia', preferred_display_currency = 'SAR', lang = 'ar' where email = 'seed-trader-4@example.com';
update public.profiles set company_name = 'Haramain Supplies Co.', city = 'Mecca', country = 'Saudi Arabia', preferred_display_currency = 'SAR', lang = 'ar' where email = 'seed-trader-5@example.com';

-- ── 5. Products (4 per supplier, is_active=true) ─────────────────────────────
-- products for Maabar Demo Manufacturing Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سماعات لاسلكية برو', 'Wireless Earbuds Pro', '无线耳机Pro', 'USD', 'electronics', 100,
  'Wireless Earbuds Pro — export-grade Electronics from Maabar Demo Manufacturing Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سماعات لاسلكية برو — منتج إلكترونيات للتصدير من Maabar Demo Manufacturing Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-1-1-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-1-1-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-1-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 12.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'demo-supplier@maabar.io'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Wireless Earbuds Pro'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'demo-supplier@maabar.io'
  and lower(pr.name_en) = lower('Wireless Earbuds Pro')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شاحن سريع 65 واط', '65W Fast Charger', '65W快充', 'USD', 'electronics', 110,
  '65W Fast Charger — export-grade Electronics from Maabar Demo Manufacturing Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شاحن سريع 65 واط — منتج إلكترونيات للتصدير من Maabar Demo Manufacturing Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-1-2-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-1-2-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-2-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'demo-supplier@maabar.io'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('65W Fast Charger'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'demo-supplier@maabar.io'
  and lower(pr.name_en) = lower('65W Fast Charger')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'باور بانك 20000', 'Power Bank 20000mAh', '20000mAh充电宝', 'USD', 'electronics', 120,
  'Power Bank 20000mAh — export-grade Electronics from Maabar Demo Manufacturing Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'باور بانك 20000 — منتج إلكترونيات للتصدير من Maabar Demo Manufacturing Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-1-3-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-1-3-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-3-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 39.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'demo-supplier@maabar.io'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Power Bank 20000mAh'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 26
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'demo-supplier@maabar.io'
  and lower(pr.name_en) = lower('Power Bank 20000mAh')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكبر صوت بلوتوث', 'Portable Bluetooth Speaker', '便携蓝牙音箱', 'USD', 'electronics', 130,
  'Portable Bluetooth Speaker — export-grade Electronics from Maabar Demo Manufacturing Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكبر صوت بلوتوث — منتج إلكترونيات للتصدير من Maabar Demo Manufacturing Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-1-4-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-1-4-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-4-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-1-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'demo-supplier@maabar.io'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Portable Bluetooth Speaker'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 35
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'demo-supplier@maabar.io'
  and lower(pr.name_en) = lower('Portable Bluetooth Speaker')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Shenzhen Apex Electronics Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سماعات لاسلكية برو', 'Wireless Earbuds Pro', '无线耳机Pro', 'USD', 'electronics', 100,
  'Wireless Earbuds Pro — export-grade Electronics from Shenzhen Apex Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سماعات لاسلكية برو — منتج إلكترونيات للتصدير من Shenzhen Apex Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-2-1-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-2-1-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-1-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 12.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-02@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Wireless Earbuds Pro'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-02@example.com'
  and lower(pr.name_en) = lower('Wireless Earbuds Pro')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شاحن سريع 65 واط', '65W Fast Charger', '65W快充', 'USD', 'electronics', 110,
  '65W Fast Charger — export-grade Electronics from Shenzhen Apex Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شاحن سريع 65 واط — منتج إلكترونيات للتصدير من Shenzhen Apex Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-2-2-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-2-2-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-2-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-02@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('65W Fast Charger'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-02@example.com'
  and lower(pr.name_en) = lower('65W Fast Charger')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'باور بانك 20000', 'Power Bank 20000mAh', '20000mAh充电宝', 'USD', 'electronics', 120,
  'Power Bank 20000mAh — export-grade Electronics from Shenzhen Apex Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'باور بانك 20000 — منتج إلكترونيات للتصدير من Shenzhen Apex Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-2-3-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-2-3-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-3-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 39.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-02@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Power Bank 20000mAh'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 26
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-02@example.com'
  and lower(pr.name_en) = lower('Power Bank 20000mAh')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكبر صوت بلوتوث', 'Portable Bluetooth Speaker', '便携蓝牙音箱', 'USD', 'electronics', 130,
  'Portable Bluetooth Speaker — export-grade Electronics from Shenzhen Apex Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكبر صوت بلوتوث — منتج إلكترونيات للتصدير من Shenzhen Apex Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-2-4-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-2-4-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-4-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-2-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-02@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Portable Bluetooth Speaker'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 35
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-02@example.com'
  and lower(pr.name_en) = lower('Portable Bluetooth Speaker')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Yiwu Sino Home Appliance Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'غلاية كهربائية 1.8 لتر', '1.8L Electric Kettle', '1.8L电热水壶', 'USD', 'home_appliances', 50,
  '1.8L Electric Kettle — export-grade Home Appliances from Yiwu Sino Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'غلاية كهربائية 1.8 لتر — منتج أجهزة منزلية للتصدير من Yiwu Sino Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-3-1-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-3-1-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-1-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 27.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-03@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('1.8L Electric Kettle'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 18
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-03@example.com'
  and lower(pr.name_en) = lower('1.8L Electric Kettle')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'قلاية هوائية رقمية', 'Digital Air Fryer', '数字空气炸锅', 'USD', 'home_appliances', 55,
  'Digital Air Fryer — export-grade Home Appliances from Yiwu Sino Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'قلاية هوائية رقمية — منتج أجهزة منزلية للتصدير من Yiwu Sino Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-3-2-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-3-2-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-2-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-03@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Digital Air Fryer'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 32
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-03@example.com'
  and lower(pr.name_en) = lower('Digital Air Fryer')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خلاط عمودي 1000 واط', 'Stand Mixer 1000W', '1000W厨师机', 'USD', 'home_appliances', 60,
  'Stand Mixer 1000W — export-grade Home Appliances from Yiwu Sino Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خلاط عمودي 1000 واط — منتج أجهزة منزلية للتصدير من Yiwu Sino Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-3-3-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-3-3-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-3-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 69.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-03@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Stand Mixer 1000W'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 46
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-03@example.com'
  and lower(pr.name_en) = lower('Stand Mixer 1000W')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكنسة روبوت', 'Robot Vacuum Cleaner', '扫地机器人', 'USD', 'home_appliances', 65,
  'Robot Vacuum Cleaner — export-grade Home Appliances from Yiwu Sino Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكنسة روبوت — منتج أجهزة منزلية للتصدير من Yiwu Sino Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-3-4-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-3-4-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-4-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-3-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-03@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Robot Vacuum Cleaner'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 60
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-03@example.com'
  and lower(pr.name_en) = lower('Robot Vacuum Cleaner')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Ningbo GrandEast Home Appliance Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'غلاية كهربائية 1.8 لتر', '1.8L Electric Kettle', '1.8L电热水壶', 'USD', 'home_appliances', 50,
  '1.8L Electric Kettle — export-grade Home Appliances from Ningbo GrandEast Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'غلاية كهربائية 1.8 لتر — منتج أجهزة منزلية للتصدير من Ningbo GrandEast Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-4-1-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-4-1-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-1-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 27.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-04@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('1.8L Electric Kettle'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 18
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-04@example.com'
  and lower(pr.name_en) = lower('1.8L Electric Kettle')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'قلاية هوائية رقمية', 'Digital Air Fryer', '数字空气炸锅', 'USD', 'home_appliances', 55,
  'Digital Air Fryer — export-grade Home Appliances from Ningbo GrandEast Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'قلاية هوائية رقمية — منتج أجهزة منزلية للتصدير من Ningbo GrandEast Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-4-2-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-4-2-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-2-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-04@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Digital Air Fryer'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 32
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-04@example.com'
  and lower(pr.name_en) = lower('Digital Air Fryer')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خلاط عمودي 1000 واط', 'Stand Mixer 1000W', '1000W厨师机', 'USD', 'home_appliances', 60,
  'Stand Mixer 1000W — export-grade Home Appliances from Ningbo GrandEast Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خلاط عمودي 1000 واط — منتج أجهزة منزلية للتصدير من Ningbo GrandEast Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-4-3-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-4-3-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-3-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 69.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-04@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Stand Mixer 1000W'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 46
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-04@example.com'
  and lower(pr.name_en) = lower('Stand Mixer 1000W')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكنسة روبوت', 'Robot Vacuum Cleaner', '扫地机器人', 'USD', 'home_appliances', 65,
  'Robot Vacuum Cleaner — export-grade Home Appliances from Ningbo GrandEast Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكنسة روبوت — منتج أجهزة منزلية للتصدير من Ningbo GrandEast Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-4-4-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-4-4-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-4-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-4-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-04@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Robot Vacuum Cleaner'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 60
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-04@example.com'
  and lower(pr.name_en) = lower('Robot Vacuum Cleaner')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Foshan Nova Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كنبة قماش 3 مقاعد', '3-Seater Fabric Sofa', '三人布艺沙发', 'USD', 'furniture', 20,
  '3-Seater Fabric Sofa — export-grade Furniture from Foshan Nova Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كنبة قماش 3 مقاعد — منتج أثاث للتصدير من Foshan Nova Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-5-1-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-5-1-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-1-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 210.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-05@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Seater Fabric Sofa'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 140
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-05@example.com'
  and lower(pr.name_en) = lower('3-Seater Fabric Sofa')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم طعام 6 كراسي', '6-Seat Dining Set', '六人餐桌套装', 'USD', 'furniture', 22,
  '6-Seat Dining Set — export-grade Furniture from Foshan Nova Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم طعام 6 كراسي — منتج أثاث للتصدير من Foshan Nova Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-5-2-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-5-2-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-2-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-05@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('6-Seat Dining Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 230
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-05@example.com'
  and lower(pr.name_en) = lower('6-Seat Dining Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة بأبواب منزلقة', 'Sliding-Door Wardrobe', '移门衣柜', 'USD', 'furniture', 24,
  'Sliding-Door Wardrobe — export-grade Furniture from Foshan Nova Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة بأبواب منزلقة — منتج أثاث للتصدير من Foshan Nova Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-5-3-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-5-3-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-3-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 32,
  true, 480.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-05@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Sliding-Door Wardrobe'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 320
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-05@example.com'
  and lower(pr.name_en) = lower('Sliding-Door Wardrobe')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة قهوة عصرية', 'Modern Coffee Table', '现代茶几', 'USD', 'furniture', 26,
  'Modern Coffee Table — export-grade Furniture from Foshan Nova Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة قهوة عصرية — منتج أثاث للتصدير من Foshan Nova Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-5-4-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-5-4-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-4-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-5-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 33,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-05@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Modern Coffee Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 410
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-05@example.com'
  and lower(pr.name_en) = lower('Modern Coffee Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Dongguan Orient Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كنبة قماش 3 مقاعد', '3-Seater Fabric Sofa', '三人布艺沙发', 'USD', 'furniture', 20,
  '3-Seater Fabric Sofa — export-grade Furniture from Dongguan Orient Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كنبة قماش 3 مقاعد — منتج أثاث للتصدير من Dongguan Orient Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-6-1-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-6-1-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-1-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 210.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-06@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Seater Fabric Sofa'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 140
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-06@example.com'
  and lower(pr.name_en) = lower('3-Seater Fabric Sofa')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم طعام 6 كراسي', '6-Seat Dining Set', '六人餐桌套装', 'USD', 'furniture', 22,
  '6-Seat Dining Set — export-grade Furniture from Dongguan Orient Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم طعام 6 كراسي — منتج أثاث للتصدير من Dongguan Orient Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-6-2-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-6-2-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-2-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-06@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('6-Seat Dining Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 230
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-06@example.com'
  and lower(pr.name_en) = lower('6-Seat Dining Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة بأبواب منزلقة', 'Sliding-Door Wardrobe', '移门衣柜', 'USD', 'furniture', 24,
  'Sliding-Door Wardrobe — export-grade Furniture from Dongguan Orient Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة بأبواب منزلقة — منتج أثاث للتصدير من Dongguan Orient Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-6-3-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-6-3-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-3-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 32,
  true, 480.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-06@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Sliding-Door Wardrobe'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 320
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-06@example.com'
  and lower(pr.name_en) = lower('Sliding-Door Wardrobe')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة قهوة عصرية', 'Modern Coffee Table', '现代茶几', 'USD', 'furniture', 26,
  'Modern Coffee Table — export-grade Furniture from Dongguan Orient Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة قهوة عصرية — منتج أثاث للتصدير من Dongguan Orient Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-6-4-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-6-4-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-4-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-6-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 33,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-06@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Modern Coffee Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 410
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-06@example.com'
  and lower(pr.name_en) = lower('Modern Coffee Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Xiamen Summit Office Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرسي مكتب مريح', 'Ergonomic Office Chair', '人体工学办公椅', 'USD', 'office_furniture', 15,
  'Ergonomic Office Chair — export-grade Office Furniture from Xiamen Summit Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرسي مكتب مريح — منتج أثاث مكتبي للتصدير من Xiamen Summit Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-7-1-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-7-1-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-1-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  true, 120.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-07@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Ergonomic Office Chair'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 80
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-07@example.com'
  and lower(pr.name_en) = lower('Ergonomic Office Chair')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكتب تنفيذي', 'Executive Office Desk', '行政办公桌', 'USD', 'office_furniture', 17,
  'Executive Office Desk — export-grade Office Furniture from Xiamen Summit Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكتب تنفيذي — منتج أثاث مكتبي للتصدير من Xiamen Summit Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-7-2-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-7-2-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-2-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 29,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-07@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Executive Office Desk'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 140
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-07@example.com'
  and lower(pr.name_en) = lower('Executive Office Desk')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة ملفات 3 أدراج', '3-Drawer Filing Cabinet', '三抽文件柜', 'USD', 'office_furniture', 19,
  '3-Drawer Filing Cabinet — export-grade Office Furniture from Xiamen Summit Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة ملفات 3 أدراج — منتج أثاث مكتبي للتصدير من Xiamen Summit Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-7-3-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-7-3-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-3-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 300.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-07@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Drawer Filing Cabinet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 200
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-07@example.com'
  and lower(pr.name_en) = lower('3-Drawer Filing Cabinet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة اجتماعات', 'Conference Meeting Table', '会议桌', 'USD', 'office_furniture', 21,
  'Conference Meeting Table — export-grade Office Furniture from Xiamen Summit Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة اجتماعات — منتج أثاث مكتبي للتصدير من Xiamen Summit Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-7-4-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-7-4-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-4-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-7-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-07@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Conference Meeting Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 260
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-07@example.com'
  and lower(pr.name_en) = lower('Conference Meeting Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Hangzhou Pacific Office Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرسي مكتب مريح', 'Ergonomic Office Chair', '人体工学办公椅', 'USD', 'office_furniture', 15,
  'Ergonomic Office Chair — export-grade Office Furniture from Hangzhou Pacific Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرسي مكتب مريح — منتج أثاث مكتبي للتصدير من Hangzhou Pacific Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-8-1-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-8-1-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-1-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  true, 120.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-08@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Ergonomic Office Chair'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 80
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-08@example.com'
  and lower(pr.name_en) = lower('Ergonomic Office Chair')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكتب تنفيذي', 'Executive Office Desk', '行政办公桌', 'USD', 'office_furniture', 17,
  'Executive Office Desk — export-grade Office Furniture from Hangzhou Pacific Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكتب تنفيذي — منتج أثاث مكتبي للتصدير من Hangzhou Pacific Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-8-2-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-8-2-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-2-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 29,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-08@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Executive Office Desk'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 140
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-08@example.com'
  and lower(pr.name_en) = lower('Executive Office Desk')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة ملفات 3 أدراج', '3-Drawer Filing Cabinet', '三抽文件柜', 'USD', 'office_furniture', 19,
  '3-Drawer Filing Cabinet — export-grade Office Furniture from Hangzhou Pacific Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة ملفات 3 أدراج — منتج أثاث مكتبي للتصدير من Hangzhou Pacific Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-8-3-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-8-3-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-3-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 300.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-08@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Drawer Filing Cabinet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 200
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-08@example.com'
  and lower(pr.name_en) = lower('3-Drawer Filing Cabinet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة اجتماعات', 'Conference Meeting Table', '会议桌', 'USD', 'office_furniture', 21,
  'Conference Meeting Table — export-grade Office Furniture from Hangzhou Pacific Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة اجتماعات — منتج أثاث مكتبي للتصدير من Hangzhou Pacific Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-8-4-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-8-4-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-4-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-8-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-08@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Conference Meeting Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 260
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-08@example.com'
  and lower(pr.name_en) = lower('Conference Meeting Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Suzhou Golden Bedroom Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سرير منجد', 'Upholstered Bed Frame', '软包床架', 'USD', 'bedroom_furniture', 12,
  'Upholstered Bed Frame — export-grade Bedroom Furniture from Suzhou Golden Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سرير منجد — منتج أثاث غرف النوم للتصدير من Suzhou Golden Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-1-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-9-1-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-1-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 180.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-09@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Upholstered Bed Frame'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 120
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-09@example.com'
  and lower(pr.name_en) = lower('Upholstered Bed Frame')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كومودينو جانبي', 'Bedside Nightstand', '床头柜', 'USD', 'bedroom_furniture', 13,
  'Bedside Nightstand — export-grade Bedroom Furniture from Suzhou Golden Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كومودينو جانبي — منتج أثاث غرف النوم للتصدير من Suzhou Golden Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-2-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-9-2-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-2-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-09@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Bedside Nightstand'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 190
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-09@example.com'
  and lower(pr.name_en) = lower('Bedside Nightstand')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'تسريحة بمرآة', 'Dresser with Mirror', '带镜梳妆台', 'USD', 'bedroom_furniture', 14,
  'Dresser with Mirror — export-grade Bedroom Furniture from Suzhou Golden Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'تسريحة بمرآة — منتج أثاث غرف النوم للتصدير من Suzhou Golden Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-3-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-9-3-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-3-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 32,
  true, 390.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-09@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Dresser with Mirror'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 260
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-09@example.com'
  and lower(pr.name_en) = lower('Dresser with Mirror')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مرتبة إسفنجية', 'Memory Foam Mattress', '记忆棉床垫', 'USD', 'bedroom_furniture', 15,
  'Memory Foam Mattress — export-grade Bedroom Furniture from Suzhou Golden Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مرتبة إسفنجية — منتج أثاث غرف النوم للتصدير من Suzhou Golden Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-4-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-9-4-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-4-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-9-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 33,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-09@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Memory Foam Mattress'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 330
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-09@example.com'
  and lower(pr.name_en) = lower('Memory Foam Mattress')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Qingdao Evergreen Bedroom Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سرير منجد', 'Upholstered Bed Frame', '软包床架', 'USD', 'bedroom_furniture', 12,
  'Upholstered Bed Frame — export-grade Bedroom Furniture from Qingdao Evergreen Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سرير منجد — منتج أثاث غرف النوم للتصدير من Qingdao Evergreen Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-1-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-10-1-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-1-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 180.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-10@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Upholstered Bed Frame'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 120
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-10@example.com'
  and lower(pr.name_en) = lower('Upholstered Bed Frame')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كومودينو جانبي', 'Bedside Nightstand', '床头柜', 'USD', 'bedroom_furniture', 13,
  'Bedside Nightstand — export-grade Bedroom Furniture from Qingdao Evergreen Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كومودينو جانبي — منتج أثاث غرف النوم للتصدير من Qingdao Evergreen Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-2-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-10-2-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-2-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-10@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Bedside Nightstand'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 190
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-10@example.com'
  and lower(pr.name_en) = lower('Bedside Nightstand')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'تسريحة بمرآة', 'Dresser with Mirror', '带镜梳妆台', 'USD', 'bedroom_furniture', 14,
  'Dresser with Mirror — export-grade Bedroom Furniture from Qingdao Evergreen Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'تسريحة بمرآة — منتج أثاث غرف النوم للتصدير من Qingdao Evergreen Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-3-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-10-3-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-3-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 32,
  true, 390.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-10@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Dresser with Mirror'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 260
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-10@example.com'
  and lower(pr.name_en) = lower('Dresser with Mirror')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مرتبة إسفنجية', 'Memory Foam Mattress', '记忆棉床垫', 'USD', 'bedroom_furniture', 15,
  'Memory Foam Mattress — export-grade Bedroom Furniture from Qingdao Evergreen Bedroom Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مرتبة إسفنجية — منتج أثاث غرف النوم للتصدير من Qingdao Evergreen Bedroom Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-4-1/1200/900', array['https://picsum.photos/seed/maabar-bedroom_furniture-10-4-1/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-4-2/1200/900', 'https://picsum.photos/seed/maabar-bedroom_furniture-10-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 33,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-10@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Memory Foam Mattress'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 330
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-10@example.com'
  and lower(pr.name_en) = lower('Memory Foam Mattress')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Guangzhou Skyline Kitchen Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة مطبخ معيارية', 'Modular Kitchen Cabinet', '整体橱柜', 'USD', 'kitchen_furniture', 10,
  'Modular Kitchen Cabinet — export-grade Kitchen Furniture from Guangzhou Skyline Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة مطبخ معيارية — منتج أثاث المطبخ للتصدير من Guangzhou Skyline Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-1-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-11-1-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-1-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 35,
  true, 240.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-11@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Modular Kitchen Cabinet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 160
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-11@example.com'
  and lower(pr.name_en) = lower('Modular Kitchen Cabinet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'جزيرة مطبخ', 'Kitchen Island Unit', '厨房中岛', 'USD', 'kitchen_furniture', 11,
  'Kitchen Island Unit — export-grade Kitchen Furniture from Guangzhou Skyline Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'جزيرة مطبخ — منتج أثاث المطبخ للتصدير من Guangzhou Skyline Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-2-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-11-2-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-2-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 36,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-11@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Kitchen Island Unit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 280
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-11@example.com'
  and lower(pr.name_en) = lower('Kitchen Island Unit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'وحدة تخزين مؤن', 'Pantry Storage Unit', '餐边储物柜', 'USD', 'kitchen_furniture', 12,
  'Pantry Storage Unit — export-grade Kitchen Furniture from Guangzhou Skyline Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'وحدة تخزين مؤن — منتج أثاث المطبخ للتصدير من Guangzhou Skyline Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-3-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-11-3-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-3-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 37,
  true, 600.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-11@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Pantry Storage Unit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 400
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-11@example.com'
  and lower(pr.name_en) = lower('Pantry Storage Unit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سطح عمل ستانلس', 'Stainless Steel Worktop', '不锈钢台面', 'USD', 'kitchen_furniture', 13,
  'Stainless Steel Worktop — export-grade Kitchen Furniture from Guangzhou Skyline Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سطح عمل ستانلس — منتج أثاث المطبخ للتصدير من Guangzhou Skyline Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-4-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-11-4-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-4-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-11-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 38,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-11@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Stainless Steel Worktop'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 520
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-11@example.com'
  and lower(pr.name_en) = lower('Stainless Steel Worktop')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Shenzhen Unison Kitchen Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة مطبخ معيارية', 'Modular Kitchen Cabinet', '整体橱柜', 'USD', 'kitchen_furniture', 10,
  'Modular Kitchen Cabinet — export-grade Kitchen Furniture from Shenzhen Unison Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة مطبخ معيارية — منتج أثاث المطبخ للتصدير من Shenzhen Unison Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-1-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-12-1-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-1-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 35,
  true, 240.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-12@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Modular Kitchen Cabinet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 160
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-12@example.com'
  and lower(pr.name_en) = lower('Modular Kitchen Cabinet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'جزيرة مطبخ', 'Kitchen Island Unit', '厨房中岛', 'USD', 'kitchen_furniture', 11,
  'Kitchen Island Unit — export-grade Kitchen Furniture from Shenzhen Unison Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'جزيرة مطبخ — منتج أثاث المطبخ للتصدير من Shenzhen Unison Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-2-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-12-2-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-2-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 36,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-12@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Kitchen Island Unit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 280
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-12@example.com'
  and lower(pr.name_en) = lower('Kitchen Island Unit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'وحدة تخزين مؤن', 'Pantry Storage Unit', '餐边储物柜', 'USD', 'kitchen_furniture', 12,
  'Pantry Storage Unit — export-grade Kitchen Furniture from Shenzhen Unison Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'وحدة تخزين مؤن — منتج أثاث المطبخ للتصدير من Shenzhen Unison Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-3-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-12-3-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-3-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 37,
  true, 600.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-12@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Pantry Storage Unit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 400
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-12@example.com'
  and lower(pr.name_en) = lower('Pantry Storage Unit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سطح عمل ستانلس', 'Stainless Steel Worktop', '不锈钢台面', 'USD', 'kitchen_furniture', 13,
  'Stainless Steel Worktop — export-grade Kitchen Furniture from Shenzhen Unison Kitchen Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سطح عمل ستانلس — منتج أثاث المطبخ للتصدير من Shenzhen Unison Kitchen Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-4-1/1200/900', array['https://picsum.photos/seed/maabar-kitchen_furniture-12-4-1/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-4-2/1200/900', 'https://picsum.photos/seed/maabar-kitchen_furniture-12-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 38,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-12@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Stainless Steel Worktop'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 520
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-12@example.com'
  and lower(pr.name_en) = lower('Stainless Steel Worktop')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Yiwu Brightway Outdoor Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم حديقة روطان', 'Rattan Patio Set', '藤编户外套装', 'USD', 'outdoor_furniture', 20,
  'Rattan Patio Set — export-grade Outdoor Furniture from Yiwu Brightway Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم حديقة روطان — منتج أثاث خارجي للتصدير من Yiwu Brightway Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-1-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-13-1-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-1-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 25,
  true, 90.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-13@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Rattan Patio Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 60
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-13@example.com'
  and lower(pr.name_en) = lower('Rattan Patio Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مظلة حديقة', 'Garden Sun Umbrella', '户外遮阳伞', 'USD', 'outdoor_furniture', 22,
  'Garden Sun Umbrella — export-grade Outdoor Furniture from Yiwu Brightway Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مظلة حديقة — منتج أثاث خارجي للتصدير من Yiwu Brightway Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-2-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-13-2-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-2-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 26,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-13@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Garden Sun Umbrella'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 105
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-13@example.com'
  and lower(pr.name_en) = lower('Garden Sun Umbrella')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرسي استرخاء خارجي', 'Outdoor Lounge Chair', '户外躺椅', 'USD', 'outdoor_furniture', 24,
  'Outdoor Lounge Chair — export-grade Outdoor Furniture from Yiwu Brightway Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرسي استرخاء خارجي — منتج أثاث خارجي للتصدير من Yiwu Brightway Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-3-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-13-3-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-3-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 27,
  true, 225.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-13@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Outdoor Lounge Chair'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 150
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-13@example.com'
  and lower(pr.name_en) = lower('Outdoor Lounge Chair')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة نزهة قابلة للطي', 'Folding Picnic Table', '折叠野餐桌', 'USD', 'outdoor_furniture', 26,
  'Folding Picnic Table — export-grade Outdoor Furniture from Yiwu Brightway Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة نزهة قابلة للطي — منتج أثاث خارجي للتصدير من Yiwu Brightway Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-4-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-13-4-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-4-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-13-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-13@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Folding Picnic Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 195
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-13@example.com'
  and lower(pr.name_en) = lower('Folding Picnic Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Ningbo EastPort Outdoor Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم حديقة روطان', 'Rattan Patio Set', '藤编户外套装', 'USD', 'outdoor_furniture', 20,
  'Rattan Patio Set — export-grade Outdoor Furniture from Ningbo EastPort Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم حديقة روطان — منتج أثاث خارجي للتصدير من Ningbo EastPort Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-1-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-14-1-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-1-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 25,
  true, 90.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-14@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Rattan Patio Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 60
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-14@example.com'
  and lower(pr.name_en) = lower('Rattan Patio Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مظلة حديقة', 'Garden Sun Umbrella', '户外遮阳伞', 'USD', 'outdoor_furniture', 22,
  'Garden Sun Umbrella — export-grade Outdoor Furniture from Ningbo EastPort Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مظلة حديقة — منتج أثاث خارجي للتصدير من Ningbo EastPort Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-2-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-14-2-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-2-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 26,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-14@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Garden Sun Umbrella'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 105
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-14@example.com'
  and lower(pr.name_en) = lower('Garden Sun Umbrella')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرسي استرخاء خارجي', 'Outdoor Lounge Chair', '户外躺椅', 'USD', 'outdoor_furniture', 24,
  'Outdoor Lounge Chair — export-grade Outdoor Furniture from Ningbo EastPort Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرسي استرخاء خارجي — منتج أثاث خارجي للتصدير من Ningbo EastPort Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-3-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-14-3-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-3-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 27,
  true, 225.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-14@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Outdoor Lounge Chair'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 150
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-14@example.com'
  and lower(pr.name_en) = lower('Outdoor Lounge Chair')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة نزهة قابلة للطي', 'Folding Picnic Table', '折叠野餐桌', 'USD', 'outdoor_furniture', 26,
  'Folding Picnic Table — export-grade Outdoor Furniture from Ningbo EastPort Outdoor Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة نزهة قابلة للطي — منتج أثاث خارجي للتصدير من Ningbo EastPort Outdoor Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-4-1/1200/900', array['https://picsum.photos/seed/maabar-outdoor_furniture-14-4-1/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-4-2/1200/900', 'https://picsum.photos/seed/maabar-outdoor_furniture-14-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-14@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Folding Picnic Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 195
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-14@example.com'
  and lower(pr.name_en) = lower('Folding Picnic Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Foshan Crownway Home Décor Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'لوحات جدارية', 'Wall Art Canvas Set', '装饰画套装', 'USD', 'home_decor', 80,
  'Wall Art Canvas Set — export-grade Home Décor from Foshan Crownway Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'لوحات جدارية — منتج ديكور منزلي للتصدير من Foshan Crownway Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-15-1-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-15-1-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-1-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 18.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-15@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Wall Art Canvas Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 12
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-15@example.com'
  and lower(pr.name_en) = lower('Wall Art Canvas Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مزهرية أرضية', 'Decorative Floor Vase', '落地花瓶', 'USD', 'home_decor', 88,
  'Decorative Floor Vase — export-grade Home Décor from Foshan Crownway Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مزهرية أرضية — منتج ديكور منزلي للتصدير من Foshan Crownway Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-15-2-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-15-2-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-2-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-15@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Decorative Floor Vase'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 22
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-15@example.com'
  and lower(pr.name_en) = lower('Decorative Floor Vase')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سجادة منسوجة', 'Woven Area Rug', '编织地毯', 'USD', 'home_decor', 96,
  'Woven Area Rug — export-grade Home Décor from Foshan Crownway Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سجادة منسوجة — منتج ديكور منزلي للتصدير من Foshan Crownway Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-15-3-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-15-3-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-3-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 48.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-15@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Woven Area Rug'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 32
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-15@example.com'
  and lower(pr.name_en) = lower('Woven Area Rug')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شموع معطرة', 'Scented Candle Set', '香薰蜡烛套装', 'USD', 'home_decor', 104,
  'Scented Candle Set — export-grade Home Décor from Foshan Crownway Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شموع معطرة — منتج ديكور منزلي للتصدير من Foshan Crownway Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-15-4-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-15-4-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-4-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-15-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-15@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Scented Candle Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 42
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-15@example.com'
  and lower(pr.name_en) = lower('Scented Candle Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Dongguan Maxwell Home Décor Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'لوحات جدارية', 'Wall Art Canvas Set', '装饰画套装', 'USD', 'home_decor', 80,
  'Wall Art Canvas Set — export-grade Home Décor from Dongguan Maxwell Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'لوحات جدارية — منتج ديكور منزلي للتصدير من Dongguan Maxwell Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-16-1-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-16-1-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-1-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 18.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-16@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Wall Art Canvas Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 12
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-16@example.com'
  and lower(pr.name_en) = lower('Wall Art Canvas Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مزهرية أرضية', 'Decorative Floor Vase', '落地花瓶', 'USD', 'home_decor', 88,
  'Decorative Floor Vase — export-grade Home Décor from Dongguan Maxwell Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مزهرية أرضية — منتج ديكور منزلي للتصدير من Dongguan Maxwell Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-16-2-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-16-2-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-2-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-16@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Decorative Floor Vase'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 22
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-16@example.com'
  and lower(pr.name_en) = lower('Decorative Floor Vase')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سجادة منسوجة', 'Woven Area Rug', '编织地毯', 'USD', 'home_decor', 96,
  'Woven Area Rug — export-grade Home Décor from Dongguan Maxwell Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سجادة منسوجة — منتج ديكور منزلي للتصدير من Dongguan Maxwell Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-16-3-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-16-3-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-3-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 48.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-16@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Woven Area Rug'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 32
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-16@example.com'
  and lower(pr.name_en) = lower('Woven Area Rug')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شموع معطرة', 'Scented Candle Set', '香薰蜡烛套装', 'USD', 'home_decor', 104,
  'Scented Candle Set — export-grade Home Décor from Dongguan Maxwell Home Décor Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شموع معطرة — منتج ديكور منزلي للتصدير من Dongguan Maxwell Home Décor Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_decor-16-4-1/1200/900', array['https://picsum.photos/seed/maabar-home_decor-16-4-1/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-4-2/1200/900', 'https://picsum.photos/seed/maabar-home_decor-16-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-16@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Scented Candle Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 42
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-16@example.com'
  and lower(pr.name_en) = lower('Scented Candle Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Xiamen Silkroad Apparel Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'تيشيرت قطن بالجملة', 'Cotton T-Shirt (Bulk)', '纯棉T恤', 'USD', 'clothing', 300,
  'Cotton T-Shirt (Bulk) — export-grade Clothing from Xiamen Silkroad Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'تيشيرت قطن بالجملة — منتج ملابس للتصدير من Xiamen Silkroad Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-17-1-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-17-1-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-1-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 6.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-17@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Cotton T-Shirt (Bulk)'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 4
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-17@example.com'
  and lower(pr.name_en) = lower('Cotton T-Shirt (Bulk)')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم عباية مطرزة', 'Embroidered Abaya Set', '刺绣阿巴雅', 'USD', 'clothing', 330,
  'Embroidered Abaya Set — export-grade Clothing from Xiamen Silkroad Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم عباية مطرزة — منتج ملابس للتصدير من Xiamen Silkroad Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-17-2-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-17-2-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-2-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-17@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Embroidered Abaya Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 9
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-17@example.com'
  and lower(pr.name_en) = lower('Embroidered Abaya Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'بدلة رياضية', 'Activewear Tracksuit', '运动套装', 'USD', 'clothing', 360,
  'Activewear Tracksuit — export-grade Clothing from Xiamen Silkroad Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'بدلة رياضية — منتج ملابس للتصدير من Xiamen Silkroad Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-17-3-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-17-3-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-3-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 21.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-17@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Activewear Tracksuit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 14
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-17@example.com'
  and lower(pr.name_en) = lower('Activewear Tracksuit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'جاكيت شتوي', 'Padded Winter Jacket', '加棉冬季外套', 'USD', 'clothing', 390,
  'Padded Winter Jacket — export-grade Clothing from Xiamen Silkroad Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'جاكيت شتوي — منتج ملابس للتصدير من Xiamen Silkroad Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-17-4-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-17-4-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-4-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-17-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-17@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Padded Winter Jacket'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 19
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-17@example.com'
  and lower(pr.name_en) = lower('Padded Winter Jacket')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Hangzhou Harbor Apparel Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'تيشيرت قطن بالجملة', 'Cotton T-Shirt (Bulk)', '纯棉T恤', 'USD', 'clothing', 300,
  'Cotton T-Shirt (Bulk) — export-grade Clothing from Hangzhou Harbor Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'تيشيرت قطن بالجملة — منتج ملابس للتصدير من Hangzhou Harbor Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-18-1-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-18-1-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-1-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 6.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-18@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Cotton T-Shirt (Bulk)'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 4
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-18@example.com'
  and lower(pr.name_en) = lower('Cotton T-Shirt (Bulk)')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم عباية مطرزة', 'Embroidered Abaya Set', '刺绣阿巴雅', 'USD', 'clothing', 330,
  'Embroidered Abaya Set — export-grade Clothing from Hangzhou Harbor Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم عباية مطرزة — منتج ملابس للتصدير من Hangzhou Harbor Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-18-2-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-18-2-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-2-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-18@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Embroidered Abaya Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 9
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-18@example.com'
  and lower(pr.name_en) = lower('Embroidered Abaya Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'بدلة رياضية', 'Activewear Tracksuit', '运动套装', 'USD', 'clothing', 360,
  'Activewear Tracksuit — export-grade Clothing from Hangzhou Harbor Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'بدلة رياضية — منتج ملابس للتصدير من Hangzhou Harbor Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-18-3-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-18-3-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-3-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 21.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-18@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Activewear Tracksuit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 14
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-18@example.com'
  and lower(pr.name_en) = lower('Activewear Tracksuit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'جاكيت شتوي', 'Padded Winter Jacket', '加棉冬季外套', 'USD', 'clothing', 390,
  'Padded Winter Jacket — export-grade Clothing from Hangzhou Harbor Apparel Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'جاكيت شتوي — منتج ملابس للتصدير من Hangzhou Harbor Apparel Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-clothing-18-4-1/1200/900', array['https://picsum.photos/seed/maabar-clothing-18-4-1/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-4-2/1200/900', 'https://picsum.photos/seed/maabar-clothing-18-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-18@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Padded Winter Jacket'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 19
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-18@example.com'
  and lower(pr.name_en) = lower('Padded Winter Jacket')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Suzhou Vanguard Building Materials Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'بلاط بورسلين', 'Porcelain Floor Tiles', '瓷砖', 'USD', 'building', 500,
  'Porcelain Floor Tiles — export-grade Building Materials from Suzhou Vanguard Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'بلاط بورسلين — منتج مواد بناء للتصدير من Suzhou Vanguard Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-19-1-1/1200/900', array['https://picsum.photos/seed/maabar-building-19-1-1/1200/900', 'https://picsum.photos/seed/maabar-building-19-1-2/1200/900', 'https://picsum.photos/seed/maabar-building-19-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 4.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-19@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Porcelain Floor Tiles'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-19@example.com'
  and lower(pr.name_en) = lower('Porcelain Floor Tiles')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'ألواح جدران PVC', 'PVC Wall Panels', 'PVC墙板', 'USD', 'building', 550,
  'PVC Wall Panels — export-grade Building Materials from Suzhou Vanguard Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'ألواح جدران PVC — منتج مواد بناء للتصدير من Suzhou Vanguard Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-19-2-1/1200/900', array['https://picsum.photos/seed/maabar-building-19-2-1/1200/900', 'https://picsum.photos/seed/maabar-building-19-2-2/1200/900', 'https://picsum.photos/seed/maabar-building-19-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-19@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('PVC Wall Panels'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 9
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-19@example.com'
  and lower(pr.name_en) = lower('PVC Wall Panels')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مقاطع نوافذ ألمنيوم', 'Aluminum Window Profiles', '铝合金型材', 'USD', 'building', 600,
  'Aluminum Window Profiles — export-grade Building Materials from Suzhou Vanguard Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مقاطع نوافذ ألمنيوم — منتج مواد بناء للتصدير من Suzhou Vanguard Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-19-3-1/1200/900', array['https://picsum.photos/seed/maabar-building-19-3-1/1200/900', 'https://picsum.photos/seed/maabar-building-19-3-2/1200/900', 'https://picsum.photos/seed/maabar-building-19-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 24,
  true, 22.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-19@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Aluminum Window Profiles'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 15
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-19@example.com'
  and lower(pr.name_en) = lower('Aluminum Window Profiles')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'عازل مائي', 'Waterproof Membrane Roll', '防水卷材', 'USD', 'building', 650,
  'Waterproof Membrane Roll — export-grade Building Materials from Suzhou Vanguard Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'عازل مائي — منتج مواد بناء للتصدير من Suzhou Vanguard Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-19-4-1/1200/900', array['https://picsum.photos/seed/maabar-building-19-4-1/1200/900', 'https://picsum.photos/seed/maabar-building-19-4-2/1200/900', 'https://picsum.photos/seed/maabar-building-19-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 25,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-19@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Waterproof Membrane Roll'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 21
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-19@example.com'
  and lower(pr.name_en) = lower('Waterproof Membrane Roll')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Qingdao Pinnacle Building Materials Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'بلاط بورسلين', 'Porcelain Floor Tiles', '瓷砖', 'USD', 'building', 500,
  'Porcelain Floor Tiles — export-grade Building Materials from Qingdao Pinnacle Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'بلاط بورسلين — منتج مواد بناء للتصدير من Qingdao Pinnacle Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-20-1-1/1200/900', array['https://picsum.photos/seed/maabar-building-20-1-1/1200/900', 'https://picsum.photos/seed/maabar-building-20-1-2/1200/900', 'https://picsum.photos/seed/maabar-building-20-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 4.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-20@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Porcelain Floor Tiles'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-20@example.com'
  and lower(pr.name_en) = lower('Porcelain Floor Tiles')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'ألواح جدران PVC', 'PVC Wall Panels', 'PVC墙板', 'USD', 'building', 550,
  'PVC Wall Panels — export-grade Building Materials from Qingdao Pinnacle Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'ألواح جدران PVC — منتج مواد بناء للتصدير من Qingdao Pinnacle Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-20-2-1/1200/900', array['https://picsum.photos/seed/maabar-building-20-2-1/1200/900', 'https://picsum.photos/seed/maabar-building-20-2-2/1200/900', 'https://picsum.photos/seed/maabar-building-20-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-20@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('PVC Wall Panels'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 9
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-20@example.com'
  and lower(pr.name_en) = lower('PVC Wall Panels')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مقاطع نوافذ ألمنيوم', 'Aluminum Window Profiles', '铝合金型材', 'USD', 'building', 600,
  'Aluminum Window Profiles — export-grade Building Materials from Qingdao Pinnacle Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مقاطع نوافذ ألمنيوم — منتج مواد بناء للتصدير من Qingdao Pinnacle Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-20-3-1/1200/900', array['https://picsum.photos/seed/maabar-building-20-3-1/1200/900', 'https://picsum.photos/seed/maabar-building-20-3-2/1200/900', 'https://picsum.photos/seed/maabar-building-20-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 24,
  true, 22.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-20@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Aluminum Window Profiles'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 15
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-20@example.com'
  and lower(pr.name_en) = lower('Aluminum Window Profiles')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'عازل مائي', 'Waterproof Membrane Roll', '防水卷材', 'USD', 'building', 650,
  'Waterproof Membrane Roll — export-grade Building Materials from Qingdao Pinnacle Building Materials Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'عازل مائي — منتج مواد بناء للتصدير من Qingdao Pinnacle Building Materials Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-building-20-4-1/1200/900', array['https://picsum.photos/seed/maabar-building-20-4-1/1200/900', 'https://picsum.photos/seed/maabar-building-20-4-2/1200/900', 'https://picsum.photos/seed/maabar-building-20-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 25,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-20@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Waterproof Membrane Roll'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 21
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-20@example.com'
  and lower(pr.name_en) = lower('Waterproof Membrane Roll')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Guangzhou Trinity Food Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'تمور فاخرة', 'Premium Date Gift Pack', '精品椰枣礼盒', 'USD', 'food', 200,
  'Premium Date Gift Pack — export-grade Food from Guangzhou Trinity Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'تمور فاخرة — منتج غذاء للتصدير من Guangzhou Trinity Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-21-1-1/1200/900', array['https://picsum.photos/seed/maabar-food-21-1-1/1200/900', 'https://picsum.photos/seed/maabar-food-21-1-2/1200/900', 'https://picsum.photos/seed/maabar-food-21-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 12,
  true, 9.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-21@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Premium Date Gift Pack'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 6
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-21@example.com'
  and lower(pr.name_en) = lower('Premium Date Gift Pack')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت زيتون بكر', 'Extra-Virgin Olive Oil', '特级初榨橄榄油', 'USD', 'food', 220,
  'Extra-Virgin Olive Oil — export-grade Food from Guangzhou Trinity Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت زيتون بكر — منتج غذاء للتصدير من Guangzhou Trinity Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-21-2-1/1200/900', array['https://picsum.photos/seed/maabar-food-21-2-1/1200/900', 'https://picsum.photos/seed/maabar-food-21-2-2/1200/900', 'https://picsum.photos/seed/maabar-food-21-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 13,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-21@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Extra-Virgin Olive Oil'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 13
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-21@example.com'
  and lower(pr.name_en) = lower('Extra-Virgin Olive Oil')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكسرات مشكلة', 'Mixed Nuts (Bulk)', '混合坚果', 'USD', 'food', 240,
  'Mixed Nuts (Bulk) — export-grade Food from Guangzhou Trinity Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكسرات مشكلة — منتج غذاء للتصدير من Guangzhou Trinity Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-21-3-1/1200/900', array['https://picsum.photos/seed/maabar-food-21-3-1/1200/900', 'https://picsum.photos/seed/maabar-food-21-3-2/1200/900', 'https://picsum.photos/seed/maabar-food-21-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 14,
  true, 30.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-21@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Mixed Nuts (Bulk)'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 20
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-21@example.com'
  and lower(pr.name_en) = lower('Mixed Nuts (Bulk)')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'حبوب قهوة مختصة', 'Specialty Coffee Beans', '精品咖啡豆', 'USD', 'food', 260,
  'Specialty Coffee Beans — export-grade Food from Guangzhou Trinity Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'حبوب قهوة مختصة — منتج غذاء للتصدير من Guangzhou Trinity Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-21-4-1/1200/900', array['https://picsum.photos/seed/maabar-food-21-4-1/1200/900', 'https://picsum.photos/seed/maabar-food-21-4-2/1200/900', 'https://picsum.photos/seed/maabar-food-21-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-21@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Specialty Coffee Beans'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 27
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-21@example.com'
  and lower(pr.name_en) = lower('Specialty Coffee Beans')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Shenzhen Zenith Food Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'تمور فاخرة', 'Premium Date Gift Pack', '精品椰枣礼盒', 'USD', 'food', 200,
  'Premium Date Gift Pack — export-grade Food from Shenzhen Zenith Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'تمور فاخرة — منتج غذاء للتصدير من Shenzhen Zenith Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-22-1-1/1200/900', array['https://picsum.photos/seed/maabar-food-22-1-1/1200/900', 'https://picsum.photos/seed/maabar-food-22-1-2/1200/900', 'https://picsum.photos/seed/maabar-food-22-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 12,
  true, 9.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-22@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Premium Date Gift Pack'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 6
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-22@example.com'
  and lower(pr.name_en) = lower('Premium Date Gift Pack')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت زيتون بكر', 'Extra-Virgin Olive Oil', '特级初榨橄榄油', 'USD', 'food', 220,
  'Extra-Virgin Olive Oil — export-grade Food from Shenzhen Zenith Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت زيتون بكر — منتج غذاء للتصدير من Shenzhen Zenith Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-22-2-1/1200/900', array['https://picsum.photos/seed/maabar-food-22-2-1/1200/900', 'https://picsum.photos/seed/maabar-food-22-2-2/1200/900', 'https://picsum.photos/seed/maabar-food-22-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 13,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-22@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Extra-Virgin Olive Oil'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 13
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-22@example.com'
  and lower(pr.name_en) = lower('Extra-Virgin Olive Oil')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكسرات مشكلة', 'Mixed Nuts (Bulk)', '混合坚果', 'USD', 'food', 240,
  'Mixed Nuts (Bulk) — export-grade Food from Shenzhen Zenith Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكسرات مشكلة — منتج غذاء للتصدير من Shenzhen Zenith Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-22-3-1/1200/900', array['https://picsum.photos/seed/maabar-food-22-3-1/1200/900', 'https://picsum.photos/seed/maabar-food-22-3-2/1200/900', 'https://picsum.photos/seed/maabar-food-22-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 14,
  true, 30.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-22@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Mixed Nuts (Bulk)'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 20
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-22@example.com'
  and lower(pr.name_en) = lower('Mixed Nuts (Bulk)')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'حبوب قهوة مختصة', 'Specialty Coffee Beans', '精品咖啡豆', 'USD', 'food', 260,
  'Specialty Coffee Beans — export-grade Food from Shenzhen Zenith Food Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'حبوب قهوة مختصة — منتج غذاء للتصدير من Shenzhen Zenith Food Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-food-22-4-1/1200/900', array['https://picsum.photos/seed/maabar-food-22-4-1/1200/900', 'https://picsum.photos/seed/maabar-food-22-4-2/1200/900', 'https://picsum.photos/seed/maabar-food-22-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-22@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Specialty Coffee Beans'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 27
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-22@example.com'
  and lower(pr.name_en) = lower('Specialty Coffee Beans')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Yiwu Cardinal Beauty Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'عبوات مضخة تجميل', 'Cosmetic Pump Bottles', '化妆品泵瓶', 'USD', 'beauty', 250,
  'Cosmetic Pump Bottles — export-grade Beauty & Personal Care from Yiwu Cardinal Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'عبوات مضخة تجميل — منتج عناية وتجميل للتصدير من Yiwu Cardinal Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-23-1-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-23-1-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-1-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 4.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-23@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Cosmetic Pump Bottles'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-23@example.com'
  and lower(pr.name_en) = lower('Cosmetic Pump Bottles')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم فرش مكياج', '12-pc Makeup Brush Set', '化妆刷套装', 'USD', 'beauty', 275,
  '12-pc Makeup Brush Set — export-grade Beauty & Personal Care from Yiwu Cardinal Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم فرش مكياج — منتج عناية وتجميل للتصدير من Yiwu Cardinal Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-23-2-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-23-2-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-2-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-23@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('12-pc Makeup Brush Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 7
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-23@example.com'
  and lower(pr.name_en) = lower('12-pc Makeup Brush Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سيروم فيتامين سي', 'Vitamin-C Skincare Serum', '维C护肤精华', 'USD', 'beauty', 300,
  'Vitamin-C Skincare Serum — export-grade Beauty & Personal Care from Yiwu Cardinal Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سيروم فيتامين سي — منتج عناية وتجميل للتصدير من Yiwu Cardinal Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-23-3-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-23-3-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-3-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 16.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-23@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Vitamin-C Skincare Serum'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 11
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-23@example.com'
  and lower(pr.name_en) = lower('Vitamin-C Skincare Serum')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أدوات تصفيف شعر', 'Hair Styling Tool Kit', '美发造型套装', 'USD', 'beauty', 325,
  'Hair Styling Tool Kit — export-grade Beauty & Personal Care from Yiwu Cardinal Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أدوات تصفيف شعر — منتج عناية وتجميل للتصدير من Yiwu Cardinal Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-23-4-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-23-4-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-4-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-23-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-23@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Hair Styling Tool Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 15
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-23@example.com'
  and lower(pr.name_en) = lower('Hair Styling Tool Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Ningbo Meridian Beauty Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'عبوات مضخة تجميل', 'Cosmetic Pump Bottles', '化妆品泵瓶', 'USD', 'beauty', 250,
  'Cosmetic Pump Bottles — export-grade Beauty & Personal Care from Ningbo Meridian Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'عبوات مضخة تجميل — منتج عناية وتجميل للتصدير من Ningbo Meridian Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-24-1-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-24-1-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-1-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 4.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-24@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Cosmetic Pump Bottles'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-24@example.com'
  and lower(pr.name_en) = lower('Cosmetic Pump Bottles')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم فرش مكياج', '12-pc Makeup Brush Set', '化妆刷套装', 'USD', 'beauty', 275,
  '12-pc Makeup Brush Set — export-grade Beauty & Personal Care from Ningbo Meridian Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم فرش مكياج — منتج عناية وتجميل للتصدير من Ningbo Meridian Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-24-2-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-24-2-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-2-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-24@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('12-pc Makeup Brush Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 7
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-24@example.com'
  and lower(pr.name_en) = lower('12-pc Makeup Brush Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سيروم فيتامين سي', 'Vitamin-C Skincare Serum', '维C护肤精华', 'USD', 'beauty', 300,
  'Vitamin-C Skincare Serum — export-grade Beauty & Personal Care from Ningbo Meridian Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سيروم فيتامين سي — منتج عناية وتجميل للتصدير من Ningbo Meridian Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-24-3-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-24-3-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-3-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 16.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-24@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Vitamin-C Skincare Serum'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 11
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-24@example.com'
  and lower(pr.name_en) = lower('Vitamin-C Skincare Serum')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أدوات تصفيف شعر', 'Hair Styling Tool Kit', '美发造型套装', 'USD', 'beauty', 325,
  'Hair Styling Tool Kit — export-grade Beauty & Personal Care from Ningbo Meridian Beauty Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أدوات تصفيف شعر — منتج عناية وتجميل للتصدير من Ningbo Meridian Beauty Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-beauty-24-4-1/1200/900', array['https://picsum.photos/seed/maabar-beauty-24-4-1/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-4-2/1200/900', 'https://picsum.photos/seed/maabar-beauty-24-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-24@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Hair Styling Tool Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 15
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-24@example.com'
  and lower(pr.name_en) = lower('Hair Styling Tool Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Foshan Falcon Sports Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سجادة يوغا', 'Non-Slip Yoga Mat', '防滑瑜伽垫', 'USD', 'sports', 120,
  'Non-Slip Yoga Mat — export-grade Sports from Foshan Falcon Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سجادة يوغا — منتج رياضة للتصدير من Foshan Falcon Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-25-1-1/1200/900', array['https://picsum.photos/seed/maabar-sports-25-1-1/1200/900', 'https://picsum.photos/seed/maabar-sports-25-1-2/1200/900', 'https://picsum.photos/seed/maabar-sports-25-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 13.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-25@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Non-Slip Yoga Mat'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 9
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-25@example.com'
  and lower(pr.name_en) = lower('Non-Slip Yoga Mat')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'دمبل قابل للتعديل', 'Adjustable Dumbbell Set', '可调哑铃', 'USD', 'sports', 132,
  'Adjustable Dumbbell Set — export-grade Sports from Foshan Falcon Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'دمبل قابل للتعديل — منتج رياضة للتصدير من Foshan Falcon Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-25-2-1/1200/900', array['https://picsum.photos/seed/maabar-sports-25-2-1/1200/900', 'https://picsum.photos/seed/maabar-sports-25-2-2/1200/900', 'https://picsum.photos/seed/maabar-sports-25-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-25@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Adjustable Dumbbell Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 20
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-25@example.com'
  and lower(pr.name_en) = lower('Adjustable Dumbbell Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خيمة تخييم 4 أشخاص', '4-Person Camping Tent', '四人帐篷', 'USD', 'sports', 144,
  '4-Person Camping Tent — export-grade Sports from Foshan Falcon Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خيمة تخييم 4 أشخاص — منتج رياضة للتصدير من Foshan Falcon Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-25-3-1/1200/900', array['https://picsum.photos/seed/maabar-sports-25-3-1/1200/900', 'https://picsum.photos/seed/maabar-sports-25-3-2/1200/900', 'https://picsum.photos/seed/maabar-sports-25-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 46.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-25@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('4-Person Camping Tent'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 31
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-25@example.com'
  and lower(pr.name_en) = lower('4-Person Camping Tent')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرة قدم', 'Match Football', '比赛足球', 'USD', 'sports', 156,
  'Match Football — export-grade Sports from Foshan Falcon Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرة قدم — منتج رياضة للتصدير من Foshan Falcon Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-25-4-1/1200/900', array['https://picsum.photos/seed/maabar-sports-25-4-1/1200/900', 'https://picsum.photos/seed/maabar-sports-25-4-2/1200/900', 'https://picsum.photos/seed/maabar-sports-25-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-25@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Match Football'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 42
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-25@example.com'
  and lower(pr.name_en) = lower('Match Football')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Dongguan Volt Sports Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سجادة يوغا', 'Non-Slip Yoga Mat', '防滑瑜伽垫', 'USD', 'sports', 120,
  'Non-Slip Yoga Mat — export-grade Sports from Dongguan Volt Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سجادة يوغا — منتج رياضة للتصدير من Dongguan Volt Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-26-1-1/1200/900', array['https://picsum.photos/seed/maabar-sports-26-1-1/1200/900', 'https://picsum.photos/seed/maabar-sports-26-1-2/1200/900', 'https://picsum.photos/seed/maabar-sports-26-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 13.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-26@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Non-Slip Yoga Mat'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 9
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-26@example.com'
  and lower(pr.name_en) = lower('Non-Slip Yoga Mat')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'دمبل قابل للتعديل', 'Adjustable Dumbbell Set', '可调哑铃', 'USD', 'sports', 132,
  'Adjustable Dumbbell Set — export-grade Sports from Dongguan Volt Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'دمبل قابل للتعديل — منتج رياضة للتصدير من Dongguan Volt Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-26-2-1/1200/900', array['https://picsum.photos/seed/maabar-sports-26-2-1/1200/900', 'https://picsum.photos/seed/maabar-sports-26-2-2/1200/900', 'https://picsum.photos/seed/maabar-sports-26-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-26@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Adjustable Dumbbell Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 20
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-26@example.com'
  and lower(pr.name_en) = lower('Adjustable Dumbbell Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خيمة تخييم 4 أشخاص', '4-Person Camping Tent', '四人帐篷', 'USD', 'sports', 144,
  '4-Person Camping Tent — export-grade Sports from Dongguan Volt Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خيمة تخييم 4 أشخاص — منتج رياضة للتصدير من Dongguan Volt Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-26-3-1/1200/900', array['https://picsum.photos/seed/maabar-sports-26-3-1/1200/900', 'https://picsum.photos/seed/maabar-sports-26-3-2/1200/900', 'https://picsum.photos/seed/maabar-sports-26-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 46.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-26@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('4-Person Camping Tent'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 31
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-26@example.com'
  and lower(pr.name_en) = lower('4-Person Camping Tent')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرة قدم', 'Match Football', '比赛足球', 'USD', 'sports', 156,
  'Match Football — export-grade Sports from Dongguan Volt Sports Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرة قدم — منتج رياضة للتصدير من Dongguan Volt Sports Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-sports-26-4-1/1200/900', array['https://picsum.photos/seed/maabar-sports-26-4-1/1200/900', 'https://picsum.photos/seed/maabar-sports-26-4-2/1200/900', 'https://picsum.photos/seed/maabar-sports-26-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-26@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Match Football'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 42
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-26@example.com'
  and lower(pr.name_en) = lower('Match Football')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Xiamen Apex Toys Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكعبات بناء', 'Building Blocks Set', '积木套装', 'USD', 'toys', 200,
  'Building Blocks Set — export-grade Toys from Xiamen Apex Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكعبات بناء — منتج ألعاب للتصدير من Xiamen Apex Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-27-1-1/1200/900', array['https://picsum.photos/seed/maabar-toys-27-1-1/1200/900', 'https://picsum.photos/seed/maabar-toys-27-1-2/1200/900', 'https://picsum.photos/seed/maabar-toys-27-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 4.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-27@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Building Blocks Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-27@example.com'
  and lower(pr.name_en) = lower('Building Blocks Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سيارة تحكم', 'RC Stunt Car', '遥控特技车', 'USD', 'toys', 220,
  'RC Stunt Car — export-grade Toys from Xiamen Apex Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سيارة تحكم — منتج ألعاب للتصدير من Xiamen Apex Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-27-2-1/1200/900', array['https://picsum.photos/seed/maabar-toys-27-2-1/1200/900', 'https://picsum.photos/seed/maabar-toys-27-2-2/1200/900', 'https://picsum.photos/seed/maabar-toys-27-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-27@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('RC Stunt Car'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-27@example.com'
  and lower(pr.name_en) = lower('RC Stunt Car')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'دمى محشوة', 'Plush Toy Assortment', '毛绒玩具', 'USD', 'toys', 240,
  'Plush Toy Assortment — export-grade Toys from Xiamen Apex Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'دمى محشوة — منتج ألعاب للتصدير من Xiamen Apex Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-27-3-1/1200/900', array['https://picsum.photos/seed/maabar-toys-27-3-1/1200/900', 'https://picsum.photos/seed/maabar-toys-27-3-2/1200/900', 'https://picsum.photos/seed/maabar-toys-27-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 19.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-27@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Plush Toy Assortment'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 13
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-27@example.com'
  and lower(pr.name_en) = lower('Plush Toy Assortment')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أحجية تعليمية', 'Educational Jigsaw Puzzle', '益智拼图', 'USD', 'toys', 260,
  'Educational Jigsaw Puzzle — export-grade Toys from Xiamen Apex Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أحجية تعليمية — منتج ألعاب للتصدير من Xiamen Apex Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-27-4-1/1200/900', array['https://picsum.photos/seed/maabar-toys-27-4-1/1200/900', 'https://picsum.photos/seed/maabar-toys-27-4-2/1200/900', 'https://picsum.photos/seed/maabar-toys-27-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-27@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Educational Jigsaw Puzzle'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 18
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-27@example.com'
  and lower(pr.name_en) = lower('Educational Jigsaw Puzzle')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Hangzhou Sino Toys Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكعبات بناء', 'Building Blocks Set', '积木套装', 'USD', 'toys', 200,
  'Building Blocks Set — export-grade Toys from Hangzhou Sino Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكعبات بناء — منتج ألعاب للتصدير من Hangzhou Sino Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-28-1-1/1200/900', array['https://picsum.photos/seed/maabar-toys-28-1-1/1200/900', 'https://picsum.photos/seed/maabar-toys-28-1-2/1200/900', 'https://picsum.photos/seed/maabar-toys-28-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 4.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-28@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Building Blocks Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-28@example.com'
  and lower(pr.name_en) = lower('Building Blocks Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سيارة تحكم', 'RC Stunt Car', '遥控特技车', 'USD', 'toys', 220,
  'RC Stunt Car — export-grade Toys from Hangzhou Sino Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سيارة تحكم — منتج ألعاب للتصدير من Hangzhou Sino Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-28-2-1/1200/900', array['https://picsum.photos/seed/maabar-toys-28-2-1/1200/900', 'https://picsum.photos/seed/maabar-toys-28-2-2/1200/900', 'https://picsum.photos/seed/maabar-toys-28-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-28@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('RC Stunt Car'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-28@example.com'
  and lower(pr.name_en) = lower('RC Stunt Car')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'دمى محشوة', 'Plush Toy Assortment', '毛绒玩具', 'USD', 'toys', 240,
  'Plush Toy Assortment — export-grade Toys from Hangzhou Sino Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'دمى محشوة — منتج ألعاب للتصدير من Hangzhou Sino Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-28-3-1/1200/900', array['https://picsum.photos/seed/maabar-toys-28-3-1/1200/900', 'https://picsum.photos/seed/maabar-toys-28-3-2/1200/900', 'https://picsum.photos/seed/maabar-toys-28-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 19.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-28@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Plush Toy Assortment'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 13
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-28@example.com'
  and lower(pr.name_en) = lower('Plush Toy Assortment')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أحجية تعليمية', 'Educational Jigsaw Puzzle', '益智拼图', 'USD', 'toys', 260,
  'Educational Jigsaw Puzzle — export-grade Toys from Hangzhou Sino Toys Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أحجية تعليمية — منتج ألعاب للتصدير من Hangzhou Sino Toys Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-toys-28-4-1/1200/900', array['https://picsum.photos/seed/maabar-toys-28-4-1/1200/900', 'https://picsum.photos/seed/maabar-toys-28-4-2/1200/900', 'https://picsum.photos/seed/maabar-toys-28-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-28@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Educational Jigsaw Puzzle'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 18
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-28@example.com'
  and lower(pr.name_en) = lower('Educational Jigsaw Puzzle')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Suzhou GrandEast Auto Parts Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم فحمات سيراميك', 'Ceramic Brake Pad Set', '陶瓷刹车片', 'USD', 'auto_parts', 60,
  'Ceramic Brake Pad Set — export-grade Auto Parts from Suzhou GrandEast Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم فحمات سيراميك — منتج قطع غيار للتصدير من Suzhou GrandEast Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-29-1-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-29-1-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-1-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 18.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-29@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Ceramic Brake Pad Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 12
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-29@example.com'
  and lower(pr.name_en) = lower('Ceramic Brake Pad Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'فلتر هواء المحرك', 'Engine Air Filter', '空气滤清器', 'USD', 'auto_parts', 66,
  'Engine Air Filter — export-grade Auto Parts from Suzhou GrandEast Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'فلتر هواء المحرك — منتج قطع غيار للتصدير من Suzhou GrandEast Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-29-2-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-29-2-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-2-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-29@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Engine Air Filter'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 30
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-29@example.com'
  and lower(pr.name_en) = lower('Engine Air Filter')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم كشافات LED', 'LED Headlight Kit', 'LED大灯', 'USD', 'auto_parts', 72,
  'LED Headlight Kit — export-grade Auto Parts from Suzhou GrandEast Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم كشافات LED — منتج قطع غيار للتصدير من Suzhou GrandEast Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-29-3-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-29-3-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-3-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 72.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-29@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('LED Headlight Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 48
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-29@example.com'
  and lower(pr.name_en) = lower('LED Headlight Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مساعد تعليق', 'Suspension Shock Absorber', '减震器', 'USD', 'auto_parts', 78,
  'Suspension Shock Absorber — export-grade Auto Parts from Suzhou GrandEast Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مساعد تعليق — منتج قطع غيار للتصدير من Suzhou GrandEast Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-29-4-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-29-4-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-4-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-29-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-29@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Suspension Shock Absorber'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 66
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-29@example.com'
  and lower(pr.name_en) = lower('Suspension Shock Absorber')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Qingdao Nova Auto Parts Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم فحمات سيراميك', 'Ceramic Brake Pad Set', '陶瓷刹车片', 'USD', 'auto_parts', 60,
  'Ceramic Brake Pad Set — export-grade Auto Parts from Qingdao Nova Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم فحمات سيراميك — منتج قطع غيار للتصدير من Qingdao Nova Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-30-1-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-30-1-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-1-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 18.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-30@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Ceramic Brake Pad Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 12
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-30@example.com'
  and lower(pr.name_en) = lower('Ceramic Brake Pad Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'فلتر هواء المحرك', 'Engine Air Filter', '空气滤清器', 'USD', 'auto_parts', 66,
  'Engine Air Filter — export-grade Auto Parts from Qingdao Nova Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'فلتر هواء المحرك — منتج قطع غيار للتصدير من Qingdao Nova Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-30-2-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-30-2-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-2-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-30@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Engine Air Filter'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 30
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-30@example.com'
  and lower(pr.name_en) = lower('Engine Air Filter')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم كشافات LED', 'LED Headlight Kit', 'LED大灯', 'USD', 'auto_parts', 72,
  'LED Headlight Kit — export-grade Auto Parts from Qingdao Nova Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم كشافات LED — منتج قطع غيار للتصدير من Qingdao Nova Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-30-3-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-30-3-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-3-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 72.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-30@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('LED Headlight Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 48
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-30@example.com'
  and lower(pr.name_en) = lower('LED Headlight Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مساعد تعليق', 'Suspension Shock Absorber', '减震器', 'USD', 'auto_parts', 78,
  'Suspension Shock Absorber — export-grade Auto Parts from Qingdao Nova Auto Parts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مساعد تعليق — منتج قطع غيار للتصدير من Qingdao Nova Auto Parts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-auto_parts-30-4-1/1200/900', array['https://picsum.photos/seed/maabar-auto_parts-30-4-1/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-4-2/1200/900', 'https://picsum.photos/seed/maabar-auto_parts-30-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-30@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Suspension Shock Absorber'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 66
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-30@example.com'
  and lower(pr.name_en) = lower('Suspension Shock Absorber')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Guangzhou Orient Car Accessories Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'حامل جوال مغناطيسي', 'Magnetic Phone Holder', '磁吸手机支架', 'USD', 'car_accessories', 150,
  'Magnetic Phone Holder — export-grade Car Accessories from Guangzhou Orient Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'حامل جوال مغناطيسي — منتج إكسسوارات سيارات للتصدير من Guangzhou Orient Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-31-1-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-31-1-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-1-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 9.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-31@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Magnetic Phone Holder'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 6
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-31@example.com'
  and lower(pr.name_en) = lower('Magnetic Phone Holder')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أغطية مقاعد', 'Universal Seat Covers', '通用座套', 'USD', 'car_accessories', 165,
  'Universal Seat Covers — export-grade Car Accessories from Guangzhou Orient Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أغطية مقاعد — منتج إكسسوارات سيارات للتصدير من Guangzhou Orient Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-31-2-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-31-2-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-2-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-31@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Universal Seat Covers'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 14
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-31@example.com'
  and lower(pr.name_en) = lower('Universal Seat Covers')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كاميرا أمامية 1080p', '1080p Dash Camera', '1080p行车记录仪', 'USD', 'car_accessories', 180,
  '1080p Dash Camera — export-grade Car Accessories from Guangzhou Orient Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كاميرا أمامية 1080p — منتج إكسسوارات سيارات للتصدير من Guangzhou Orient Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-31-3-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-31-3-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-3-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 33.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-31@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('1080p Dash Camera'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 22
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-31@example.com'
  and lower(pr.name_en) = lower('1080p Dash Camera')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'دعاسات أرضية', 'All-Weather Floor Mats', '全天候脚垫', 'USD', 'car_accessories', 195,
  'All-Weather Floor Mats — export-grade Car Accessories from Guangzhou Orient Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'دعاسات أرضية — منتج إكسسوارات سيارات للتصدير من Guangzhou Orient Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-31-4-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-31-4-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-4-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-31-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-31@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('All-Weather Floor Mats'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 30
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-31@example.com'
  and lower(pr.name_en) = lower('All-Weather Floor Mats')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Shenzhen Summit Car Accessories Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'حامل جوال مغناطيسي', 'Magnetic Phone Holder', '磁吸手机支架', 'USD', 'car_accessories', 150,
  'Magnetic Phone Holder — export-grade Car Accessories from Shenzhen Summit Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'حامل جوال مغناطيسي — منتج إكسسوارات سيارات للتصدير من Shenzhen Summit Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-32-1-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-32-1-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-1-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 9.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-32@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Magnetic Phone Holder'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 6
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-32@example.com'
  and lower(pr.name_en) = lower('Magnetic Phone Holder')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أغطية مقاعد', 'Universal Seat Covers', '通用座套', 'USD', 'car_accessories', 165,
  'Universal Seat Covers — export-grade Car Accessories from Shenzhen Summit Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أغطية مقاعد — منتج إكسسوارات سيارات للتصدير من Shenzhen Summit Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-32-2-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-32-2-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-2-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-32@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Universal Seat Covers'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 14
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-32@example.com'
  and lower(pr.name_en) = lower('Universal Seat Covers')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كاميرا أمامية 1080p', '1080p Dash Camera', '1080p行车记录仪', 'USD', 'car_accessories', 180,
  '1080p Dash Camera — export-grade Car Accessories from Shenzhen Summit Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كاميرا أمامية 1080p — منتج إكسسوارات سيارات للتصدير من Shenzhen Summit Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-32-3-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-32-3-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-3-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 33.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-32@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('1080p Dash Camera'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 22
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-32@example.com'
  and lower(pr.name_en) = lower('1080p Dash Camera')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'دعاسات أرضية', 'All-Weather Floor Mats', '全天候脚垫', 'USD', 'car_accessories', 195,
  'All-Weather Floor Mats — export-grade Car Accessories from Shenzhen Summit Car Accessories Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'دعاسات أرضية — منتج إكسسوارات سيارات للتصدير من Shenzhen Summit Car Accessories Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-car_accessories-32-4-1/1200/900', array['https://picsum.photos/seed/maabar-car_accessories-32-4-1/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-4-2/1200/900', 'https://picsum.photos/seed/maabar-car_accessories-32-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-32@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('All-Weather Floor Mats'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 30
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-32@example.com'
  and lower(pr.name_en) = lower('All-Weather Floor Mats')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Yiwu Pacific Tire Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'إطار سيارة ركاب', 'Passenger Car Tire', '轿车轮胎', 'USD', 'tires', 40,
  'Passenger Car Tire — export-grade Tires from Yiwu Pacific Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'إطار سيارة ركاب — منتج إطارات للتصدير من Yiwu Pacific Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-33-1-1/1200/900', array['https://picsum.photos/seed/maabar-tires-33-1-1/1200/900', 'https://picsum.photos/seed/maabar-tires-33-1-2/1200/900', 'https://picsum.photos/seed/maabar-tires-33-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 25,
  true, 52.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-33@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Passenger Car Tire'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 35
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-33@example.com'
  and lower(pr.name_en) = lower('Passenger Car Tire')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'إطار دفع رباعي', 'SUV All-Terrain Tire', 'SUV全地形轮胎', 'USD', 'tires', 44,
  'SUV All-Terrain Tire — export-grade Tires from Yiwu Pacific Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'إطار دفع رباعي — منتج إطارات للتصدير من Yiwu Pacific Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-33-2-1/1200/900', array['https://picsum.photos/seed/maabar-tires-33-2-1/1200/900', 'https://picsum.photos/seed/maabar-tires-33-2-2/1200/900', 'https://picsum.photos/seed/maabar-tires-33-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 26,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-33@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('SUV All-Terrain Tire'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 63
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-33@example.com'
  and lower(pr.name_en) = lower('SUV All-Terrain Tire')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'إطار شاحنة', 'Commercial Truck Tire', '卡车轮胎', 'USD', 'tires', 48,
  'Commercial Truck Tire — export-grade Tires from Yiwu Pacific Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'إطار شاحنة — منتج إطارات للتصدير من Yiwu Pacific Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-33-3-1/1200/900', array['https://picsum.photos/seed/maabar-tires-33-3-1/1200/900', 'https://picsum.photos/seed/maabar-tires-33-3-2/1200/900', 'https://picsum.photos/seed/maabar-tires-33-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 27,
  true, 136.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-33@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Commercial Truck Tire'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 91
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-33@example.com'
  and lower(pr.name_en) = lower('Commercial Truck Tire')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم إصلاح إطارات', 'Tire Repair Kit', '补胎套装', 'USD', 'tires', 52,
  'Tire Repair Kit — export-grade Tires from Yiwu Pacific Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم إصلاح إطارات — منتج إطارات للتصدير من Yiwu Pacific Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-33-4-1/1200/900', array['https://picsum.photos/seed/maabar-tires-33-4-1/1200/900', 'https://picsum.photos/seed/maabar-tires-33-4-2/1200/900', 'https://picsum.photos/seed/maabar-tires-33-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-33@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Tire Repair Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 119
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-33@example.com'
  and lower(pr.name_en) = lower('Tire Repair Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Ningbo Golden Tire Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'إطار سيارة ركاب', 'Passenger Car Tire', '轿车轮胎', 'USD', 'tires', 40,
  'Passenger Car Tire — export-grade Tires from Ningbo Golden Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'إطار سيارة ركاب — منتج إطارات للتصدير من Ningbo Golden Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-34-1-1/1200/900', array['https://picsum.photos/seed/maabar-tires-34-1-1/1200/900', 'https://picsum.photos/seed/maabar-tires-34-1-2/1200/900', 'https://picsum.photos/seed/maabar-tires-34-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 25,
  true, 52.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-34@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Passenger Car Tire'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 35
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-34@example.com'
  and lower(pr.name_en) = lower('Passenger Car Tire')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'إطار دفع رباعي', 'SUV All-Terrain Tire', 'SUV全地形轮胎', 'USD', 'tires', 44,
  'SUV All-Terrain Tire — export-grade Tires from Ningbo Golden Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'إطار دفع رباعي — منتج إطارات للتصدير من Ningbo Golden Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-34-2-1/1200/900', array['https://picsum.photos/seed/maabar-tires-34-2-1/1200/900', 'https://picsum.photos/seed/maabar-tires-34-2-2/1200/900', 'https://picsum.photos/seed/maabar-tires-34-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 26,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-34@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('SUV All-Terrain Tire'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 63
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-34@example.com'
  and lower(pr.name_en) = lower('SUV All-Terrain Tire')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'إطار شاحنة', 'Commercial Truck Tire', '卡车轮胎', 'USD', 'tires', 48,
  'Commercial Truck Tire — export-grade Tires from Ningbo Golden Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'إطار شاحنة — منتج إطارات للتصدير من Ningbo Golden Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-34-3-1/1200/900', array['https://picsum.photos/seed/maabar-tires-34-3-1/1200/900', 'https://picsum.photos/seed/maabar-tires-34-3-2/1200/900', 'https://picsum.photos/seed/maabar-tires-34-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 27,
  true, 136.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-34@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Commercial Truck Tire'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 91
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-34@example.com'
  and lower(pr.name_en) = lower('Commercial Truck Tire')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم إصلاح إطارات', 'Tire Repair Kit', '补胎套装', 'USD', 'tires', 52,
  'Tire Repair Kit — export-grade Tires from Ningbo Golden Tire Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم إصلاح إطارات — منتج إطارات للتصدير من Ningbo Golden Tire Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-tires-34-4-1/1200/900', array['https://picsum.photos/seed/maabar-tires-34-4-1/1200/900', 'https://picsum.photos/seed/maabar-tires-34-4-2/1200/900', 'https://picsum.photos/seed/maabar-tires-34-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-34@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Tire Repair Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 119
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-34@example.com'
  and lower(pr.name_en) = lower('Tire Repair Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Foshan Evergreen Lubricants Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت محرك صناعي', 'Synthetic Engine Oil 5W-30', '全合成机油5W-30', 'USD', 'lubricants', 200,
  'Synthetic Engine Oil 5W-30 — export-grade Lubricants & Oils from Foshan Evergreen Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت محرك صناعي — منتج زيوت ومواد تشحيم للتصدير من Foshan Evergreen Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-35-1-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-35-1-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-1-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 14,
  true, 7.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-35@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Synthetic Engine Oil 5W-30'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 5
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-35@example.com'
  and lower(pr.name_en) = lower('Synthetic Engine Oil 5W-30')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت تروس', 'Gear Oil 80W-90', '齿轮油', 'USD', 'lubricants', 220,
  'Gear Oil 80W-90 — export-grade Lubricants & Oils from Foshan Evergreen Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت تروس — منتج زيوت ومواد تشحيم للتصدير من Foshan Evergreen Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-35-2-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-35-2-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-2-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-35@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Gear Oil 80W-90'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 11
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-35@example.com'
  and lower(pr.name_en) = lower('Gear Oil 80W-90')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شحم متعدد الأغراض', 'Multi-Purpose Grease', '多用途润滑脂', 'USD', 'lubricants', 240,
  'Multi-Purpose Grease — export-grade Lubricants & Oils from Foshan Evergreen Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شحم متعدد الأغراض — منتج زيوت ومواد تشحيم للتصدير من Foshan Evergreen Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-35-3-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-35-3-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-3-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 25.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-35@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Multi-Purpose Grease'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-35@example.com'
  and lower(pr.name_en) = lower('Multi-Purpose Grease')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت فرامل DOT-4', 'DOT-4 Brake Fluid', 'DOT-4刹车油', 'USD', 'lubricants', 260,
  'DOT-4 Brake Fluid — export-grade Lubricants & Oils from Foshan Evergreen Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت فرامل DOT-4 — منتج زيوت ومواد تشحيم للتصدير من Foshan Evergreen Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-35-4-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-35-4-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-4-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-35-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-35@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('DOT-4 Brake Fluid'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 23
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-35@example.com'
  and lower(pr.name_en) = lower('DOT-4 Brake Fluid')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Dongguan Skyline Lubricants Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت محرك صناعي', 'Synthetic Engine Oil 5W-30', '全合成机油5W-30', 'USD', 'lubricants', 200,
  'Synthetic Engine Oil 5W-30 — export-grade Lubricants & Oils from Dongguan Skyline Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت محرك صناعي — منتج زيوت ومواد تشحيم للتصدير من Dongguan Skyline Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-36-1-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-36-1-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-1-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 14,
  true, 7.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-36@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Synthetic Engine Oil 5W-30'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 5
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-36@example.com'
  and lower(pr.name_en) = lower('Synthetic Engine Oil 5W-30')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت تروس', 'Gear Oil 80W-90', '齿轮油', 'USD', 'lubricants', 220,
  'Gear Oil 80W-90 — export-grade Lubricants & Oils from Dongguan Skyline Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت تروس — منتج زيوت ومواد تشحيم للتصدير من Dongguan Skyline Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-36-2-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-36-2-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-2-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-36@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Gear Oil 80W-90'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 11
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-36@example.com'
  and lower(pr.name_en) = lower('Gear Oil 80W-90')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شحم متعدد الأغراض', 'Multi-Purpose Grease', '多用途润滑脂', 'USD', 'lubricants', 240,
  'Multi-Purpose Grease — export-grade Lubricants & Oils from Dongguan Skyline Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شحم متعدد الأغراض — منتج زيوت ومواد تشحيم للتصدير من Dongguan Skyline Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-36-3-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-36-3-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-3-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  true, 25.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-36@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Multi-Purpose Grease'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-36@example.com'
  and lower(pr.name_en) = lower('Multi-Purpose Grease')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'زيت فرامل DOT-4', 'DOT-4 Brake Fluid', 'DOT-4刹车油', 'USD', 'lubricants', 260,
  'DOT-4 Brake Fluid — export-grade Lubricants & Oils from Dongguan Skyline Lubricants Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'زيت فرامل DOT-4 — منتج زيوت ومواد تشحيم للتصدير من Dongguan Skyline Lubricants Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-lubricants-36-4-1/1200/900', array['https://picsum.photos/seed/maabar-lubricants-36-4-1/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-4-2/1200/900', 'https://picsum.photos/seed/maabar-lubricants-36-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-36@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('DOT-4 Brake Fluid'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 23
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-36@example.com'
  and lower(pr.name_en) = lower('DOT-4 Brake Fluid')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Xiamen Unison Medical Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'جهاز ضغط رقمي', 'Digital Blood Pressure Monitor', '电子血压计', 'USD', 'health', 200,
  'Digital Blood Pressure Monitor — export-grade Health & Medical from Xiamen Unison Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'جهاز ضغط رقمي — منتج صحة وطب للتصدير من Xiamen Unison Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-37-1-1/1200/900', array['https://picsum.photos/seed/maabar-health-37-1-1/1200/900', 'https://picsum.photos/seed/maabar-health-37-1-2/1200/900', 'https://picsum.photos/seed/maabar-health-37-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 6.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-37@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Digital Blood Pressure Monitor'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 4
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-37@example.com'
  and lower(pr.name_en) = lower('Digital Blood Pressure Monitor')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كمامات طبية', '3-Ply Surgical Masks', '医用口罩', 'USD', 'health', 220,
  '3-Ply Surgical Masks — export-grade Health & Medical from Xiamen Unison Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كمامات طبية — منتج صحة وطب للتصدير من Xiamen Unison Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-37-2-1/1200/900', array['https://picsum.photos/seed/maabar-health-37-2-1/1200/900', 'https://picsum.photos/seed/maabar-health-37-2-2/1200/900', 'https://picsum.photos/seed/maabar-health-37-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-37@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Ply Surgical Masks'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 13
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-37@example.com'
  and lower(pr.name_en) = lower('3-Ply Surgical Masks')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مقياس أكسجين', 'Fingertip Pulse Oximeter', '指夹血氧仪', 'USD', 'health', 240,
  'Fingertip Pulse Oximeter — export-grade Health & Medical from Xiamen Unison Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مقياس أكسجين — منتج صحة وطب للتصدير من Xiamen Unison Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-37-3-1/1200/900', array['https://picsum.photos/seed/maabar-health-37-3-1/1200/900', 'https://picsum.photos/seed/maabar-health-37-3-2/1200/900', 'https://picsum.photos/seed/maabar-health-37-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 33.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-37@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Fingertip Pulse Oximeter'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 22
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-37@example.com'
  and lower(pr.name_en) = lower('Fingertip Pulse Oximeter')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'ميزان حرارة', 'Infrared Forehead Thermometer', '红外测温仪', 'USD', 'health', 260,
  'Infrared Forehead Thermometer — export-grade Health & Medical from Xiamen Unison Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'ميزان حرارة — منتج صحة وطب للتصدير من Xiamen Unison Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-37-4-1/1200/900', array['https://picsum.photos/seed/maabar-health-37-4-1/1200/900', 'https://picsum.photos/seed/maabar-health-37-4-2/1200/900', 'https://picsum.photos/seed/maabar-health-37-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-37@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Infrared Forehead Thermometer'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 31
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-37@example.com'
  and lower(pr.name_en) = lower('Infrared Forehead Thermometer')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Hangzhou Brightway Medical Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'جهاز ضغط رقمي', 'Digital Blood Pressure Monitor', '电子血压计', 'USD', 'health', 200,
  'Digital Blood Pressure Monitor — export-grade Health & Medical from Hangzhou Brightway Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'جهاز ضغط رقمي — منتج صحة وطب للتصدير من Hangzhou Brightway Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-38-1-1/1200/900', array['https://picsum.photos/seed/maabar-health-38-1-1/1200/900', 'https://picsum.photos/seed/maabar-health-38-1-2/1200/900', 'https://picsum.photos/seed/maabar-health-38-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 6.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-38@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Digital Blood Pressure Monitor'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 4
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-38@example.com'
  and lower(pr.name_en) = lower('Digital Blood Pressure Monitor')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كمامات طبية', '3-Ply Surgical Masks', '医用口罩', 'USD', 'health', 220,
  '3-Ply Surgical Masks — export-grade Health & Medical from Hangzhou Brightway Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كمامات طبية — منتج صحة وطب للتصدير من Hangzhou Brightway Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-38-2-1/1200/900', array['https://picsum.photos/seed/maabar-health-38-2-1/1200/900', 'https://picsum.photos/seed/maabar-health-38-2-2/1200/900', 'https://picsum.photos/seed/maabar-health-38-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-38@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Ply Surgical Masks'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 13
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-38@example.com'
  and lower(pr.name_en) = lower('3-Ply Surgical Masks')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مقياس أكسجين', 'Fingertip Pulse Oximeter', '指夹血氧仪', 'USD', 'health', 240,
  'Fingertip Pulse Oximeter — export-grade Health & Medical from Hangzhou Brightway Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مقياس أكسجين — منتج صحة وطب للتصدير من Hangzhou Brightway Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-38-3-1/1200/900', array['https://picsum.photos/seed/maabar-health-38-3-1/1200/900', 'https://picsum.photos/seed/maabar-health-38-3-2/1200/900', 'https://picsum.photos/seed/maabar-health-38-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 33.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-38@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Fingertip Pulse Oximeter'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 22
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-38@example.com'
  and lower(pr.name_en) = lower('Fingertip Pulse Oximeter')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'ميزان حرارة', 'Infrared Forehead Thermometer', '红外测温仪', 'USD', 'health', 260,
  'Infrared Forehead Thermometer — export-grade Health & Medical from Hangzhou Brightway Medical Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'ميزان حرارة — منتج صحة وطب للتصدير من Hangzhou Brightway Medical Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-health-38-4-1/1200/900', array['https://picsum.photos/seed/maabar-health-38-4-1/1200/900', 'https://picsum.photos/seed/maabar-health-38-4-2/1200/900', 'https://picsum.photos/seed/maabar-health-38-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-38@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Infrared Forehead Thermometer'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 31
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-38@example.com'
  and lower(pr.name_en) = lower('Infrared Forehead Thermometer')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Suzhou EastPort Packaging Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'صناديق كرتون مموج', 'Corrugated Shipping Boxes', '瓦楞纸箱', 'USD', 'packaging', 1000,
  'Corrugated Shipping Boxes — export-grade Packaging from Suzhou EastPort Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'صناديق كرتون مموج — منتج تعبئة وتغليف للتصدير من Suzhou EastPort Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-39-1-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-39-1-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-1-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 12,
  true, 0.60, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-39@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Corrugated Shipping Boxes'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 0.4
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-39@example.com'
  and lower(pr.name_en) = lower('Corrugated Shipping Boxes')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أكياس شحن مطبوعة', 'Custom Printed Mailer Bags', '定制快递袋', 'USD', 'packaging', 1100,
  'Custom Printed Mailer Bags — export-grade Packaging from Suzhou EastPort Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أكياس شحن مطبوعة — منتج تعبئة وتغليف للتصدير من Suzhou EastPort Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-39-2-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-39-2-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-2-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 13,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-39@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Custom Printed Mailer Bags'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 1.5
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-39@example.com'
  and lower(pr.name_en) = lower('Custom Printed Mailer Bags')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'لفات ورق كرافت', 'Kraft Paper Rolls', '牛皮纸卷', 'USD', 'packaging', 1200,
  'Kraft Paper Rolls — export-grade Packaging from Suzhou EastPort Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'لفات ورق كرافت — منتج تعبئة وتغليف للتصدير من Suzhou EastPort Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-39-3-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-39-3-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-3-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 14,
  true, 3.90, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-39@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Kraft Paper Rolls'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 2.6
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-39@example.com'
  and lower(pr.name_en) = lower('Kraft Paper Rolls')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'لفائف فقاعات', 'Bubble Wrap Rolls', '气泡膜卷', 'USD', 'packaging', 1300,
  'Bubble Wrap Rolls — export-grade Packaging from Suzhou EastPort Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'لفائف فقاعات — منتج تعبئة وتغليف للتصدير من Suzhou EastPort Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-39-4-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-39-4-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-4-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-39-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-39@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Bubble Wrap Rolls'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3.7
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-39@example.com'
  and lower(pr.name_en) = lower('Bubble Wrap Rolls')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Qingdao Crownway Packaging Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'صناديق كرتون مموج', 'Corrugated Shipping Boxes', '瓦楞纸箱', 'USD', 'packaging', 1000,
  'Corrugated Shipping Boxes — export-grade Packaging from Qingdao Crownway Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'صناديق كرتون مموج — منتج تعبئة وتغليف للتصدير من Qingdao Crownway Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-40-1-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-40-1-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-1-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 12,
  true, 0.60, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-40@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Corrugated Shipping Boxes'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 0.4
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-40@example.com'
  and lower(pr.name_en) = lower('Corrugated Shipping Boxes')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أكياس شحن مطبوعة', 'Custom Printed Mailer Bags', '定制快递袋', 'USD', 'packaging', 1100,
  'Custom Printed Mailer Bags — export-grade Packaging from Qingdao Crownway Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أكياس شحن مطبوعة — منتج تعبئة وتغليف للتصدير من Qingdao Crownway Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-40-2-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-40-2-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-2-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 13,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-40@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Custom Printed Mailer Bags'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 1.5
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-40@example.com'
  and lower(pr.name_en) = lower('Custom Printed Mailer Bags')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'لفات ورق كرافت', 'Kraft Paper Rolls', '牛皮纸卷', 'USD', 'packaging', 1200,
  'Kraft Paper Rolls — export-grade Packaging from Qingdao Crownway Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'لفات ورق كرافت — منتج تعبئة وتغليف للتصدير من Qingdao Crownway Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-40-3-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-40-3-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-3-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 14,
  true, 3.90, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-40@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Kraft Paper Rolls'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 2.6
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-40@example.com'
  and lower(pr.name_en) = lower('Kraft Paper Rolls')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'لفائف فقاعات', 'Bubble Wrap Rolls', '气泡膜卷', 'USD', 'packaging', 1300,
  'Bubble Wrap Rolls — export-grade Packaging from Qingdao Crownway Packaging Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'لفائف فقاعات — منتج تعبئة وتغليف للتصدير من Qingdao Crownway Packaging Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-packaging-40-4-1/1200/900', array['https://picsum.photos/seed/maabar-packaging-40-4-1/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-4-2/1200/900', 'https://picsum.photos/seed/maabar-packaging-40-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-40@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Bubble Wrap Rolls'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 3.7
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-40@example.com'
  and lower(pr.name_en) = lower('Bubble Wrap Rolls')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Guangzhou Maxwell Gifts Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'علب هدايا فاخرة', 'Premium Gift Box Set', '精品礼盒', 'USD', 'gifts', 300,
  'Premium Gift Box Set — export-grade Gifts from Guangzhou Maxwell Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'علب هدايا فاخرة — منتج هدايا للتصدير من Guangzhou Maxwell Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-41-1-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-41-1-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-1-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 3.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-41@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Premium Gift Box Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 2
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-41@example.com'
  and lower(pr.name_en) = lower('Premium Gift Box Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'ميداليات معدنية', 'Custom Metal Keychains', '定制金属钥匙扣', 'USD', 'gifts', 330,
  'Custom Metal Keychains — export-grade Gifts from Guangzhou Maxwell Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'ميداليات معدنية — منتج هدايا للتصدير من Guangzhou Maxwell Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-41-2-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-41-2-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-2-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-41@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Custom Metal Keychains'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 5
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-41@example.com'
  and lower(pr.name_en) = lower('Custom Metal Keychains')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أكواب سيراميك دعائية', 'Promotional Ceramic Mugs', '广告陶瓷杯', 'USD', 'gifts', 360,
  'Promotional Ceramic Mugs — export-grade Gifts from Guangzhou Maxwell Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أكواب سيراميك دعائية — منتج هدايا للتصدير من Guangzhou Maxwell Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-41-3-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-41-3-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-3-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 12.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-41@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Promotional Ceramic Mugs'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-41@example.com'
  and lower(pr.name_en) = lower('Promotional Ceramic Mugs')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أقلام هدايا', 'Corporate Gift Pen Set', '商务礼品笔', 'USD', 'gifts', 390,
  'Corporate Gift Pen Set — export-grade Gifts from Guangzhou Maxwell Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أقلام هدايا — منتج هدايا للتصدير من Guangzhou Maxwell Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-41-4-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-41-4-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-4-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-41-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-41@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Corporate Gift Pen Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 11
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-41@example.com'
  and lower(pr.name_en) = lower('Corporate Gift Pen Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Shenzhen Silkroad Gifts Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'علب هدايا فاخرة', 'Premium Gift Box Set', '精品礼盒', 'USD', 'gifts', 300,
  'Premium Gift Box Set — export-grade Gifts from Shenzhen Silkroad Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'علب هدايا فاخرة — منتج هدايا للتصدير من Shenzhen Silkroad Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-42-1-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-42-1-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-1-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 3.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-42@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Premium Gift Box Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 2
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-42@example.com'
  and lower(pr.name_en) = lower('Premium Gift Box Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'ميداليات معدنية', 'Custom Metal Keychains', '定制金属钥匙扣', 'USD', 'gifts', 330,
  'Custom Metal Keychains — export-grade Gifts from Shenzhen Silkroad Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'ميداليات معدنية — منتج هدايا للتصدير من Shenzhen Silkroad Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-42-2-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-42-2-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-2-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-42@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Custom Metal Keychains'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 5
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-42@example.com'
  and lower(pr.name_en) = lower('Custom Metal Keychains')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أكواب سيراميك دعائية', 'Promotional Ceramic Mugs', '广告陶瓷杯', 'USD', 'gifts', 360,
  'Promotional Ceramic Mugs — export-grade Gifts from Shenzhen Silkroad Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أكواب سيراميك دعائية — منتج هدايا للتصدير من Shenzhen Silkroad Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-42-3-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-42-3-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-3-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 12.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-42@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Promotional Ceramic Mugs'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-42@example.com'
  and lower(pr.name_en) = lower('Promotional Ceramic Mugs')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أقلام هدايا', 'Corporate Gift Pen Set', '商务礼品笔', 'USD', 'gifts', 390,
  'Corporate Gift Pen Set — export-grade Gifts from Shenzhen Silkroad Gifts Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أقلام هدايا — منتج هدايا للتصدير من Shenzhen Silkroad Gifts Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-gifts-42-4-1/1200/900', array['https://picsum.photos/seed/maabar-gifts-42-4-1/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-4-2/1200/900', 'https://picsum.photos/seed/maabar-gifts-42-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-42@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Corporate Gift Pen Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 11
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-42@example.com'
  and lower(pr.name_en) = lower('Corporate Gift Pen Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Yiwu Harbor Agriculture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'نظام ري بالتنقيط', 'Drip Irrigation Kit', '滴灌套装', 'USD', 'agriculture', 80,
  'Drip Irrigation Kit — export-grade Agriculture from Yiwu Harbor Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'نظام ري بالتنقيط — منتج زراعة للتصدير من Yiwu Harbor Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-43-1-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-43-1-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-1-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 15.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-43@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Drip Irrigation Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 10
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-43@example.com'
  and lower(pr.name_en) = lower('Drip Irrigation Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'غشاء بيوت محمية', 'Greenhouse Film Roll', '大棚膜', 'USD', 'agriculture', 88,
  'Greenhouse Film Roll — export-grade Agriculture from Yiwu Harbor Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'غشاء بيوت محمية — منتج زراعة للتصدير من Yiwu Harbor Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-43-2-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-43-2-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-2-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-43@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Greenhouse Film Roll'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 24
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-43@example.com'
  and lower(pr.name_en) = lower('Greenhouse Film Roll')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أدوات بستنة', 'Garden Hand Tool Set', '园艺工具套装', 'USD', 'agriculture', 96,
  'Garden Hand Tool Set — export-grade Agriculture from Yiwu Harbor Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أدوات بستنة — منتج زراعة للتصدير من Yiwu Harbor Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-43-3-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-43-3-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-3-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 57.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-43@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Garden Hand Tool Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 38
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-43@example.com'
  and lower(pr.name_en) = lower('Garden Hand Tool Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شبك تظليل', 'Shade Net Roll', '遮阳网', 'USD', 'agriculture', 104,
  'Shade Net Roll — export-grade Agriculture from Yiwu Harbor Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شبك تظليل — منتج زراعة للتصدير من Yiwu Harbor Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-43-4-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-43-4-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-4-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-43-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-43@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Shade Net Roll'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 52
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-43@example.com'
  and lower(pr.name_en) = lower('Shade Net Roll')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Ningbo Vanguard Agriculture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'نظام ري بالتنقيط', 'Drip Irrigation Kit', '滴灌套装', 'USD', 'agriculture', 80,
  'Drip Irrigation Kit — export-grade Agriculture from Ningbo Vanguard Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'نظام ري بالتنقيط — منتج زراعة للتصدير من Ningbo Vanguard Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-44-1-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-44-1-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-1-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 15.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-44@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Drip Irrigation Kit'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 10
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-44@example.com'
  and lower(pr.name_en) = lower('Drip Irrigation Kit')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'غشاء بيوت محمية', 'Greenhouse Film Roll', '大棚膜', 'USD', 'agriculture', 88,
  'Greenhouse Film Roll — export-grade Agriculture from Ningbo Vanguard Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'غشاء بيوت محمية — منتج زراعة للتصدير من Ningbo Vanguard Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-44-2-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-44-2-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-2-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-44@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Greenhouse Film Roll'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 24
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-44@example.com'
  and lower(pr.name_en) = lower('Greenhouse Film Roll')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'أدوات بستنة', 'Garden Hand Tool Set', '园艺工具套装', 'USD', 'agriculture', 96,
  'Garden Hand Tool Set — export-grade Agriculture from Ningbo Vanguard Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'أدوات بستنة — منتج زراعة للتصدير من Ningbo Vanguard Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-44-3-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-44-3-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-3-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 57.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-44@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Garden Hand Tool Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 38
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-44@example.com'
  and lower(pr.name_en) = lower('Garden Hand Tool Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شبك تظليل', 'Shade Net Roll', '遮阳网', 'USD', 'agriculture', 104,
  'Shade Net Roll — export-grade Agriculture from Ningbo Vanguard Agriculture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شبك تظليل — منتج زراعة للتصدير من Ningbo Vanguard Agriculture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-agriculture-44-4-1/1200/900', array['https://picsum.photos/seed/maabar-agriculture-44-4-1/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-4-2/1200/900', 'https://picsum.photos/seed/maabar-agriculture-44-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-44@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Shade Net Roll'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 52
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-44@example.com'
  and lower(pr.name_en) = lower('Shade Net Roll')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Foshan Pinnacle Industrial Supplies Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خوذة سلامة', 'Industrial Safety Helmet', '安全帽', 'USD', 'other', 120,
  'Industrial Safety Helmet — export-grade Other from Foshan Pinnacle Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خوذة سلامة — منتج أخرى للتصدير من Foshan Pinnacle Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-45-1-1/1200/900', array['https://picsum.photos/seed/maabar-other-45-1-1/1200/900', 'https://picsum.photos/seed/maabar-other-45-1-2/1200/900', 'https://picsum.photos/seed/maabar-other-45-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 10.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-45@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Industrial Safety Helmet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 7
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-45@example.com'
  and lower(pr.name_en) = lower('Industrial Safety Helmet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم عدد يدوية', '32-pc Hand Tool Set', '手动工具套装', 'USD', 'other', 132,
  '32-pc Hand Tool Set — export-grade Other from Foshan Pinnacle Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم عدد يدوية — منتج أخرى للتصدير من Foshan Pinnacle Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-45-2-1/1200/900', array['https://picsum.photos/seed/maabar-other-45-2-1/1200/900', 'https://picsum.photos/seed/maabar-other-45-2-2/1200/900', 'https://picsum.photos/seed/maabar-other-45-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-45@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('32-pc Hand Tool Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-45@example.com'
  and lower(pr.name_en) = lower('32-pc Hand Tool Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'قفازات عمل', 'Work Gloves (Bulk)', '劳保手套', 'USD', 'other', 144,
  'Work Gloves (Bulk) — export-grade Other from Foshan Pinnacle Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'قفازات عمل — منتج أخرى للتصدير من Foshan Pinnacle Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-45-3-1/1200/900', array['https://picsum.photos/seed/maabar-other-45-3-1/1200/900', 'https://picsum.photos/seed/maabar-other-45-3-2/1200/900', 'https://picsum.photos/seed/maabar-other-45-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 40.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-45@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Work Gloves (Bulk)'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 27
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-45@example.com'
  and lower(pr.name_en) = lower('Work Gloves (Bulk)')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كشاف عمل LED', 'Rechargeable LED Work Light', 'LED工作灯', 'USD', 'other', 156,
  'Rechargeable LED Work Light — export-grade Other from Foshan Pinnacle Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كشاف عمل LED — منتج أخرى للتصدير من Foshan Pinnacle Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-45-4-1/1200/900', array['https://picsum.photos/seed/maabar-other-45-4-1/1200/900', 'https://picsum.photos/seed/maabar-other-45-4-2/1200/900', 'https://picsum.photos/seed/maabar-other-45-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-45@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Rechargeable LED Work Light'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 37
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-45@example.com'
  and lower(pr.name_en) = lower('Rechargeable LED Work Light')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Dongguan Trinity Industrial Supplies Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خوذة سلامة', 'Industrial Safety Helmet', '安全帽', 'USD', 'other', 120,
  'Industrial Safety Helmet — export-grade Other from Dongguan Trinity Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خوذة سلامة — منتج أخرى للتصدير من Dongguan Trinity Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-46-1-1/1200/900', array['https://picsum.photos/seed/maabar-other-46-1-1/1200/900', 'https://picsum.photos/seed/maabar-other-46-1-2/1200/900', 'https://picsum.photos/seed/maabar-other-46-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  true, 10.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-46@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Industrial Safety Helmet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 7
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-46@example.com'
  and lower(pr.name_en) = lower('Industrial Safety Helmet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم عدد يدوية', '32-pc Hand Tool Set', '手动工具套装', 'USD', 'other', 132,
  '32-pc Hand Tool Set — export-grade Other from Dongguan Trinity Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم عدد يدوية — منتج أخرى للتصدير من Dongguan Trinity Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-46-2-1/1200/900', array['https://picsum.photos/seed/maabar-other-46-2-1/1200/900', 'https://picsum.photos/seed/maabar-other-46-2-2/1200/900', 'https://picsum.photos/seed/maabar-other-46-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 19,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-46@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('32-pc Hand Tool Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-46@example.com'
  and lower(pr.name_en) = lower('32-pc Hand Tool Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'قفازات عمل', 'Work Gloves (Bulk)', '劳保手套', 'USD', 'other', 144,
  'Work Gloves (Bulk) — export-grade Other from Dongguan Trinity Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'قفازات عمل — منتج أخرى للتصدير من Dongguan Trinity Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-46-3-1/1200/900', array['https://picsum.photos/seed/maabar-other-46-3-1/1200/900', 'https://picsum.photos/seed/maabar-other-46-3-2/1200/900', 'https://picsum.photos/seed/maabar-other-46-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 40.50, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-46@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Work Gloves (Bulk)'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 27
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-46@example.com'
  and lower(pr.name_en) = lower('Work Gloves (Bulk)')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كشاف عمل LED', 'Rechargeable LED Work Light', 'LED工作灯', 'USD', 'other', 156,
  'Rechargeable LED Work Light — export-grade Other from Dongguan Trinity Industrial Supplies Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كشاف عمل LED — منتج أخرى للتصدير من Dongguan Trinity Industrial Supplies Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-other-46-4-1/1200/900', array['https://picsum.photos/seed/maabar-other-46-4-1/1200/900', 'https://picsum.photos/seed/maabar-other-46-4-2/1200/900', 'https://picsum.photos/seed/maabar-other-46-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-46@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Rechargeable LED Work Light'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 37
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-46@example.com'
  and lower(pr.name_en) = lower('Rechargeable LED Work Light')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Xiamen Zenith Electronics Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'سماعات لاسلكية برو', 'Wireless Earbuds Pro', '无线耳机Pro', 'USD', 'electronics', 100,
  'Wireless Earbuds Pro — export-grade Electronics from Xiamen Zenith Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'سماعات لاسلكية برو — منتج إلكترونيات للتصدير من Xiamen Zenith Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-47-1-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-47-1-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-1-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 15,
  true, 12.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-47@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Wireless Earbuds Pro'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 8
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-47@example.com'
  and lower(pr.name_en) = lower('Wireless Earbuds Pro')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'شاحن سريع 65 واط', '65W Fast Charger', '65W快充', 'USD', 'electronics', 110,
  '65W Fast Charger — export-grade Electronics from Xiamen Zenith Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'شاحن سريع 65 واط — منتج إلكترونيات للتصدير من Xiamen Zenith Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-47-2-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-47-2-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-2-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 16,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-47@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('65W Fast Charger'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 17
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-47@example.com'
  and lower(pr.name_en) = lower('65W Fast Charger')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'باور بانك 20000', 'Power Bank 20000mAh', '20000mAh充电宝', 'USD', 'electronics', 120,
  'Power Bank 20000mAh — export-grade Electronics from Xiamen Zenith Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'باور بانك 20000 — منتج إلكترونيات للتصدير من Xiamen Zenith Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-47-3-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-47-3-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-3-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 17,
  true, 39.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-47@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Power Bank 20000mAh'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 26
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-47@example.com'
  and lower(pr.name_en) = lower('Power Bank 20000mAh')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكبر صوت بلوتوث', 'Portable Bluetooth Speaker', '便携蓝牙音箱', 'USD', 'electronics', 130,
  'Portable Bluetooth Speaker — export-grade Electronics from Xiamen Zenith Electronics Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكبر صوت بلوتوث — منتج إلكترونيات للتصدير من Xiamen Zenith Electronics Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-electronics-47-4-1/1200/900', array['https://picsum.photos/seed/maabar-electronics-47-4-1/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-4-2/1200/900', 'https://picsum.photos/seed/maabar-electronics-47-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 18,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-47@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Portable Bluetooth Speaker'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 35
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-47@example.com'
  and lower(pr.name_en) = lower('Portable Bluetooth Speaker')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Hangzhou Cardinal Home Appliance Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'غلاية كهربائية 1.8 لتر', '1.8L Electric Kettle', '1.8L电热水壶', 'USD', 'home_appliances', 50,
  '1.8L Electric Kettle — export-grade Home Appliances from Hangzhou Cardinal Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'غلاية كهربائية 1.8 لتر — منتج أجهزة منزلية للتصدير من Hangzhou Cardinal Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-48-1-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-48-1-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-1-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 20,
  true, 27.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-48@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('1.8L Electric Kettle'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 18
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-48@example.com'
  and lower(pr.name_en) = lower('1.8L Electric Kettle')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'قلاية هوائية رقمية', 'Digital Air Fryer', '数字空气炸锅', 'USD', 'home_appliances', 55,
  'Digital Air Fryer — export-grade Home Appliances from Hangzhou Cardinal Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'قلاية هوائية رقمية — منتج أجهزة منزلية للتصدير من Hangzhou Cardinal Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-48-2-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-48-2-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-2-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 21,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-48@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Digital Air Fryer'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 32
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-48@example.com'
  and lower(pr.name_en) = lower('Digital Air Fryer')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خلاط عمودي 1000 واط', 'Stand Mixer 1000W', '1000W厨师机', 'USD', 'home_appliances', 60,
  'Stand Mixer 1000W — export-grade Home Appliances from Hangzhou Cardinal Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خلاط عمودي 1000 واط — منتج أجهزة منزلية للتصدير من Hangzhou Cardinal Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-48-3-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-48-3-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-3-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 22,
  true, 69.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-48@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Stand Mixer 1000W'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 46
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-48@example.com'
  and lower(pr.name_en) = lower('Stand Mixer 1000W')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكنسة روبوت', 'Robot Vacuum Cleaner', '扫地机器人', 'USD', 'home_appliances', 65,
  'Robot Vacuum Cleaner — export-grade Home Appliances from Hangzhou Cardinal Home Appliance Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكنسة روبوت — منتج أجهزة منزلية للتصدير من Hangzhou Cardinal Home Appliance Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-home_appliances-48-4-1/1200/900', array['https://picsum.photos/seed/maabar-home_appliances-48-4-1/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-4-2/1200/900', 'https://picsum.photos/seed/maabar-home_appliances-48-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 23,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-48@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Robot Vacuum Cleaner'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 60
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-48@example.com'
  and lower(pr.name_en) = lower('Robot Vacuum Cleaner')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Suzhou Meridian Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كنبة قماش 3 مقاعد', '3-Seater Fabric Sofa', '三人布艺沙发', 'USD', 'furniture', 20,
  '3-Seater Fabric Sofa — export-grade Furniture from Suzhou Meridian Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كنبة قماش 3 مقاعد — منتج أثاث للتصدير من Suzhou Meridian Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-49-1-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-49-1-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-1-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 210.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-49@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Seater Fabric Sofa'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 140
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-49@example.com'
  and lower(pr.name_en) = lower('3-Seater Fabric Sofa')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طقم طعام 6 كراسي', '6-Seat Dining Set', '六人餐桌套装', 'USD', 'furniture', 22,
  '6-Seat Dining Set — export-grade Furniture from Suzhou Meridian Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طقم طعام 6 كراسي — منتج أثاث للتصدير من Suzhou Meridian Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-49-2-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-49-2-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-2-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-49@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('6-Seat Dining Set'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 230
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-49@example.com'
  and lower(pr.name_en) = lower('6-Seat Dining Set')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة بأبواب منزلقة', 'Sliding-Door Wardrobe', '移门衣柜', 'USD', 'furniture', 24,
  'Sliding-Door Wardrobe — export-grade Furniture from Suzhou Meridian Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة بأبواب منزلقة — منتج أثاث للتصدير من Suzhou Meridian Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-49-3-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-49-3-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-3-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 32,
  true, 480.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-49@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Sliding-Door Wardrobe'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 320
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-49@example.com'
  and lower(pr.name_en) = lower('Sliding-Door Wardrobe')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة قهوة عصرية', 'Modern Coffee Table', '现代茶几', 'USD', 'furniture', 26,
  'Modern Coffee Table — export-grade Furniture from Suzhou Meridian Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة قهوة عصرية — منتج أثاث للتصدير من Suzhou Meridian Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-furniture-49-4-1/1200/900', array['https://picsum.photos/seed/maabar-furniture-49-4-1/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-4-2/1200/900', 'https://picsum.photos/seed/maabar-furniture-49-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 33,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-49@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Modern Coffee Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 410
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-49@example.com'
  and lower(pr.name_en) = lower('Modern Coffee Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- products for Qingdao Falcon Office Furniture Co., Ltd.
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'كرسي مكتب مريح', 'Ergonomic Office Chair', '人体工学办公椅', 'USD', 'office_furniture', 15,
  'Ergonomic Office Chair — export-grade Office Furniture from Qingdao Falcon Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'كرسي مكتب مريح — منتج أثاث مكتبي للتصدير من Qingdao Falcon Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-50-1-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-50-1-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-1-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-1-3/1200/900']::text[], 'Export-grade materials', '0.30 kg',
  'Black / White / Custom', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 28,
  true, 120.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-50@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Ergonomic Office Chair'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 80
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-50@example.com'
  and lower(pr.name_en) = lower('Ergonomic Office Chair')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'مكتب تنفيذي', 'Executive Office Desk', '行政办公桌', 'USD', 'office_furniture', 17,
  'Executive Office Desk — export-grade Office Furniture from Qingdao Falcon Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'مكتب تنفيذي — منتج أثاث مكتبي للتصدير من Qingdao Falcon Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-50-2-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-50-2-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-2-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-2-3/1200/900']::text[], 'Export-grade materials', '0.70 kg',
  'Standard export assortment', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 29,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-50@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Executive Office Desk'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 140
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-50@example.com'
  and lower(pr.name_en) = lower('Executive Office Desk')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'خزانة ملفات 3 أدراج', '3-Drawer Filing Cabinet', '三抽文件柜', 'USD', 'office_furniture', 19,
  '3-Drawer Filing Cabinet — export-grade Office Furniture from Qingdao Falcon Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'خزانة ملفات 3 أدراج — منتج أثاث مكتبي للتصدير من Qingdao Falcon Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-50-3-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-50-3-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-3-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-3-3/1200/900']::text[], 'Export-grade materials', '1.10 kg',
  'Black / Silver / Blue', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 30,
  true, 300.00, 8, 5, 'Pre-production sample available.', true
from public.profiles p
where p.email = 'seed-supplier-50@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('3-Drawer Filing Cabinet'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 200
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-50@example.com'
  and lower(pr.name_en) = lower('3-Drawer Filing Cabinet')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);
insert into public.products (
  supplier_id, name_ar, name_en, name_zh, currency, category, moq,
  desc_en, desc_ar, image_url, gallery_images, spec_material, spec_unit_weight,
  spec_color_options, spec_packaging_details, spec_customization, spec_lead_time_days,
  sample_available, sample_price, sample_shipping, sample_max_qty, sample_note, is_active
)
select p.id, 'طاولة اجتماعات', 'Conference Meeting Table', '会议桌', 'USD', 'office_furniture', 21,
  'Conference Meeting Table — export-grade Office Furniture from Qingdao Falcon Office Furniture Co., Ltd. Demo-safe synthetic listing for marketplace presentation only.', 'طاولة اجتماعات — منتج أثاث مكتبي للتصدير من Qingdao Falcon Office Furniture Co., Ltd. عرض تجريبي آمن لمنصة مَعبر فقط.', 'https://picsum.photos/seed/maabar-office_furniture-50-4-1/1200/900', array['https://picsum.photos/seed/maabar-office_furniture-50-4-1/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-4-2/1200/900', 'https://picsum.photos/seed/maabar-office_furniture-50-4-3/1200/900']::text[], 'Export-grade materials', '1.50 kg',
  'Brand-matched colors', 'Master-carton export packing with barcode-ready labels.', 'Logo printing, custom packaging, and Arabic labeling on request.', 31,
  false, null, null, null, null, true
from public.profiles p
where p.email = 'seed-supplier-50@example.com'
  and not exists (select 1 from public.products x where x.supplier_id = p.id and lower(x.name_en) = lower('Conference Meeting Table'));
-- price lives in product_pricing_tiers (products.price_from was dropped in phase 4)
insert into public.product_pricing_tiers (product_id, variant_id, qty_from, qty_to, unit_price)
select pr.id, null, 1, null, 260
from public.products pr
join public.profiles p on p.id = pr.supplier_id
where p.email = 'seed-supplier-50@example.com'
  and lower(pr.name_en) = lower('Conference Meeting Table')
  and not exists (select 1 from public.product_pricing_tiers t where t.product_id = pr.id and t.variant_id is null);

-- ── 6. Buyer requests (status=open, payment_plan in {30,100}) ────────────────
insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب سماعات لاسلكية برو للسوق السعودي', 'Sourcing Wireless Earbuds Pro for Saudi retail', '采购 无线耳机Pro（沙特零售）', '500 units', 'Bulk sourcing request for Wireless Earbuds Pro (Electronics). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'electronics', 'open', 10, 30, 'none', 'https://picsum.photos/seed/maabar-request-electronics-1/1200/900'
from public.profiles p
where p.email = 'demo-trader@maabar.io'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Wireless Earbuds Pro for Saudi retail') and coalesce(x.quantity,'') = '500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب قلاية هوائية رقمية للسوق السعودي', 'Sourcing Digital Air Fryer for Saudi retail', '采购 数字空气炸锅（沙特零售）', '750 units', 'Bulk sourcing request for Digital Air Fryer (Home Appliances). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'home_appliances', 'open', 34, 100, 'preferred', 'https://picsum.photos/seed/maabar-request-home_appliances-2/1200/900'
from public.profiles p
where p.email = 'seed-trader-2@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Digital Air Fryer for Saudi retail') and coalesce(x.quantity,'') = '750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب خزانة بأبواب منزلقة للسوق السعودي', 'Sourcing Sliding-Door Wardrobe for Saudi retail', '采购 移门衣柜（沙特零售）', '1000 units', 'Bulk sourcing request for Sliding-Door Wardrobe (Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'furniture', 'open', 322, 30, 'required', 'https://picsum.photos/seed/maabar-request-furniture-3/1200/900'
from public.profiles p
where p.email = 'seed-trader-3@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Sliding-Door Wardrobe for Saudi retail') and coalesce(x.quantity,'') = '1000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب طاولة اجتماعات للسوق السعودي', 'Sourcing Conference Meeting Table for Saudi retail', '采购 会议桌（沙特零售）', '1250 units', 'Bulk sourcing request for Conference Meeting Table (Office Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'office_furniture', 'open', 262, 100, 'none', 'https://picsum.photos/seed/maabar-request-office_furniture-4/1200/900'
from public.profiles p
where p.email = 'seed-trader-4@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Conference Meeting Table for Saudi retail') and coalesce(x.quantity,'') = '1250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب سرير منجد للسوق السعودي', 'Sourcing Upholstered Bed Frame for Saudi retail', '采购 软包床架（沙特零售）', '1500 units', 'Bulk sourcing request for Upholstered Bed Frame (Bedroom Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'bedroom_furniture', 'open', 122, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-bedroom_furniture-5/1200/900'
from public.profiles p
where p.email = 'seed-trader-5@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Upholstered Bed Frame for Saudi retail') and coalesce(x.quantity,'') = '1500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب جزيرة مطبخ للسوق السعودي', 'Sourcing Kitchen Island Unit for Saudi retail', '采购 厨房中岛（沙特零售）', '1750 units', 'Bulk sourcing request for Kitchen Island Unit (Kitchen Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'kitchen_furniture', 'open', 282, 100, 'required', 'https://picsum.photos/seed/maabar-request-kitchen_furniture-6/1200/900'
from public.profiles p
where p.email = 'demo-trader@maabar.io'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Kitchen Island Unit for Saudi retail') and coalesce(x.quantity,'') = '1750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب كرسي استرخاء خارجي للسوق السعودي', 'Sourcing Outdoor Lounge Chair for Saudi retail', '采购 户外躺椅（沙特零售）', '2000 units', 'Bulk sourcing request for Outdoor Lounge Chair (Outdoor Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'outdoor_furniture', 'open', 152, 30, 'none', 'https://picsum.photos/seed/maabar-request-outdoor_furniture-7/1200/900'
from public.profiles p
where p.email = 'seed-trader-2@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Outdoor Lounge Chair for Saudi retail') and coalesce(x.quantity,'') = '2000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب شموع معطرة للسوق السعودي', 'Sourcing Scented Candle Set for Saudi retail', '采购 香薰蜡烛套装（沙特零售）', '2250 units', 'Bulk sourcing request for Scented Candle Set (Home Décor). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'home_decor', 'open', 44, 100, 'preferred', 'https://picsum.photos/seed/maabar-request-home_decor-8/1200/900'
from public.profiles p
where p.email = 'seed-trader-3@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Scented Candle Set for Saudi retail') and coalesce(x.quantity,'') = '2250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب تيشيرت قطن بالجملة للسوق السعودي', 'Sourcing Cotton T-Shirt (Bulk) for Saudi retail', '采购 纯棉T恤（沙特零售）', '2500 units', 'Bulk sourcing request for Cotton T-Shirt (Bulk) (Clothing). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'clothing', 'open', 6, 30, 'required', 'https://picsum.photos/seed/maabar-request-clothing-9/1200/900'
from public.profiles p
where p.email = 'seed-trader-4@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Cotton T-Shirt (Bulk) for Saudi retail') and coalesce(x.quantity,'') = '2500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب ألواح جدران PVC للسوق السعودي', 'Sourcing PVC Wall Panels for Saudi retail', '采购 PVC墙板（沙特零售）', '2750 units', 'Bulk sourcing request for PVC Wall Panels (Building Materials). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'building', 'open', 11, 100, 'none', 'https://picsum.photos/seed/maabar-request-building-10/1200/900'
from public.profiles p
where p.email = 'seed-trader-5@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing PVC Wall Panels for Saudi retail') and coalesce(x.quantity,'') = '2750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب مكسرات مشكلة للسوق السعودي', 'Sourcing Mixed Nuts (Bulk) for Saudi retail', '采购 混合坚果（沙特零售）', '3000 units', 'Bulk sourcing request for Mixed Nuts (Bulk) (Food). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'food', 'open', 22, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-food-11/1200/900'
from public.profiles p
where p.email = 'demo-trader@maabar.io'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Mixed Nuts (Bulk) for Saudi retail') and coalesce(x.quantity,'') = '3000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب أدوات تصفيف شعر للسوق السعودي', 'Sourcing Hair Styling Tool Kit for Saudi retail', '采购 美发造型套装（沙特零售）', '3250 units', 'Bulk sourcing request for Hair Styling Tool Kit (Beauty & Personal Care). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'beauty', 'open', 17, 100, 'required', 'https://picsum.photos/seed/maabar-request-beauty-12/1200/900'
from public.profiles p
where p.email = 'seed-trader-2@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Hair Styling Tool Kit for Saudi retail') and coalesce(x.quantity,'') = '3250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب سجادة يوغا للسوق السعودي', 'Sourcing Non-Slip Yoga Mat for Saudi retail', '采购 防滑瑜伽垫（沙特零售）', '3500 units', 'Bulk sourcing request for Non-Slip Yoga Mat (Sports). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'sports', 'open', 11, 30, 'none', 'https://picsum.photos/seed/maabar-request-sports-13/1200/900'
from public.profiles p
where p.email = 'seed-trader-3@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Non-Slip Yoga Mat for Saudi retail') and coalesce(x.quantity,'') = '3500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب سيارة تحكم للسوق السعودي', 'Sourcing RC Stunt Car for Saudi retail', '采购 遥控特技车（沙特零售）', '3750 units', 'Bulk sourcing request for RC Stunt Car (Toys). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'toys', 'open', 10, 100, 'preferred', 'https://picsum.photos/seed/maabar-request-toys-14/1200/900'
from public.profiles p
where p.email = 'seed-trader-4@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing RC Stunt Car for Saudi retail') and coalesce(x.quantity,'') = '3750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب طقم كشافات LED للسوق السعودي', 'Sourcing LED Headlight Kit for Saudi retail', '采购 LED大灯（沙特零售）', '4000 units', 'Bulk sourcing request for LED Headlight Kit (Auto Parts). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'auto_parts', 'open', 50, 30, 'required', 'https://picsum.photos/seed/maabar-request-auto_parts-15/1200/900'
from public.profiles p
where p.email = 'seed-trader-5@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing LED Headlight Kit for Saudi retail') and coalesce(x.quantity,'') = '4000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب دعاسات أرضية للسوق السعودي', 'Sourcing All-Weather Floor Mats for Saudi retail', '采购 全天候脚垫（沙特零售）', '4250 units', 'Bulk sourcing request for All-Weather Floor Mats (Car Accessories). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'car_accessories', 'open', 32, 100, 'none', 'https://picsum.photos/seed/maabar-request-car_accessories-16/1200/900'
from public.profiles p
where p.email = 'demo-trader@maabar.io'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing All-Weather Floor Mats for Saudi retail') and coalesce(x.quantity,'') = '4250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب إطار سيارة ركاب للسوق السعودي', 'Sourcing Passenger Car Tire for Saudi retail', '采购 轿车轮胎（沙特零售）', '4500 units', 'Bulk sourcing request for Passenger Car Tire (Tires). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'tires', 'open', 37, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-tires-17/1200/900'
from public.profiles p
where p.email = 'seed-trader-2@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Passenger Car Tire for Saudi retail') and coalesce(x.quantity,'') = '4500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب زيت تروس للسوق السعودي', 'Sourcing Gear Oil 80W-90 for Saudi retail', '采购 齿轮油（沙特零售）', '4750 units', 'Bulk sourcing request for Gear Oil 80W-90 (Lubricants & Oils). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'lubricants', 'open', 13, 100, 'required', 'https://picsum.photos/seed/maabar-request-lubricants-18/1200/900'
from public.profiles p
where p.email = 'seed-trader-3@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Gear Oil 80W-90 for Saudi retail') and coalesce(x.quantity,'') = '4750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب مقياس أكسجين للسوق السعودي', 'Sourcing Fingertip Pulse Oximeter for Saudi retail', '采购 指夹血氧仪（沙特零售）', '5000 units', 'Bulk sourcing request for Fingertip Pulse Oximeter (Health & Medical). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'health', 'open', 24, 30, 'none', 'https://picsum.photos/seed/maabar-request-health-19/1200/900'
from public.profiles p
where p.email = 'seed-trader-4@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Fingertip Pulse Oximeter for Saudi retail') and coalesce(x.quantity,'') = '5000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب لفائف فقاعات للسوق السعودي', 'Sourcing Bubble Wrap Rolls for Saudi retail', '采购 气泡膜卷（沙特零售）', '5250 units', 'Bulk sourcing request for Bubble Wrap Rolls (Packaging). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'packaging', 'open', 5.7, 100, 'preferred', 'https://picsum.photos/seed/maabar-request-packaging-20/1200/900'
from public.profiles p
where p.email = 'seed-trader-5@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Bubble Wrap Rolls for Saudi retail') and coalesce(x.quantity,'') = '5250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب علب هدايا فاخرة للسوق السعودي', 'Sourcing Premium Gift Box Set for Saudi retail', '采购 精品礼盒（沙特零售）', '5500 units', 'Bulk sourcing request for Premium Gift Box Set (Gifts). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'gifts', 'open', 4, 30, 'required', 'https://picsum.photos/seed/maabar-request-gifts-21/1200/900'
from public.profiles p
where p.email = 'demo-trader@maabar.io'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Premium Gift Box Set for Saudi retail') and coalesce(x.quantity,'') = '5500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب غشاء بيوت محمية للسوق السعودي', 'Sourcing Greenhouse Film Roll for Saudi retail', '采购 大棚膜（沙特零售）', '5750 units', 'Bulk sourcing request for Greenhouse Film Roll (Agriculture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'agriculture', 'open', 26, 100, 'none', 'https://picsum.photos/seed/maabar-request-agriculture-22/1200/900'
from public.profiles p
where p.email = 'seed-trader-2@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Greenhouse Film Roll for Saudi retail') and coalesce(x.quantity,'') = '5750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب قفازات عمل للسوق السعودي', 'Sourcing Work Gloves (Bulk) for Saudi retail', '采购 劳保手套（沙特零售）', '6000 units', 'Bulk sourcing request for Work Gloves (Bulk) (Other). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'other', 'open', 29, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-other-23/1200/900'
from public.profiles p
where p.email = 'seed-trader-3@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Work Gloves (Bulk) for Saudi retail') and coalesce(x.quantity,'') = '6000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب مكبر صوت بلوتوث للسوق السعودي', 'Sourcing Portable Bluetooth Speaker for Saudi retail', '采购 便携蓝牙音箱（沙特零售）', '6250 units', 'Bulk sourcing request for Portable Bluetooth Speaker (Electronics). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'electronics', 'open', 37, 100, 'required', 'https://picsum.photos/seed/maabar-request-electronics-24/1200/900'
from public.profiles p
where p.email = 'seed-trader-4@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Portable Bluetooth Speaker for Saudi retail') and coalesce(x.quantity,'') = '6250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب غلاية كهربائية 1.8 لتر للسوق السعودي', 'Sourcing 1.8L Electric Kettle for Saudi retail', '采购 1.8L电热水壶（沙特零售）', '6500 units', 'Bulk sourcing request for 1.8L Electric Kettle (Home Appliances). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'home_appliances', 'open', 20, 30, 'none', 'https://picsum.photos/seed/maabar-request-home_appliances-25/1200/900'
from public.profiles p
where p.email = 'seed-trader-5@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing 1.8L Electric Kettle for Saudi retail') and coalesce(x.quantity,'') = '6500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب طقم طعام 6 كراسي للسوق السعودي', 'Sourcing 6-Seat Dining Set for Saudi retail', '采购 六人餐桌套装（沙特零售）', '6750 units', 'Bulk sourcing request for 6-Seat Dining Set (Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'furniture', 'open', 232, 100, 'preferred', 'https://picsum.photos/seed/maabar-request-furniture-26/1200/900'
from public.profiles p
where p.email = 'demo-trader@maabar.io'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing 6-Seat Dining Set for Saudi retail') and coalesce(x.quantity,'') = '6750 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب خزانة ملفات 3 أدراج للسوق السعودي', 'Sourcing 3-Drawer Filing Cabinet for Saudi retail', '采购 三抽文件柜（沙特零售）', '7000 units', 'Bulk sourcing request for 3-Drawer Filing Cabinet (Office Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'office_furniture', 'open', 202, 30, 'required', 'https://picsum.photos/seed/maabar-request-office_furniture-27/1200/900'
from public.profiles p
where p.email = 'seed-trader-2@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing 3-Drawer Filing Cabinet for Saudi retail') and coalesce(x.quantity,'') = '7000 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب مرتبة إسفنجية للسوق السعودي', 'Sourcing Memory Foam Mattress for Saudi retail', '采购 记忆棉床垫（沙特零售）', '7250 units', 'Bulk sourcing request for Memory Foam Mattress (Bedroom Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'bedroom_furniture', 'open', 332, 100, 'none', 'https://picsum.photos/seed/maabar-request-bedroom_furniture-28/1200/900'
from public.profiles p
where p.email = 'seed-trader-3@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Memory Foam Mattress for Saudi retail') and coalesce(x.quantity,'') = '7250 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب خزانة مطبخ معيارية للسوق السعودي', 'Sourcing Modular Kitchen Cabinet for Saudi retail', '采购 整体橱柜（沙特零售）', '7500 units', 'Bulk sourcing request for Modular Kitchen Cabinet (Kitchen Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'kitchen_furniture', 'open', 162, 30, 'preferred', 'https://picsum.photos/seed/maabar-request-kitchen_furniture-29/1200/900'
from public.profiles p
where p.email = 'seed-trader-4@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Modular Kitchen Cabinet for Saudi retail') and coalesce(x.quantity,'') = '7500 units');

insert into public.requests (
  buyer_id, title_ar, title_en, title_zh, quantity, description, category, status, budget_per_unit, payment_plan, sample_requirement, reference_image
)
select p.id, 'مطلوب مظلة حديقة للسوق السعودي', 'Sourcing Garden Sun Umbrella for Saudi retail', '采购 户外遮阳伞（沙特零售）', '7750 units', 'Bulk sourcing request for Garden Sun Umbrella (Outdoor Furniture). Export packaging, Arabic labeling, and stable carton packing required. Demo-safe synthetic request.', 'outdoor_furniture', 'open', 107, 100, 'required', 'https://picsum.photos/seed/maabar-request-outdoor_furniture-30/1200/900'
from public.profiles p
where p.email = 'seed-trader-5@example.com'
  and not exists (select 1 from public.requests x where x.buyer_id = p.id and lower(x.title_en) = lower('Sourcing Garden Sun Umbrella for Saudi retail') and coalesce(x.quantity,'') = '7750 units');

commit;

-- Spot-check after running:
--   select count(*) from public.profiles where role='supplier' and status='verified' and maabar_supplier_id like 'MS-0090%';   -- 50
--   select count(*) from public.products where is_active = true;   -- >= 200
--   select count(*) from public.requests where status='open';      -- >= 30