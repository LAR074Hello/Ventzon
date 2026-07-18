-- Add the 'new_follower' notification type ("X started following you")
-- and its per-type preference. ref_id for these rows holds the
-- follower's customer_profiles.id so the notification can link to them.

ALTER TABLE public.customer_notification_log
  DROP CONSTRAINT IF EXISTS customer_notification_log_type_check;
ALTER TABLE public.customer_notification_log
  ADD CONSTRAINT customer_notification_log_type_check
  CHECK (type IN ('drop', 'reward_expiry', 'new_nearby', 'new_follower'));

ALTER TABLE public.customer_notification_prefs
  ADD COLUMN IF NOT EXISTS notify_new_follower boolean NOT NULL DEFAULT true;
