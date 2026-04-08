-- Demo auth user seed for MAABAR synthetic marketplace
-- Safe synthetic accounts only
begin;
select set_config('request.jwt.claim.role', 'service_role', true);

-- auth seed: supplier-consumer-electronics
do $$
declare
  v_email text := 'seed.supplier.consumer-electronics@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-consumer-electronics';
  v_full_name text := 'VoltBridge Consumer Tech Co., Ltd.';
  v_company_name text := 'VoltBridge Consumer Tech Co., Ltd.';
  v_phone text := null;
  v_city text := 'Shenzhen';
  v_country text := 'China';
  v_trade_link text := 'https://trade.voltbridge-demo.example/storefront';
  v_speciality text := 'Consumer Electronics & Mobile Accessories';
  v_maabar_supplier_id text := 'MS-009001';
  v_user_meta jsonb := '{"company_name": "VoltBridge Consumer Tech Co., Ltd.", "city": "Shenzhen", "country": "China", "trade_link": "https://trade.voltbridge-demo.example/storefront", "speciality": "Consumer Electronics & Mobile Accessories", "status": "registered", "role": "supplier", "seed_key": "supplier-consumer-electronics", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-consumer-electronics", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-smart-home-security
do $$
declare
  v_email text := 'seed.supplier.smart-home-security@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-smart-home-security';
  v_full_name text := 'HomeMesh Secure Systems Co., Ltd.';
  v_company_name text := 'HomeMesh Secure Systems Co., Ltd.';
  v_phone text := null;
  v_city text := 'Hangzhou';
  v_country text := 'China';
  v_trade_link text := 'https://trade.homemesh-demo.example/security';
  v_speciality text := 'Smart Home, Access Control & Security';
  v_maabar_supplier_id text := 'MS-009002';
  v_user_meta jsonb := '{"company_name": "HomeMesh Secure Systems Co., Ltd.", "city": "Hangzhou", "country": "China", "trade_link": "https://trade.homemesh-demo.example/security", "speciality": "Smart Home, Access Control & Security", "status": "registered", "role": "supplier", "seed_key": "supplier-smart-home-security", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-smart-home-security", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-solar-energy-storage
do $$
declare
  v_email text := 'seed.supplier.solar-energy-storage@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-solar-energy-storage';
  v_full_name text := 'SunHarbor Energy Tech Co., Ltd.';
  v_company_name text := 'SunHarbor Energy Tech Co., Ltd.';
  v_phone text := null;
  v_city text := 'Ningbo';
  v_country text := 'China';
  v_trade_link text := 'https://trade.sunharbor-demo.example/solar';
  v_speciality text := 'Solar Energy, Inverters & Storage';
  v_maabar_supplier_id text := 'MS-009003';
  v_user_meta jsonb := '{"company_name": "SunHarbor Energy Tech Co., Ltd.", "city": "Ningbo", "country": "China", "trade_link": "https://trade.sunharbor-demo.example/solar", "speciality": "Solar Energy, Inverters & Storage", "status": "registered", "role": "supplier", "seed_key": "supplier-solar-energy-storage", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-solar-energy-storage", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-building-materials-hardware
do $$
declare
  v_email text := 'seed.supplier.building-materials-hardware@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-building-materials-hardware';
  v_full_name text := 'StoneAxis Building Supply Co., Ltd.';
  v_company_name text := 'StoneAxis Building Supply Co., Ltd.';
  v_phone text := null;
  v_city text := 'Foshan';
  v_country text := 'China';
  v_trade_link text := 'https://trade.stoneaxis-demo.example/materials';
  v_speciality text := 'Building Materials, Fixtures & Hardware';
  v_maabar_supplier_id text := 'MS-009004';
  v_user_meta jsonb := '{"company_name": "StoneAxis Building Supply Co., Ltd.", "city": "Foshan", "country": "China", "trade_link": "https://trade.stoneaxis-demo.example/materials", "speciality": "Building Materials, Fixtures & Hardware", "status": "registered", "role": "supplier", "seed_key": "supplier-building-materials-hardware", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-building-materials-hardware", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-hospitality-furniture
