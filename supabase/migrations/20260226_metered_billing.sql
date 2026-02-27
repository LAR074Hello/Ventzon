-- =============================================================
-- Metered billing: reward_events table + plan_type on shops
-- =============================================================

-- 1. Track every reward earned (for metered billing + dashboard display)
CREATE TABLE IF NOT EXISTS public.reward_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug     text NOT NULL,
  customer_id   uuid NOT NULL,
  reward_date   date NOT NULL DEFAULT CURRENT_DATE,
  billed        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Fast monthly aggregation queries
CREATE INDEX IF NOT EXISTS idx_reward_events_shop_month
  ON public.reward_events(shop_slug, reward_date);

CREATE INDEX IF NOT EXISTS idx_reward_events_unbilled
  ON public.reward_events(shop_slug, billed) WHERE billed = false;

-- 2. Add plan_type to shops (free vs pro)
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'free';

-- 3. Mark existing paid Pro subscribers
UPDATE public.shops SET plan_type = 'pro' WHERE is_paid = true;
