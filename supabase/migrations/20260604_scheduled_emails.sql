-- Scheduled email queue for merchant onboarding drip
-- Each signup inserts 3 rows (day1 / day3 / day7).
-- The /api/cron/send-emails route processes pending rows hourly.

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_email  TEXT        NOT NULL,
  shop_slug       TEXT        NOT NULL,
  email_type      TEXT        NOT NULL CHECK (email_type IN ('day1', 'day3', 'day7')),
  send_at         TIMESTAMPTZ NOT NULL,
  sent            BOOLEAN     NOT NULL DEFAULT false,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup for the cron: pending emails where send_at has passed
CREATE INDEX IF NOT EXISTS scheduled_emails_pending_idx
  ON scheduled_emails (send_at)
  WHERE sent = false;
