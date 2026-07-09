-- ============================================================
-- Birthday Rewards automation
-- ------------------------------------------------------------
-- A daily cron finds customers a configurable number of days from
-- their birthday and issues them a reward through the same path a
-- normal check-in reward uses (a reward_events row + a Stripe
-- "reward_redeemed" meter event), then emails them.
--
-- Birthday is stored as month/day only (no year) on the per-shop
-- customer record. Idempotency is guaranteed by birthday_reward_sends,
-- unique on (customer_id, reward_year), so each customer gets at most
-- one birthday reward per shop per calendar year no matter how often
-- the cron runs.
-- ============================================================

-- Month/day birthday on the customer record (no year required)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS birth_month smallint CHECK (birth_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS birth_day smallint CHECK (birth_day BETWEEN 1 AND 31);

CREATE INDEX IF NOT EXISTS customers_birthday_idx
  ON customers (birth_month, birth_day)
  WHERE birth_month IS NOT NULL AND birth_day IS NOT NULL;

-- Per-business birthday reward configuration
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS birthday_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS birthday_reward_title text,
  ADD COLUMN IF NOT EXISTS birthday_days_before smallint NOT NULL DEFAULT 0
    CHECK (birthday_days_before BETWEEN 0 AND 60),
  ADD COLUMN IF NOT EXISTS birthday_expiry_days smallint
    CHECK (birthday_expiry_days IS NULL OR birthday_expiry_days BETWEEN 1 AND 365),
  ADD COLUMN IF NOT EXISTS birthday_message text;

-- Idempotency + audit ledger: one birthday reward per customer per year
CREATE TABLE IF NOT EXISTS birthday_reward_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug text NOT NULL,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reward_year int NOT NULL,
  reward_event_id uuid,
  emailed boolean NOT NULL DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, reward_year)
);

CREATE INDEX IF NOT EXISTS birthday_reward_sends_shop_idx ON birthday_reward_sends (shop_slug);

ALTER TABLE birthday_reward_sends ENABLE ROW LEVEL SECURITY;
