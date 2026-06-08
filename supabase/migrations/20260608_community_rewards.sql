-- =============================================================
-- Community Rewards Tier
-- Phases 1–5 schema foundation
-- =============================================================

-- ─── 1. community_eligibility ───────────────────────────────
-- Stores verification outcomes only.
-- Never stores SSN, .edu address, documents, or medical info.
-- Care group is merchant-grant only (scope='merchant').
-- Senior is derived from DOB at scan time — no row here.

CREATE TABLE IF NOT EXISTS public.community_eligibility (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  group_key         text        NOT NULL CHECK (group_key IN ('veteran','student','senior','first_responder','care')),
  scope             text        NOT NULL CHECK (scope IN ('global','merchant')),
  merchant_id       uuid        REFERENCES public.shops(id) ON DELETE CASCADE,
  source            text        NOT NULL,   -- 'va_api' | 'edu_email' | 'merchant_grant' | 'dob_derived'
  status            text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','expired','revoked')),
  granted_by_user_id uuid       REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz,

  -- Care group is always merchant-scoped
  CONSTRAINT care_merchant_only
    CHECK (group_key <> 'care' OR scope = 'merchant'),

  -- merchant_id required when scope='merchant'
  CONSTRAINT merchant_scope_requires_id
    CHECK (scope <> 'merchant' OR merchant_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ce_customer
  ON public.community_eligibility(customer_id);
CREATE INDEX IF NOT EXISTS idx_ce_merchant_group
  ON public.community_eligibility(merchant_id, group_key) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ce_global_group
  ON public.community_eligibility(group_key, status) WHERE scope = 'global';

-- ─── 2. merchant_community_settings ─────────────────────────
-- Per-group on/off + boost multiplier per merchant.

CREATE TABLE IF NOT EXISTS public.merchant_community_settings (
  merchant_id  uuid    NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  group_key    text    NOT NULL CHECK (group_key IN ('veteran','student','senior','first_responder','care')),
  enabled      boolean NOT NULL DEFAULT false,
  boost        numeric(4,2) NOT NULL DEFAULT 1.5
               CHECK (boost >= 1.0 AND boost <= 5.0),
  PRIMARY KEY (merchant_id, group_key)
);

-- ─── 3. loyalty_events ──────────────────────────────────────
-- Records every scan award (base + boosted).
-- scan_id unique index makes award_scan_points idempotent.

CREATE TABLE IF NOT EXISTS public.loyalty_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id     uuid        NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  base_points     numeric     NOT NULL,
  awarded_points  numeric     NOT NULL,
  matched_groups  text[]      NOT NULL DEFAULT '{}',
  matched_detail  jsonb       NOT NULL DEFAULT '{}',
  applied_boost   numeric(4,2) NOT NULL DEFAULT 1.0,
  scan_id         uuid        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Idempotency: one row per scan_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_le_scan_id
  ON public.loyalty_events(scan_id);

CREATE INDEX IF NOT EXISTS idx_le_merchant_created
  ON public.loyalty_events(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_le_customer_merchant
  ON public.loyalty_events(customer_id, merchant_id);

-- ─── 4. DOB on customers for senior derivation ──────────────
-- No senior eligibility row — derived at scan time from this field.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS dob date;

-- ─── 5. award_scan_points RPC ───────────────────────────────
-- Called from check-in API.
-- Returns the loyalty_events row (new or existing on duplicate scan_id).
-- SECURITY DEFINER so it can bypass RLS; search_path locked to public.

CREATE OR REPLACE FUNCTION public.award_scan_points(
  p_customer_id  uuid,
  p_merchant_id  uuid,
  p_base_points  numeric,
  p_scan_id      uuid
)
RETURNS TABLE (
  event_id        uuid,
  awarded_points  numeric,
  applied_boost   numeric,
  matched_groups  text[],
  matched_detail  jsonb,
  was_duplicate   boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dob              date;
  v_age              int;
  v_is_senior        boolean := false;
  v_global_groups    text[]  := '{}';
  v_merchant_groups  text[]  := '{}';
  v_all_eligible     text[]  := '{}';
  v_enabled_groups   text[]  := '{}';
  v_final_groups     text[]  := '{}';
  v_max_boost        numeric(4,2) := 1.0;
  v_awarded          numeric;
  v_detail           jsonb   := '{}';
  v_group            text;
  v_boost_val        numeric(4,2);
  v_event_id         uuid;
  v_existing         public.loyalty_events%ROWTYPE;
BEGIN
  -- ── Idempotency: return existing row if scan_id already processed ──
  SELECT * INTO v_existing
  FROM public.loyalty_events le
  WHERE le.scan_id = p_scan_id
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT
      v_existing.id,
      v_existing.awarded_points,
      v_existing.applied_boost,
      v_existing.matched_groups,
      v_existing.matched_detail,
      true;
    RETURN;
  END IF;

  -- ── Gather active global badges for this customer ──
  SELECT array_agg(DISTINCT ce.group_key) INTO v_global_groups
  FROM public.community_eligibility ce
  WHERE ce.customer_id = p_customer_id
    AND ce.scope       = 'global'
    AND ce.status      = 'active'
    AND (ce.expires_at IS NULL OR ce.expires_at > now());

  v_global_groups := COALESCE(v_global_groups, '{}');

  -- ── Gather active merchant grants for this customer at this shop ──
  SELECT array_agg(DISTINCT ce.group_key) INTO v_merchant_groups
  FROM public.community_eligibility ce
  WHERE ce.customer_id = p_customer_id
    AND ce.scope       = 'merchant'
    AND ce.merchant_id = p_merchant_id
    AND ce.status      = 'active'
    AND (ce.expires_at IS NULL OR ce.expires_at > now());

  v_merchant_groups := COALESCE(v_merchant_groups, '{}');

  -- ── Derive senior from DOB (age >= 60) ──
  SELECT c.dob INTO v_dob
  FROM public.customers c
  WHERE c.id = p_customer_id;

  IF v_dob IS NOT NULL THEN
    v_age := date_part('year', age(v_dob));
    IF v_age >= 60 THEN
      v_is_senior := true;
      -- Append 'senior' to eligible groups if not already present
      IF NOT ('senior' = ANY(v_global_groups)) AND NOT ('senior' = ANY(v_merchant_groups)) THEN
        v_global_groups := array_append(v_global_groups, 'senior');
      END IF;
    END IF;
  END IF;

  -- ── Combine all eligible groups ──
  SELECT array_agg(DISTINCT u.g) INTO v_all_eligible
  FROM unnest(v_global_groups || v_merchant_groups) AS u(g);
  v_all_eligible := COALESCE(v_all_eligible, '{}');

  -- ── Intersect with merchant's enabled groups + find max boost ──
  FOR v_group IN
    SELECT mcs.group_key
    FROM public.merchant_community_settings mcs
    WHERE mcs.merchant_id = p_merchant_id
      AND mcs.enabled     = true
      AND mcs.group_key   = ANY(v_all_eligible)
  LOOP
    v_final_groups := array_append(v_final_groups, v_group);

    SELECT mcs.boost INTO v_boost_val
    FROM public.merchant_community_settings mcs
    WHERE mcs.merchant_id = p_merchant_id
      AND mcs.group_key   = v_group;

    IF v_boost_val > v_max_boost THEN
      v_max_boost := v_boost_val;
    END IF;

    -- Build detail: { "veteran": 1.5, "senior": 1.25, ... }
    v_detail := v_detail || jsonb_build_object(v_group, v_boost_val);
  END LOOP;

  -- ── Award points: max boost, not stack ──
  v_awarded := round(p_base_points * v_max_boost);

  -- ── Insert loyalty_events row ──
  -- ON CONFLICT catches any race condition on the unique index
  INSERT INTO public.loyalty_events (
    customer_id, merchant_id, base_points, awarded_points,
    matched_groups, matched_detail, applied_boost, scan_id
  ) VALUES (
    p_customer_id, p_merchant_id, p_base_points, v_awarded,
    v_final_groups, v_detail, v_max_boost, p_scan_id
  )
  ON CONFLICT (scan_id) DO NOTHING
  RETURNING id INTO v_event_id;

  -- If ON CONFLICT fired, fetch the pre-existing row
  IF v_event_id IS NULL THEN
    SELECT le.id, le.awarded_points, le.applied_boost, le.matched_groups, le.matched_detail
    INTO v_event_id, v_awarded, v_max_boost, v_final_groups, v_detail
    FROM public.loyalty_events le
    WHERE le.scan_id = p_scan_id;

    RETURN QUERY SELECT v_event_id, v_awarded, v_max_boost, v_final_groups, v_detail, true;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_event_id, v_awarded, v_max_boost, v_final_groups, v_detail, false;
END;
$$;

-- ─── 6. RLS ─────────────────────────────────────────────────
-- community_eligibility: service-role only (no direct client reads)
ALTER TABLE public.community_eligibility ENABLE ROW LEVEL SECURITY;
-- merchant_community_settings: service-role only
ALTER TABLE public.merchant_community_settings ENABLE ROW LEVEL SECURITY;
-- loyalty_events: service-role only
ALTER TABLE public.loyalty_events ENABLE ROW LEVEL SECURITY;

-- Grant execute on RPC to authenticated users
-- (called server-side with service-role key, but grant anyway for future flexibility)
GRANT EXECUTE ON FUNCTION public.award_scan_points(uuid, uuid, numeric, uuid) TO service_role;
