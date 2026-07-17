-- ============================================================
-- Retention layer: follows, notification preferences, and a
-- notification log used for frequency caps + idempotent sends.
-- ------------------------------------------------------------
-- All access happens server-side via the service role key (see
-- src/app/api/customer/follows, src/app/api/customer/notification-prefs,
-- src/app/api/cron/retention), so RLS is enabled with no policies —
-- the same lockdown pattern as 20260702_enable_rls_rep_and_scheduled_emails.
-- ============================================================

-- A customer following a shop. Customers are identified by email
-- (lowercased), matching how memberships resolve across shops.
CREATE TABLE IF NOT EXISTS public.customer_follows (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  shop_slug  text NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, shop_slug)
);
CREATE INDEX IF NOT EXISTS idx_customer_follows_shop  ON public.customer_follows(shop_slug);
CREATE INDEX IF NOT EXISTS idx_customer_follows_email ON public.customer_follows(email);

-- Per-type notification opt-outs. Absent row = all types enabled.
CREATE TABLE IF NOT EXISTS public.customer_notification_prefs (
  email                text PRIMARY KEY,
  notify_drops         boolean NOT NULL DEFAULT true,
  notify_reward_expiry boolean NOT NULL DEFAULT true,
  notify_new_nearby    boolean NOT NULL DEFAULT true,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Every retention notification that goes out is claimed here first.
-- The unique index makes the same (customer, type, subject) send at
-- most once no matter how often a cron re-runs; the sent_at index
-- backs the frequency-cap queries.
CREATE TABLE IF NOT EXISTS public.customer_notification_log (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email     text NOT NULL,
  type      text NOT NULL CHECK (type IN ('drop', 'reward_expiry', 'new_nearby')),
  shop_slug text,
  ref_id    text NOT NULL,
  sent_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_notification_log_ref
  ON public.customer_notification_log(email, type, ref_id);
CREATE INDEX IF NOT EXISTS idx_customer_notification_log_email_sent
  ON public.customer_notification_log(email, sent_at);

ALTER TABLE public.customer_follows           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notification_log   ENABLE ROW LEVEL SECURITY;
