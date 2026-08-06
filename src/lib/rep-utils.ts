// Shared rep portal utilities

export const ADMIN_EMAILS = ["lukerichards@ventzon.com", "lukerichardsschool@gmail.com"];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

// Commission constants — signup-bounty model (approved 2026-08):
//  • $25 bounty on merchant signup (100% of the $25 flat = month one)
//  • $5/month recurring after that (20% of the $25 flat) per active paid shop
//  • Free shops earn $0
export const MONTHLY_FLAT = 25;               // Pro plan $/month
export const SIGNUP_BOUNTY = MONTHLY_FLAT;    // 100% of month one
export const RECURRING_COMMISSION_RATE = 0.2; // recurring rate on the flat
export const RECURRING_COMMISSION = MONTHLY_FLAT * RECURRING_COMMISSION_RATE; // $5/mo

// A shop is in its "bounty month" when its active service started within the
// last 30 days. `startIso` is rep_claimed_at, falling back to shop created_at
// (no dedicated paid-at timestamp exists on shops yet).
export function isInFirstMonth(startIso: string | null | undefined): boolean {
  if (!startIso) return false;
  const days = (Date.now() - new Date(startIso).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days < 30;
}

export function calcMerchantCommission(isPro: boolean, isFirstMonth: boolean): number {
  if (!isPro) return 0;
  return isFirstMonth ? SIGNUP_BOUNTY : RECURRING_COMMISSION;
}