do $$
declare
  v_email text := 'seed.supplier.hospitality-furniture@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-hospitality-furniture';
  v_full_name text := 'HarborNest Furnishings Co., Ltd.';
  v_company_name text := 'HarborNest Furnishings Co., Ltd.';
  v_phone text := null;
  v_city text := 'Foshan';
  v_country text := 'China';
  v_trade_link text := 'https://trade.harbornest-demo.example/furniture';
  v_speciality text := 'Hospitality, Office & Residential Furniture';
  v_maabar_supplier_id text := 'MS-009005';
  v_user_meta jsonb := '{"company_name": "HarborNest Furnishings Co., Ltd.", "city": "Foshan", "country": "China", "trade_link": "https://trade.harbornest-demo.example/furniture", "speciality": "Hospitality, Office & Residential Furniture", "status": "registered", "role": "supplier", "seed_key": "supplier-hospitality-furniture", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-hospitality-furniture", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-packaging-printing
do $$
declare
  v_email text := 'seed.supplier.packaging-printing@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-packaging-printing';
  v_full_name text := 'PackFolio Print & Pack Co., Ltd.';
  v_company_name text := 'PackFolio Print & Pack Co., Ltd.';
  v_phone text := null;
  v_city text := 'Qingdao';
  v_country text := 'China';
  v_trade_link text := 'https://trade.packfolio-demo.example/packaging';
  v_speciality text := 'Packaging, Labels & Printing';
  v_maabar_supplier_id text := 'MS-009006';
  v_user_meta jsonb := '{"company_name": "PackFolio Print & Pack Co., Ltd.", "city": "Qingdao", "country": "China", "trade_link": "https://trade.packfolio-demo.example/packaging", "speciality": "Packaging, Labels & Printing", "status": "registered", "role": "supplier", "seed_key": "supplier-packaging-printing", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-packaging-printing", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-textiles-apparel
do $$
declare
  v_email text := 'seed.supplier.textiles-apparel@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-textiles-apparel';
  v_full_name text := 'LoomPeak Textile Works Co., Ltd.';
  v_company_name text := 'LoomPeak Textile Works Co., Ltd.';
  v_phone text := null;
  v_city text := 'Shaoxing';
  v_country text := 'China';
  v_trade_link text := 'https://trade.loompeak-demo.example/textiles';
  v_speciality text := 'Textiles, Uniforms & Apparel';
  v_maabar_supplier_id text := 'MS-009007';
  v_user_meta jsonb := '{"company_name": "LoomPeak Textile Works Co., Ltd.", "city": "Shaoxing", "country": "China", "trade_link": "https://trade.loompeak-demo.example/textiles", "speciality": "Textiles, Uniforms & Apparel", "status": "registered", "role": "supplier", "seed_key": "supplier-textiles-apparel", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-textiles-apparel", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-beauty-packaging-care
do $$
declare
  v_email text := 'seed.supplier.beauty-packaging-care@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-beauty-packaging-care';
  v_full_name text := 'PureForm Beauty Pack Co., Ltd.';
  v_company_name text := 'PureForm Beauty Pack Co., Ltd.';
  v_phone text := null;
  v_city text := 'Guangzhou';
  v_country text := 'China';
  v_trade_link text := 'https://trade.pureform-demo.example/beauty';
  v_speciality text := 'Beauty Packaging & Personal Care Tools';
  v_maabar_supplier_id text := 'MS-009008';
  v_user_meta jsonb := '{"company_name": "PureForm Beauty Pack Co., Ltd.", "city": "Guangzhou", "country": "China", "trade_link": "https://trade.pureform-demo.example/beauty", "speciality": "Beauty Packaging & Personal Care Tools", "status": "registered", "role": "supplier", "seed_key": "supplier-beauty-packaging-care", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-beauty-packaging-care", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-foodservice-kitchen
