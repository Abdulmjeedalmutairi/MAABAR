alter table public.profiles
  add column if not exists bio_en          text,
  add column if not exists bio_ar          text,
  add column if not exists bio_zh          text,
  add column if not exists min_order_value numeric,
  add column if not exists bank_name       text,
  add column if not exists swift_code      text,
  add column if not exists pay_method      text,
  add column if not exists alipay_account  text,
  add column if not exists num_employees   integer;

comment on column public.profiles.bio_en          is 'Supplier bio in English';
comment on column public.profiles.bio_ar          is 'Supplier bio in Arabic';
comment on column public.profiles.bio_zh          is 'Supplier bio in Chinese';
comment on column public.profiles.min_order_value is 'Minimum order value in USD';
comment on column public.profiles.bank_name       is 'Payout: bank name';
comment on column public.profiles.swift_code      is 'Payout: SWIFT/BIC code';
comment on column public.profiles.pay_method      is 'Payout: method (bank | alipay | wise)';
comment on column public.profiles.alipay_account  is 'Payout: Alipay account';
comment on column public.profiles.num_employees   is 'Company size — number of employees';
