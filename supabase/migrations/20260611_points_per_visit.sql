-- ============================================================
-- Points earned per visit (replaces spend-based points)
-- ------------------------------------------------------------
-- Points mode now awards a fixed number of points per check-in
-- (like stamps, but with a configurable earn rate and a larger
-- threshold). No dollar amount is captured, so there is no cashier
-- entry — customers self-check-in via QR exactly like stamps.
--
-- The earlier spend columns (shop_settings.points_per_dollar,
-- customers.total_spend, checkins.amount) are left in place but
-- unused; they can back a future POS integration.
-- ============================================================

ALTER TABLE shop_settings
  ADD COLUMN IF NOT EXISTS points_per_visit integer NOT NULL DEFAULT 10
    CHECK (points_per_visit > 0);
