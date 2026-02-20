-- Promotions table: merchant-created promotional SMS drafts
CREATE TABLE IF NOT EXISTS public.promotions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug     text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'approved', 'rejected')),
  reject_reason text,
  created_by    uuid NOT NULL,
  approved_at   timestamptz,
  rejected_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_shop_slug
  ON public.promotions(shop_slug);