do $$
declare
  v_email text := 'seed.supplier.foodservice-kitchen@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-foodservice-kitchen';
  v_full_name text := 'KitchenRoute Supply Co., Ltd.';
  v_company_name text := 'KitchenRoute Supply Co., Ltd.';
  v_phone text := null;
  v_city text := 'Xiamen';
  v_country text := 'China';
  v_trade_link text := 'https://trade.kitchenroute-demo.example/horeca';
  v_speciality text := 'Food Service, Kitchen & HORECA Supplies';
  v_maabar_supplier_id text := 'MS-009009';
  v_user_meta jsonb := '{"company_name": "KitchenRoute Supply Co., Ltd.", "city": "Xiamen", "country": "China", "trade_link": "https://trade.kitchenroute-demo.example/horeca", "speciality": "Food Service, Kitchen & HORECA Supplies", "status": "registered", "role": "supplier", "seed_key": "supplier-foodservice-kitchen", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-foodservice-kitchen", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: supplier-industrial-tools-safety
do $$
declare
  v_email text := 'seed.supplier.industrial-tools-safety@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'supplier';
  v_status text := 'registered';
  v_seed_key text := 'supplier-industrial-tools-safety';
  v_full_name text := 'ForgeGrid Industrial Co., Ltd.';
  v_company_name text := 'ForgeGrid Industrial Co., Ltd.';
  v_phone text := null;
  v_city text := 'Suzhou';
  v_country text := 'China';
  v_trade_link text := 'https://trade.forgegrid-demo.example/tools';
  v_speciality text := 'Industrial Tools, Safety & Site Equipment';
  v_maabar_supplier_id text := 'MS-009010';
  v_user_meta jsonb := '{"company_name": "ForgeGrid Industrial Co., Ltd.", "city": "Suzhou", "country": "China", "trade_link": "https://trade.forgegrid-demo.example/tools", "speciality": "Industrial Tools, Safety & Site Equipment", "status": "registered", "role": "supplier", "seed_key": "supplier-industrial-tools-safety", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "supplier", "seed_key": "supplier-industrial-tools-safety", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-riyadh-retail-group
do $$
declare
  v_email text := 'seed.trader.riyadh-retail-group@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-riyadh-retail-group';
  v_full_name text := 'Faisal Alqahtani';
  v_company_name text := 'Riyadh Retail Group';
  v_phone text := '+966550101001';
  v_city text := 'Riyadh';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Faisal Alqahtani", "phone": "+966550101001", "city": "Riyadh", "company_name": "Riyadh Retail Group", "status": "active", "role": "buyer", "seed_key": "trader-riyadh-retail-group", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-riyadh-retail-group", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-jeddah-gadgets
do $$
declare
  v_email text := 'seed.trader.jeddah-gadgets@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-jeddah-gadgets';
  v_full_name text := 'Huda Alharbi';
  v_company_name text := 'Jeddah Gadgets Trading';
  v_phone text := '+966550101002';
  v_city text := 'Jeddah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Huda Alharbi", "phone": "+966550101002", "city": "Jeddah", "company_name": "Jeddah Gadgets Trading", "status": "active", "role": "buyer", "seed_key": "trader-jeddah-gadgets", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-jeddah-gadgets", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-khobar-smart-living
do $$
declare
  v_email text := 'seed.trader.khobar-smart-living@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-khobar-smart-living';
  v_full_name text := 'Mazen Alotaibi';
  v_company_name text := 'Khobar Smart Living';
  v_phone text := '+966550101003';
  v_city text := 'Al Khobar';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Mazen Alotaibi", "phone": "+966550101003", "city": "Al Khobar", "company_name": "Khobar Smart Living", "status": "active", "role": "buyer", "seed_key": "trader-khobar-smart-living", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-khobar-smart-living", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-riyadh-facility-buying
do $$
declare
  v_email text := 'seed.trader.riyadh-facility-buying@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-riyadh-facility-buying';
  v_full_name text := 'Reem Alenzi';
  v_company_name text := 'Riyadh Facility Buying Co.';
  v_phone text := '+966550101004';
  v_city text := 'Riyadh';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Reem Alenzi", "phone": "+966550101004", "city": "Riyadh", "company_name": "Riyadh Facility Buying Co.", "status": "active", "role": "buyer", "seed_key": "trader-riyadh-facility-buying", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-riyadh-facility-buying", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-qassim-green-supply
