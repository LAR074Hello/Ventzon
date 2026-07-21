-- Unread state for the Alerts tab. NULL read_at = unread.
ALTER TABLE public.customer_notification_log
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_notification_log_unread
  ON public.customer_notification_log(email)
  WHERE read_at IS NULL;
