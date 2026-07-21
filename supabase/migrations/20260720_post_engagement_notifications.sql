-- Like/comment notifications: new log types + a shared preference.
-- ref_id holds the post id (like) or comment id (comment) so the
-- unique claim dedupes per-object.

ALTER TABLE public.customer_notification_log
  DROP CONSTRAINT IF EXISTS customer_notification_log_type_check;
ALTER TABLE public.customer_notification_log
  ADD CONSTRAINT customer_notification_log_type_check
  CHECK (type IN ('drop', 'reward_expiry', 'new_nearby', 'new_follower', 'post_like', 'post_comment'));

ALTER TABLE public.customer_notification_prefs
  ADD COLUMN IF NOT EXISTS notify_post_engagement boolean NOT NULL DEFAULT true;
