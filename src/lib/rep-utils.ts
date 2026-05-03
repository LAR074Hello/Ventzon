// Shared rep portal utilities

export const ADMIN_EMAILS = ["lukerichards@ventzon.com", "lukerichardsschool@gmail.com"];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

// Commission constants
export const MONTHLY_FLAT = 25;     // Pro plan $/month
export const PER_REWARD = 1.25;     // $/reward redemption
export const COMMISSION_RATE = 0.20;

export function calcMerchantCommission(isPro: boolean, rewardCount: number): number {
  const flat = isPro ? MONTHLY_FLAT * COMMISSION_RATE : 0;
  const rewards = rewardCount * PER_REWARD * COMMISSION_RATE;
  return Math.round((flat + rewards) * 100) / 100;
}
