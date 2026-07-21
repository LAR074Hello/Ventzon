-- ============================================================
-- Safety floor: blocks and reports (App Store UGC Guideline 1.2).
-- Blocks are mutual-invisibility edges; reports auto-hide the
-- reported content pending human review. Service-role only (RLS
-- with no policies, same as the rest of the social schema).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_email text NOT NULL,
  blocked_email text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_email, blocked_email),
  CHECK (blocker_email <> blocked_email)
);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_email);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_email);

CREATE TABLE IF NOT EXISTS public.reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_email text NOT NULL,
  target_type    text NOT NULL CHECK (target_type IN ('post', 'comment', 'profile')),
  target_id      text NOT NULL,
  reason         text NOT NULL,
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at);

-- Reported content is hidden immediately, pending review.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports     ENABLE ROW LEVEL SECURITY;
