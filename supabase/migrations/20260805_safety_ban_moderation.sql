-- ============================================================
-- Safety: moderation ban column + report queue index
-- (App Store Guideline 1.2 — a mechanism to remove content
--  and eject abusive users).
-- ------------------------------------------------------------
-- A non-null banned_at marks a banned account. Existing content
-- stays in place but is filtered from every public surface
-- (wired via BANNED_COLUMN in src/lib/public-visibility.ts,
-- which verify:dev asserts). Writes are rejected server-side.
-- ============================================================

ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_reports_open
  ON public.reports (created_at DESC)
  WHERE status = 'open';
