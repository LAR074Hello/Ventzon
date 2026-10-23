/**
 * src/lib/pricing.ts
 *
 * Single source of truth for Ventzon Pro pricing.
 *
 * Pro is a flat subscription — no per-redemption fees, no contracts, cancel
 * anytime:
 *   • Monthly  $35/month
 *   • Annual   $350/year  (ten months paid, two free → save $70/year)
 *
 * Every user-facing price, savings figure, and rep commission value in the
 * app derives from this file. Change the numbers here, not in the copy.
 */

// ── Plan prices (USD) ────────────────────────────────────────────────
export const MONTHLY_PRICE = 35;
export const ANNUAL_PRICE = 350;

// Annual is ten months paid, two free.
export const ANNUAL_MONTHS_PAID = 10;
export const ANNUAL_SAVINGS = MONTHLY_PRICE * 12 - ANNUAL_PRICE; // 70

// ── Rep commission (flat 50% of every plan sold, approved 2026-08) ───
export const COMMISSION_RATE = 0.5;
export const SIGNUP_COMMISSION = ANNUAL_PRICE * COMMISSION_RATE; // 175 per annual signup
export const RECURRING_COMMISSION = MONTHLY_PRICE * COMMISSION_RATE; // $17.50/mo recurring

// ── Stripe price IDs ─────────────────────────────────────────────────
// The two NEXT_PUBLIC_STRIPE_PRICE_* vars are the ONLY source of truth for
// the subscription price. They are inlined at build time into client code and
// read from the server environment at request time, so a change here always
// needs a redeploy.
export const STRIPE_PRICE_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY ?? "";
export const STRIPE_PRICE_YEARLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY ?? "";

// ── Display helpers ──────────────────────────────────────────────────
export function formatMonthly(): string {
  return `$${MONTHLY_PRICE}/month`;
}

export function formatAnnual(): string {
  return `$${ANNUAL_PRICE}/year`;
}

export function formatMonthlyShort(): string {
  return `$${MONTHLY_PRICE}/mo`;
}

export function formatAnnualShort(): string {
  return `$${ANNUAL_PRICE}/yr`;
}

export function formatAnnualSavings(): string {
  return `$${ANNUAL_SAVINGS}`;
}

export function formatSignupCommission(): string {
  return `$${SIGNUP_COMMISSION}`;
}

export function formatRecurringCommission(): string {
  return `$${RECURRING_COMMISSION.toFixed(2)}`;
}
