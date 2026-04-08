begin;

alter table if exists public.profiles
  add column if not exists payout_beneficiary_name text,
  add column if not exists payout_account_number text,
  add column if not exists payout_branch_name text,
  add column if not exists payout_iban text;

comment on column public.profiles.payout_beneficiary_name is 'Supplier payout beneficiary / account holder name.';
comment on column public.profiles.payout_account_number is 'Supplier payout bank account number.';
comment on column public.profiles.payout_branch_name is 'Optional supplier payout bank branch name.';
comment on column public.profiles.payout_iban is 'Optional supplier payout IBAN.';

commit;
