alter table public.profiles
  add column if not exists payout_bank_address text;

comment on column public.profiles.payout_bank_address is 'Payout: optional bank address / branch address for wire transfers';
