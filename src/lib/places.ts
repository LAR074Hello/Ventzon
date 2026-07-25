/**
 * Places — the first-class location object (Slice 1.3).
 *
 * A place exists whether or not anyone has claimed it. `shops` is the
 * merchant ACCOUNT that claims a place; `places` is the place itself. That
 * separation is what lets a city be populated before a single merchant
 * subscribes.
 *
 * EXPAND-CONTRACT. `shop_slug` is still present on posts and checkins and is
 * still authoritative. Everything here writes BOTH columns and reads
 * `place_id` with a `shop_slug` fallback, so the database can be rolled back
 * without data loss until the contract slice drops the old path.
 *
 * RLS on `places` is enabled with no anon policy — every read here must run
 * with the service role from a server route. Verified: the customer app makes
 * zero browser-side table reads; all 37 of its data paths go through
 * /api/... handlers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** A service-role client. Every read here needs one: places has RLS enabled
 *  with no anon policy, so a browser client returns zero rows, not an error. */
type Admin = SupabaseClient;

export type VerificationTier = "unclaimed" | "claimed" | "subscribed";
export type PlaceSource = "seed" | "merchant" | "osm";

export type Place = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;
  city: string | null;
  category: string | null;
  claimed_by: string | null;
  verification_tier: VerificationTier;
  source: PlaceSource;
  photos: string[];
};

const PLACE_COLUMNS =
  "id, slug, name, address, latitude, longitude, neighborhood, city, category, claimed_by, verification_tier, source, photos";

/** A place is claimed once a merchant account owns it. */
export const isClaimed = (p: Pick<Place, "verification_tier">) =>
  p.verification_tier !== "unclaimed";

/** The Verified Business badge renders ONLY at subscribed (Slice 1.5). */
export const showsVerifiedBadge = (p: Pick<Place, "verification_tier">) =>
  p.verification_tier === "subscribed";

export async function getPlaceBySlug(admin: Admin, slug: string): Promise<Place | null> {
  const { data } = await admin
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Place) ?? null;
}

export async function getPlaceById(admin: Admin, id: string): Promise<Place | null> {
  const { data } = await admin
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as Place) ?? null;
}

/** Bulk lookup keyed by slug — for feed/list hydration without N+1. */
export async function getPlacesBySlugs(
  admin: Admin,
  slugs: string[]
): Promise<Map<string, Place>> {
  const unique = [...new Set(slugs.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data } = await admin.from("places").select(PLACE_COLUMNS).in("slug", unique);
  return new Map((data ?? []).map((p: Place) => [p.slug, p]));
}

/**
 * Resolve a place id from a slug, creating nothing.
 * Returns null when the slug has no place, which during expand means the
 * caller should fall back to shop_slug rather than fail.
 */
export async function placeIdForSlug(admin: Admin, slug: string | null): Promise<string | null> {
  if (!slug) return null;
  const { data } = await admin.from("places").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

/**
 * THE ONLY WAY TO WRITE A CHECK-IN.
 *
 * Both check-in paths (public QR at /api/join/checkin and merchant manual at
 * /api/merchant/manual-checkin) route through here so `shop_slug` and
 * `place_id` are always written together. Two call sites each remembering to
 * populate two columns is how data forks silently; one helper makes the wrong
 * thing hard rather than remembered — the same reasoning as the provider
 * adapters.
 *
 * Returns { duplicate: true } on the per-day unique violation rather than
 * throwing, because both callers treat that as an expected outcome.
 */
export async function writeCheckin(
  admin: Admin,
  input: {
    shopSlug: string;
    customerId: string;
    checkinDate: string;
    createdAt?: string;
    amount?: number | null;
  }
): Promise<{ ok: boolean; duplicate: boolean; placeId: string | null; error?: string }> {
  const placeId = await placeIdForSlug(admin, input.shopSlug);

  const { error } = await admin.from("checkins").insert({
    shop_slug: input.shopSlug,
    place_id: placeId, // expand-contract: both, always
    customer_id: input.customerId,
    checkin_date: input.checkinDate,
    created_at: input.createdAt ?? new Date().toISOString(),
    ...(input.amount != null ? { amount: input.amount } : {}),
  });

  if (error) {
    // 23505 = unique_violation, i.e. already checked in today.
    const duplicate = error.code === "23505" || /duplicate key/i.test(error.message ?? "");
    return { ok: false, duplicate, placeId, error: error.message };
  }
  return { ok: true, duplicate: false, placeId };
}

/**
 * THE ONLY WAY TO WRITE A POST'S PLACE LINK.
 * Same reasoning as writeCheckin — returns the fields to spread into an
 * insert so a caller cannot set one without the other.
 */
export async function postPlaceFields(
  admin: Admin,
  shopSlug: string | null
): Promise<{ shop_slug: string | null; place_id: string | null }> {
  return { shop_slug: shopSlug, place_id: await placeIdForSlug(admin, shopSlug) };
}
