-- ============================================================
-- Points reward mode
-- ------------------------------------------------------------
-- Adds a second reward mode ("points") alongside the existing
-- stamp/punch-card model. The two share the same underlying
-- machinery:
--   * customers.visits  = generic BALANCE toward the next reward
--   * shop_settings.reward_goal = THRESHOLD to earn a reward
--
-- Stamps mode: each check-in adds 1 (2 on bonus days); balance
--              resets to 0 when the goal is reached.
-- Points mode: each check-in adds round(amount * points_per_dollar);
--              balance carries the remainder (balance -= goal) so
--              overflow from a large purchase is not lost.
-- ============================================================

-- Per-shop reward configuration
ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS reward_mode text NOT NULL DEFAULT 'stamps'
    CHECK (reward_mode IN ('stamps', 'points')),
  ADD COLUMN IF NOT EXISTS points_per_dollar numeric NOT NULL DEFAULT 1
    CHECK (points_per_dollar > 0);

-- Lifetime spend accumulator per customer (points mode only; analytics)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS total_spend numeric NOT NULL DEFAULT 0;

-- Per-transaction dollar amount captured at check-in (points mode).
-- NULL for stamp check-ins. Enables revenue analytics.
ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS amount numeric;
