// Shared rep portal utilities

export const ADMIN_EMAILS = ["lukerichards@ventzon.com", "lukerichardsschool@gmail.com"];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

// Commission constants — flat 50% of every plan sold (approved 2026-08):
//  • Monthly ($30/mo) → $15/mo recurring for as long as the shop stays subscribed
//  • Annual ($300/yr) → $150 per signup
//  • Uncapped; free shops earn $0
export const MONTHLY_FLAT = 30;            // Pro plan $/month
export const ANNUAL_FLAT = 300;            // Pro plan $/year
export const COMMISSION_RATE = 0.5;        // flat 50% of every plan sold
export const SIGNUP_COMMISSION = ANNUAL_FLAT * COMMISSION_RATE;   // $150 per annual signup
export const RECURRING_COMMISSION = MONTHLY_FLAT * COMMISSION_RATE; // $15/mo recurring

// A shop is in its first/signup month when its active service started within the
// last 30 days. `startIso` is rep_claimed_at, falling back to shop created_at
// (no dedicated paid-at timestamp exists on shops yet).
export function isInFirstMonth(startIso: string | null | undefined): boolean {
  if (!startIso) return false;
  const days = (Date.now() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days < 30;
}

export function calcMerchantCommission(isPro: boolean, isFirstMonth: boolean): number {
  if (!isPro) return 0;
  // First month ≈ annual-signup payout ($150); after that, $15/mo recurring.
  // (The DB doesn't track monthly vs annual per shop, so the first month is
  // credited at the annual rate — see MONTHLY_FLAT/ANNUAL_FLAT above.)
  return isFirstMonth ? SIGNUP_COMMISSION : RECURRING_COMMISSION;
}
