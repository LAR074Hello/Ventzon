-- ============================================================
-- Customer referral system (2026-08-20).
--
-- Turns the merchant-era referrals table into the shared customer
-- referral system without breaking the existing flow.
--
--   1. customer_profiles.referral_code: every user's shareable,
--      server-assigned, unique code. The column ships NULL; codes are
--      assigned by the server-side backfill
--      (scripts/backfill-referral-codes.mjs) and by the referral API's
--      ensureReferralCode() for new users. Both use the SAME generator.
--   2. referrals self-referral CHECK: one account can never be both
--      referrer and referred.
--
-- referred_email was already UNIQUE, which is the one-referred-account-
-- has-one-referrer rule, enforced by the database, not the client.
--
-- shop_slug stays nullable: merchant/check-in rows and the new customer
-- rows coexist; UNIQUE(referred_email) makes whichever lands first the
-- single, permanent attribution.
--
-- ADDITIVE. Nothing existing is destroyed except clearly-invalid
-- self-referrals (referrer_email = referred_email), which the new
-- CHECK would reject anyway.
-- ============================================================

alter table public.customer_profiles
  add column if not exists referral_code text;

create unique index if not exists idx_customer_profiles_referral_code
  on public.customer_profiles (referral_code);

-- Clearly-invalid rows only: a self-referral is a data error under the
-- new rule and would block the CHECK from being added.
delete from public.referrals
where referrer_email = referred_email;

alter table public.referrals
  drop constraint if exists referrals_no_self_check;

alter table public.referrals
  add constraint referrals_no_self_check
  check (referrer_email <> referred_email);
