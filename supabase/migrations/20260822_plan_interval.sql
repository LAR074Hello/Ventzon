-- ============================================================
-- Rep commission: shops.plan_interval (2026-08-22).
--
--   plan_interval  'monthly' | 'annual' | NULL
--
-- WHY THIS EXISTS. Rep commission is a flat 50% of the plan
-- sold. Annual signups pay a $150 signup commission in month
-- one, then $15/mo recurring; monthly signups earn only the
-- $15/mo recurring commission. The shops table previously had
-- no record of which plan a merchant bought, so every new
-- merchant's first month was credited at the $150 annual rate
-- (over-crediting monthly signups).
--
-- The column ships NULL. Existing shops stay NULL until the
-- Stripe-side backfill (scripts/backfill-plan-interval.mjs)
-- infers the interval from each subscription's price.
-- calcMerchantCommission in src/lib/rep-utils.ts treats NULL
-- as the safe $15/mo monthly treatment — never over-credit.
--
-- ADDITIVE (CLAUDE.md §6). No drops, no data loss. The CHECK
-- only accepts the two known values or NULL; a brand-new
-- column is entirely NULL so the constraint cannot fail on
-- existing rows.
-- ============================================================
alter table public.shops
  add column if not exists plan_interval text;

alter table public.shops
  drop constraint if exists shops_plan_interval_check;

alter table public.shops
  add constraint shops_plan_interval_check
  check (plan_interval is null or plan_interval in ('monthly', 'annual'));
