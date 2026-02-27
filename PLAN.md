# Billing & Spend Tracking Implementation Plan

## Summary

The "$1 per reward" Free plan billing is advertised but not implemented. This plan adds:
1. Explicit reward event tracking in the database
2. Stripe metered billing (ONE monthly charge — minimizes transaction fees)
3. Small billing/spend section in the merchant dashboard
4. Proper plan_type distinction (free vs pro)

## Why Stripe Metered Billing (not pre-authorization)

**Pre-auth won't work**: Stripe pre-authorizations expire after ~7 days. You can't hold a card for a month.

**Metered billing is ideal because:**
- Card stored via subscription (never expires, Stripe handles card updates)
- Usage records accumulate silently — Stripe creates ONE invoice at month end
- Transaction fees are on the monthly total, not per-reward (e.g. 10 rewards = $10 charge = $0.59 in fees, vs 10 individual $1 charges = $3.30 in fees)
- Built-in dunning (failed payment retries)
- Works with existing billing portal

## Changes

### 1. Database migrations (Supabase)

**Migration A: `reward_events` table**
- Records every reward earned with shop_slug, customer_id, reward_date
- Indexed for fast monthly aggregation
- `billed` flag for tracking what's been reported to Stripe

**Migration B: `plan_type` column on `shops`**
- `plan_type TEXT DEFAULT 'free'` — values: 'free' or 'pro'
- Existing Pro subscribers get updated to 'pro'

### 2. Checkin endpoint modification (`/api/join/checkin/route.ts`)

When `hitGoal` is true (customer earns a reward):
- Insert a row into `reward_events`
- If the shop has a Stripe subscription with metered billing, report a usage record via `stripe.subscriptionItems.createUsageRecord()`

### 3. New API endpoint: `/api/merchant/billing/route.ts`

Returns current month billing data for dashboard display:
- Count of reward events this month from `reward_events` table
- Estimated charge ($1 × reward count for Free, $19 flat for Pro)
- Plan type
- Auth-gated to shop owner

### 4. Dashboard billing section (`/merchant/[shop]/page.tsx`)

Small, subtle section placed ABOVE the Quick Start section (near bottom):
- Shows plan type badge (FREE / PRO)
- Current month: "X rewards this month → $X"
- For Pro: "$19/mo · All rewards included"
- "Manage billing" link (existing portal)
- Kept intentionally minimal/understated

### 5. Stripe metered billing setup

**New env var**: `STRIPE_PRICE_FREE_METERED` — a metered price ID ($1/unit, monthly)
- User creates this in Stripe Dashboard: Products → Add → Recurring → Usage-based → $1 per unit

**Modify checkout route** (`/api/stripe/checkout/route.ts`):
- Accept `plan: "free"` in addition to `"monthly"` / `"yearly"`
- For free plan: create subscription with metered price (no upfront charge)
- Metadata includes `plan_type: "free"` or `plan_type: "pro"`

**Modify webhook** (`/api/stripe/webhook/route.ts`):
- On `checkout.session.completed`: read `plan_type` from metadata, update shops.plan_type
- Handle `invoice.payment_succeeded` / `invoice.payment_failed` for metered billing visibility

### 6. Free plan payment flow

- Merchants sign up free (no card required, as advertised)
- When first reward is earned, dashboard shows: "Add a payment method to keep earning rewards"
- Clicking opens a Stripe checkout in setup/subscription mode for the metered price
- Once card added, usage records are reported automatically
- If no card after grace period (configurable), join page still works but shows a prompt

## File Summary

| File | Action |
|------|--------|
| Supabase migration | CREATE TABLE reward_events; ALTER TABLE shops ADD plan_type |
| `/api/join/checkin/route.ts` | Add reward_events insert when hitGoal |
| `/api/merchant/billing/route.ts` | NEW — returns monthly billing data |
| `/api/stripe/checkout/route.ts` | Support free plan metered subscription |
| `/api/stripe/webhook/route.ts` | Handle plan_type metadata + invoice events |
| `/merchant/[shop]/page.tsx` | Add billing section UI |
| `.env.local` | Add STRIPE_PRICE_FREE_METERED (user creates in Stripe) |