do $$
declare
  v_email text := 'seed.trader.qassim-green-supply@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-qassim-green-supply';
  v_full_name text := 'Yousef Almutairi';
  v_company_name text := 'Qassim Green Supply';
  v_phone text := '+966550101005';
  v_city text := 'Buraidah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Yousef Almutairi", "phone": "+966550101005", "city": "Buraidah", "company_name": "Qassim Green Supply", "status": "active", "role": "buyer", "seed_key": "trader-qassim-green-supply", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-qassim-green-supply", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-jeddah-site-power
do $$
declare
  v_email text := 'seed.trader.jeddah-site-power@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-jeddah-site-power';
  v_full_name text := 'Sara Alzahrani';
  v_company_name text := 'Jeddah Site Power';
  v_phone text := '+966550101006';
  v_city text := 'Jeddah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Sara Alzahrani", "phone": "+966550101006", "city": "Jeddah", "company_name": "Jeddah Site Power", "status": "active", "role": "buyer", "seed_key": "trader-jeddah-site-power", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-jeddah-site-power", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-riyadh-fitout-group
do $$
declare
  v_email text := 'seed.trader.riyadh-fitout-group@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-riyadh-fitout-group';
  v_full_name text := 'Abdullah Alshehri';
  v_company_name text := 'Riyadh Fitout Group';
  v_phone text := '+966550101007';
  v_city text := 'Riyadh';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Abdullah Alshehri", "phone": "+966550101007", "city": "Riyadh", "company_name": "Riyadh Fitout Group", "status": "active", "role": "buyer", "seed_key": "trader-riyadh-fitout-group", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-riyadh-fitout-group", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-madinah-build-mart
do $$
declare
  v_email text := 'seed.trader.madinah-build-mart@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-madinah-build-mart';
  v_full_name text := 'Waleed Alghamdi';
  v_company_name text := 'Madinah Build Mart';
  v_phone text := '+966550101008';
  v_city text := 'Madinah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Waleed Alghamdi", "phone": "+966550101008", "city": "Madinah", "company_name": "Madinah Build Mart", "status": "active", "role": "buyer", "seed_key": "trader-madinah-build-mart", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-madinah-build-mart", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-jeddah-hospitality-procurement
do $$
declare
  v_email text := 'seed.trader.jeddah-hospitality-procurement@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-jeddah-hospitality-procurement';
  v_full_name text := 'Lama Alghamdi';
  v_company_name text := 'Jeddah Hospitality Procurement';
  v_phone text := '+966550101009';
  v_city text := 'Jeddah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Lama Alghamdi", "phone": "+966550101009", "city": "Jeddah", "company_name": "Jeddah Hospitality Procurement", "status": "active", "role": "buyer", "seed_key": "trader-jeddah-hospitality-procurement", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-jeddah-hospitality-procurement", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-riyadh-office-source
do $$
declare
  v_email text := 'seed.trader.riyadh-office-source@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-riyadh-office-source';
  v_full_name text := 'Nawaf Alsubaie';
  v_company_name text := 'Riyadh Office Source';
  v_phone text := '+966550101010';
  v_city text := 'Riyadh';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Nawaf Alsubaie", "phone": "+966550101010", "city": "Riyadh", "company_name": "Riyadh Office Source", "status": "active", "role": "buyer", "seed_key": "trader-riyadh-office-source", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-riyadh-office-source", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-riyadh-beauty-house
do $$
declare
  v_email text := 'seed.trader.riyadh-beauty-house@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-riyadh-beauty-house';
  v_full_name text := 'Noura Alotaibi';
  v_company_name text := 'Riyadh Beauty House';
  v_phone text := '+966550101011';
  v_city text := 'Riyadh';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Noura Alotaibi", "phone": "+966550101011", "city": "Riyadh", "company_name": "Riyadh Beauty House", "status": "active", "role": "buyer", "seed_key": "trader-riyadh-beauty-house", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-riyadh-beauty-house", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-dammam-food-brand
