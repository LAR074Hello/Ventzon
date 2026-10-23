import type Stripe from "stripe";

/**
 * Looks up an active Stripe promotion code by what a merchant typed
 * (Stripe's code filter is case-insensitive). Returns null when the code
 * doesn't exist, is inactive, or is used up.
 */
export async function findActivePromotionCode(
  stripe: Stripe,
  rawCode: string
): Promise<Stripe.PromotionCode | null> {
  const code = rawCode.trim();
  if (!code || code.length > 64 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  const res = await stripe.promotionCodes.list({
    code,
    active: true,
    limit: 1,
    expand: ["data.promotion.coupon"],
  });
  return res.data[0] ?? null;
}

/** Plain-English summary of what a promotion code does, for the pricing page. */
export function describePromotion(promo: Stripe.PromotionCode): string {
  const coupon = promo.promotion?.coupon;
  if (!coupon || typeof coupon === "string") return "Promo applied.";
  const pct = coupon.percent_off;
  const months = coupon.duration === "repeating" ? coupon.duration_in_months : null;
  if (pct === 100 && months) return `Free for your first ${months} months. No card needed.`;
  if (pct && months) return `${pct}% off for your first ${months} months.`;
  if (pct && coupon.duration === "forever") return `${pct}% off.`;
  if (pct) return `${pct}% off your first payment.`;
  return coupon.name ?? "Promo applied.";
}
