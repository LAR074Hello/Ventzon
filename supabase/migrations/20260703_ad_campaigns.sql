-- ============================================================
-- Merchant advertising: bid-based push notification ads
-- ------------------------------------------------------------
-- Merchants create a campaign with a bid (cents per send) and a
-- target radius. Once daily, a cron job finds customers who:
--   * are reachable by push (have the app + a device token)
--   * frequent a shop within the campaign's radius of the advertiser
--   * are NOT already a customer of the advertiser (acquisition-only)
--   * have not opted out of communications
-- and sends the highest-bidding campaigns first, capped at 6 total
-- ad notifications per customer per day. Each send is billed via
-- Stripe metered usage at the campaign's bid amount.
-- ============================================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug text NOT NULL REFERENCES shops(slug) ON DELETE CASCADE,
  headline text NOT NULL,
  body text NOT NULL,
  bid_cents integer NOT NULL CHECK (bid_cents > 0),
  radius_miles numeric NOT NULL DEFAULT 5 CHECK (radius_miles > 0 AND radius_miles <= 50),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_campaigns_shop_slug_idx ON ad_campaigns(shop_slug);
CREATE INDEX IF NOT EXISTS ad_campaigns_active_idx ON ad_campaigns(status) WHERE status = 'active';

-- One row per ad actually delivered to a customer (email is the
-- cross-shop identity key, matching the pattern used by /api/customer/memberships).
-- Used both for the daily frequency cap and for billing accuracy.
CREATE TABLE IF NOT EXISTS ad_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  send_date date NOT NULL,
  bid_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, customer_email, send_date)
);

CREATE INDEX IF NOT EXISTS ad_sends_email_date_idx ON ad_sends(customer_email, send_date);
CREATE INDEX IF NOT EXISTS ad_sends_campaign_idx ON ad_sends(campaign_id);

-- Tracks the Stripe subscription item created for a shop's ad metered
-- price, so it's only attached once (on first campaign) rather than
-- re-added on every campaign a merchant creates.
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS ad_subscription_item_id text;

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sends ENABLE ROW LEVEL SECURITY;