do $$
declare
  v_email text := 'seed.trader.dammam-food-brand@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-dammam-food-brand';
  v_full_name text := 'Rakan Alrashidi';
  v_company_name text := 'Dammam Food Brand House';
  v_phone text := '+966550101012';
  v_city text := 'Dammam';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Rakan Alrashidi", "phone": "+966550101012", "city": "Dammam", "company_name": "Dammam Food Brand House", "status": "active", "role": "buyer", "seed_key": "trader-dammam-food-brand", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-dammam-food-brand", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-riyadh-uniform-hub
do $$
declare
  v_email text := 'seed.trader.riyadh-uniform-hub@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-riyadh-uniform-hub';
  v_full_name text := 'Raghad Alharbi';
  v_company_name text := 'Riyadh Uniform Hub';
  v_phone text := '+966550101013';
  v_city text := 'Riyadh';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Raghad Alharbi", "phone": "+966550101013", "city": "Riyadh", "company_name": "Riyadh Uniform Hub", "status": "active", "role": "buyer", "seed_key": "trader-riyadh-uniform-hub", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-riyadh-uniform-hub", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-makkah-hotel-linen
do $$
declare
  v_email text := 'seed.trader.makkah-hotel-linen@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-makkah-hotel-linen';
  v_full_name text := 'Khaled Binjaber';
  v_company_name text := 'Makkah Hotel Linen Supply';
  v_phone text := '+966550101014';
  v_city text := 'Makkah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Khaled Binjaber", "phone": "+966550101014", "city": "Makkah", "company_name": "Makkah Hotel Linen Supply", "status": "active", "role": "buyer", "seed_key": "trader-makkah-hotel-linen", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-makkah-hotel-linen", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

-- auth seed: trader-jeddah-salon-source
do $$
declare
  v_email text := 'seed.trader.jeddah-salon-source@example.com';
  v_password text := 'MaabarDemo!2026Seed#';
  v_role text := 'buyer';
  v_status text := 'active';
  v_seed_key text := 'trader-jeddah-salon-source';
  v_full_name text := 'Abeer Alsahli';
  v_company_name text := 'Jeddah Salon Source';
  v_phone text := '+966550101015';
  v_city text := 'Jeddah';
  v_country text := null;
  v_trade_link text := null;
  v_speciality text := null;
  v_maabar_supplier_id text := null;
  v_user_meta jsonb := '{"full_name": "Abeer Alsahli", "phone": "+966550101015", "city": "Jeddah", "company_name": "Jeddah Salon Source", "status": "active", "role": "buyer", "seed_key": "trader-jeddah-salon-source", "seed_group": "demo-marketplace"}'::jsonb;
  v_app_meta jsonb := '{"provider": "email", "providers": ["email"], "role": "buyer", "seed_key": "trader-jeddah-salon-source", "seed_group": "demo-marketplace"}'::jsonb;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, is_sso_user, deleted_at, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(),
      v_app_meta, v_user_meta,
      false, now(), now(),
      nullif(v_phone, ''), case when nullif(v_phone, '') is not null then now() else null end,
      false, null, false
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || v_app_meta,
           raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || v_user_meta,
           phone = coalesce(nullif(v_phone, ''), phone),
           updated_at = now()
     where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = v_user_id and provider = 'email'
  ) then
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id
    ) values (
      v_user_id::text,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', coalesce(nullif(v_phone, ''), '') <> ''),
      'email', now(), now(), now(), gen_random_uuid()
    );
  end if;

  insert into public.profiles (
    id, email, role, status, full_name, company_name, phone, city, country, trade_link, speciality, maabar_supplier_id
  ) values (
    v_user_id, v_email, v_role, v_status, v_full_name, v_company_name, nullif(v_phone, ''), v_city, v_country, v_trade_link, v_speciality, v_maabar_supplier_id
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    company_name = coalesce(excluded.company_name, public.profiles.company_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    city = coalesce(excluded.city, public.profiles.city),
    country = coalesce(excluded.country, public.profiles.country),
    trade_link = coalesce(excluded.trade_link, public.profiles.trade_link),
    speciality = coalesce(excluded.speciality, public.profiles.speciality),
    maabar_supplier_id = coalesce(excluded.maabar_supplier_id, public.profiles.maabar_supplier_id);
end $$;

commit;