-- ============================================================
-- Social layer: creator profiles, user↔user follows, posts,
-- and referral credits.
-- ------------------------------------------------------------
-- Customers are identified cross-shop by lowercased email (same
-- convention as customer_follows). All access is server-side via
-- the service role key, so RLS is enabled with no policies.
-- ============================================================

-- One row per app user who has touched a social feature. Becoming a
-- creator is open to all (is_creator toggle, no approval gate); to gate
-- later, add an approval-status column — deliberately not now.
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL UNIQUE,
  display_name        text,
  avatar_url          text,
  bio                 text,
  is_creator          boolean NOT NULL DEFAULT false,
  show_on_leaderboard boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- A user following another user (creator). Distinct from
-- customer_follows, which is user → shop.
CREATE TABLE IF NOT EXISTS public.user_follows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_email text NOT NULL,
  followee_email text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_email, followee_email),
  CHECK (follower_email <> followee_email)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_email);
CREATE INDEX IF NOT EXISTS idx_user_follows_followee ON public.user_follows(followee_email);

-- Shared posts schema — creator notes now; future feed content reuses it.
CREATE TABLE IF NOT EXISTS public.posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_email text NOT NULL,
  shop_slug    text REFERENCES public.shops(slug) ON DELETE SET NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_author  ON public.posts(author_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);

-- Referral credits. One credit per referred person, ever — the UNIQUE
-- on referred_email prevents double counting across shops.
CREATE TABLE IF NOT EXISTS public.referrals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email text NOT NULL,
  referred_email text NOT NULL UNIQUE,
  shop_slug      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_email);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals         ENABLE ROW LEVEL SECURITY;
