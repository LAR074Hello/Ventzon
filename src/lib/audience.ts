/**
 * src/lib/audience.ts
 *
 * The optional "audience profile" a customer can fill in to personalize
 * their feed. Shops only ever see these as totals (see
 * /api/merchant/audience), with a minimum group size and adults only.
 *
 * Deliberately NOT collected: exact birthday (age is a range), gender, and
 * anything about health, religion, politics or sexuality. Food options are
 * preferences, not allergies or intolerances.
 */

export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"] as const;

export const INTERESTS = [
  "Coffee", "Brunch", "Nightlife", "Live music", "Art", "Fashion", "Vintage",
  "Fitness", "Yoga", "Outdoors", "Sports", "Gaming", "Books", "Pets",
  "Family", "Wellness", "Desserts", "Cocktails",
] as const;

export const GOING_OUT_FOR = [
  "Date night", "Study or work", "Quick bite", "Late night", "Family outing", "Treat yourself",
] as const;

export const FOOD_PREFS = [
  "Vegan", "Vegetarian", "Plant-based options", "Halal", "Kosher", "Coffee lover", "Tea lover",
] as const;

export const PRICE_PREFS = ["Budget", "Mid-range", "Splurge"] as const;

export type AudienceProfile = {
  age_range: string | null;
  interests: string[];
  going_out_for: string[];
  food_prefs: string[];
  price_pref: string | null;
  home_area: string | null;
};

export const EMPTY_AUDIENCE: AudienceProfile = {
  age_range: null,
  interests: [],
  going_out_for: [],
  food_prefs: [],
  price_pref: null,
  home_area: null,
};

const pickOne = (v: unknown, allowed: readonly string[]) =>
  typeof v === "string" && allowed.includes(v) ? v : null;
const pickMany = (v: unknown, allowed: readonly string[]) =>
  Array.isArray(v) ? Array.from(new Set(v.filter((x): x is string => typeof x === "string" && allowed.includes(x)))) : [];

/** Keeps only known values, so free text can never end up in these fields. */
export function sanitizeAudience(input: Record<string, unknown>): AudienceProfile {
  const area = typeof input.home_area === "string" ? input.home_area.trim().slice(0, 80) : "";
  return {
    age_range: pickOne(input.age_range, AGE_RANGES),
    interests: pickMany(input.interests, INTERESTS),
    going_out_for: pickMany(input.going_out_for, GOING_OUT_FOR),
    food_prefs: pickMany(input.food_prefs, FOOD_PREFS),
    price_pref: pickOne(input.price_pref, PRICE_PREFS),
    home_area: area || null,
  };
}

/** Business-facing breakdowns are hidden below this many people. */
export const AUDIENCE_MIN_GROUP = 10;

/** Which place categories (places.category) each interest points toward. */
const INTEREST_CATEGORIES: Record<string, string[]> = {
  Coffee: ["Coffee"],
  Brunch: ["Food", "Coffee"],
  Desserts: ["Food", "Coffee"],
  Cocktails: ["Food"],
  Nightlife: ["Food", "Culture"],
  "Live music": ["Culture"],
  Art: ["Culture"],
  Books: ["Culture", "Retail"],
  Fashion: ["Retail", "Beauty"],
  Vintage: ["Retail"],
  Fitness: ["Fitness"],
  Yoga: ["Fitness"],
  Wellness: ["Fitness", "Beauty"],
  Outdoors: ["Outdoors"],
  Sports: ["Fitness", "Outdoors"],
  Pets: ["Outdoors", "Retail"],
  Family: ["Outdoors", "Food"],
  Gaming: ["Culture", "Retail"],
};

/** Place categories to nudge up in a viewer's feed, from their interests. */
export function preferredCategories(interests: string[] | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const i of interests ?? []) for (const c of INTEREST_CATEGORIES[i] ?? []) out.add(c);
  return out;
}
