/**
 * src/lib/visit-rating.ts
 *
 * Skippable "How was it?" after a check-in. The join page has no login, so
 * the check-in response carries a short-lived signed token that lets exactly
 * that customer rate exactly that shop, today. Rules:
 *   • only from the second visit on
 *   • at most once per shop per 7 days
 *   • never blocks or delays the check-in itself
 */
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const RATING_COOLDOWN_DAYS = 7;
export const RATINGS_MIN_TO_SHOW = 5;

function key(): string | null {
  return process.env.STRIPE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function signRatingToken(customerId: string, shopSlug: string, day: string): string | null {
  const k = key();
  if (!k) return null;
  return crypto.createHmac("sha256", k).update(`rate:${customerId}:${shopSlug}:${day}`).digest("hex");
}

export function verifyRatingToken(token: string, customerId: string, shopSlug: string): boolean {
  // Valid for the day it was issued and the day after (late-night visits).
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  for (const d of [today, yesterday]) {
    const expected = signRatingToken(customerId, shopSlug, d.toISOString().slice(0, 10));
    if (expected && token.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return true;
  }
  return false;
}

/** True when this customer should be offered the rating prompt. Fails closed. */
export async function canRate(
  supabase: SupabaseClient,
  customerId: string,
  shopSlug: string
): Promise<boolean> {
  try {
    const { count: visits } = await supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shopSlug)
      .eq("customer_id", customerId);
    if ((visits ?? 0) < 2) return false;

    const since = new Date();
    since.setDate(since.getDate() - RATING_COOLDOWN_DAYS);
    const { count: recent, error } = await supabase
      .from("visit_ratings")
      .select("id", { count: "exact", head: true })
      .eq("shop_slug", shopSlug)
      .eq("customer_id", customerId)
      .gte("created_at", since.toISOString());
    if (error) return false;
    return (recent ?? 0) === 0;
  } catch {
    return false;
  }
}
