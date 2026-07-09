-- ============================================================
-- Special occasions (holidays / recurring dates)
-- ------------------------------------------------------------
-- Merchants can define any number of fixed-date offers (Valentine's,
-- a holiday, an anniversary, "slow Tuesday sale", etc). On the date
-- (minus an optional lead time) every opted-in customer of the shop
-- gets an ANNOUNCEMENT — a push notification if they have the app,
-- otherwise an email. Announcements do NOT issue a tracked reward and
-- are NOT metered, so broadcasting a holiday offer costs nothing per
-- customer. (Birthday rewards, which go to one person, stay tracked +
-- metered — see 20260704_birthday_rewards.sql.)
--
-- occasion_sends is unique on (occasion_id, customer_id, send_year) so
-- the daily cron is idempotent: one send per customer per occasion per
-- year no matter how often it runs.
-- ============================================================

CREATE TABLE IF NOT EXISTS shop_occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug text NOT NULL REFERENCES shops(slug) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  day smallint NOT NULL CHECK (day BETWEEN 1 AND 31),
  days_before smallint NOT NULL DEFAULT 0 CHECK (days_before BETWEEN 0 AND 60),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_occasions_shop_idx ON shop_occasions (shop_slug);
CREATE INDEX IF NOT EXISTS shop_occasions_active_idx ON shop_occasions (enabled) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS occasion_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_id uuid NOT NULL REFERENCES shop_occasions(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  send_year int NOT NULL,
  channel text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occasion_id, customer_id, send_year)
);

CREATE INDEX IF NOT EXISTS occasion_sends_occasion_idx ON occasion_sends (occasion_id);

ALTER TABLE shop_occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE occasion_sends ENABLE ROW LEVEL SECURITY;
