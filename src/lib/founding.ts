/**
 * src/lib/founding.ts
 *
 * Founding-shop offer: a private link Luke shares personally. Opening it
 * marks the browser, and checkout then applies the FOUNDING promotion code
 * (100% off for 12 months, set up in Stripe) and skips card collection.
 * Public checkout has no promo-code box, so the paid plan stays paid.
 *
 * The marker cookie is HMAC-signed with a server secret, so it can't be
 * forged by setting a cookie by hand. A second, unsigned cookie exists only
 * so the pricing page can show the offer banner; faking it changes nothing.
 *
 * To rotate the link, change FOUNDING_LINK_SLUG and redeploy.
 */
import crypto from "crypto";

export const FOUNDING_LINK_SLUG = "fs-e748767c7b";
export const FOUNDING_PROMO_CODE = "FOUNDING";
export const FOUNDING_COOKIE = "vz_founding";
export const FOUNDING_UI_COOKIE = "vz_founding_ui";
export const FOUNDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string | null {
  return process.env.STRIPE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function signFoundingMarker(): string | null {
  const key = secret();
  if (!key) return null;
  return crypto.createHmac("sha256", key).update("founding-offer-v1").digest("hex");
}

export function isValidFoundingMarker(value: string | undefined | null): boolean {
  const expected = signFoundingMarker();
  if (!value || !expected || value.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
