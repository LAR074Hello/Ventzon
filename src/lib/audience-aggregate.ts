/**
 * src/lib/audience-aggregate.ts
 *
 * Builds a shop's audience profile from the optional answers of customers
 * who checked in there. Totals only:
 *   • nothing is returned below AUDIENCE_MIN_GROUP respondents
 *   • adults only (recorded date of birth 18+)
 *   • any single bucket under MIN_BUCKET people is folded away
 *   • no names, emails or ids ever leave this function
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUDIENCE_MIN_GROUP } from "@/lib/audience";

const MIN_BUCKET = 3;
const MIN_BASELINE = 30;

type Row = {
  dob: string | null;
  age_range: string | null;
  interests: string[] | null;
  going_out_for: string[] | null;
  food_prefs: string[] | null;
  price_pref: string | null;
  home_area: string | null;
};

export type Share = { label: string; pct: number };
export type AudienceResult =
  | { available: false; respondents: number; needed: number }
  | {
      available: true;
      respondents: number;
      age: Share[];
      interests: Share[];
      going_out_for: Share[];
      food: Share[];
      price: Share[];
      areas: Share[];
      neighborhood: string | null;
      standouts: { label: string; times: number }[];
    };

function isAdult(dob: string | null): boolean {
  if (!dob) return false;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return false;
  d.setFullYear(d.getFullYear() + 18);
  return d.getTime() <= Date.now();
}

function answered(r: Row) {
  return Boolean(
    r.age_range || r.price_pref || r.home_area ||
    r.interests?.length || r.going_out_for?.length || r.food_prefs?.length
  );
}

function shares(values: (string | null)[][], total: number, top?: number): Share[] {
  const counts: Record<string, number> = {};
  for (const list of values) for (const v of list) if (v) counts[v] = (counts[v] ?? 0) + 1;
  const out = Object.entries(counts)
    .filter(([, c]) => c >= MIN_BUCKET)
    .map(([label, c]) => ({ label, pct: Math.round((c / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  return top ? out.slice(0, top) : out;
}

async function profilesFor(supabase: SupabaseClient, emails: string[]): Promise<Row[]> {
  const rows: Row[] = [];
  for (let i = 0; i < emails.length; i += 500) {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select("dob, age_range, interests, going_out_for, food_prefs, price_pref, home_area")
      .in("email", emails.slice(i, i + 500));
    if (error) throw error;
    rows.push(...((data ?? []) as Row[]));
  }
  return rows;
}

export async function computeAudience(
  supabase: SupabaseClient,
  shopSlug: string
): Promise<AudienceResult> {
  const { data: members } = await supabase
    .from("customers")
    .select("email")
    .eq("shop_slug", shopSlug)
    .not("email", "is", null)
    .not("last_checkin_date", "is", null)
    .limit(20000);
  const emails = Array.from(new Set((members ?? []).map((m) => String(m.email).toLowerCase())));

  const rows = (await profilesFor(supabase, emails)).filter((r) => isAdult(r.dob) && answered(r));
  const n = rows.length;
  if (n < AUDIENCE_MIN_GROUP) {
    return { available: false, respondents: n, needed: AUDIENCE_MIN_GROUP };
  }

  const interestShares = shares(rows.map((r) => r.interests ?? []), n);

  // Compared with the neighborhood: the shop's audience vs. every adult
  // Ventzon user who calls the same neighborhood home.
  let neighborhood: string | null = null;
  const standouts: { label: string; times: number }[] = [];
  const { data: place } = await supabase
    .from("places")
    .select("neighborhood")
    .eq("slug", shopSlug)
    .maybeSingle();
  neighborhood = (place?.neighborhood as string | null) ?? null;
  if (neighborhood) {
    const { data: base } = await supabase
      .from("customer_profiles")
      .select("dob, interests")
      .eq("home_area", neighborhood)
      .not("interests", "is", null)
      .limit(20000);
    const baseRows = ((base ?? []) as Pick<Row, "dob" | "interests">[]).filter(
      (r) => isAdult(r.dob) && (r.interests?.length ?? 0) > 0
    );
    if (baseRows.length >= MIN_BASELINE) {
      const baseCounts: Record<string, number> = {};
      for (const r of baseRows) for (const i of r.interests ?? []) baseCounts[i] = (baseCounts[i] ?? 0) + 1;
      for (const s of interestShares) {
        const basePct = ((baseCounts[s.label] ?? 0) / baseRows.length) * 100;
        if (basePct <= 0) continue;
        const times = Math.round((s.pct / basePct) * 10) / 10;
        if (times >= 1.3) standouts.push({ label: s.label, times });
      }
      standouts.sort((a, b) => b.times - a.times).splice(3);
    }
  }

  return {
    available: true,
    respondents: n,
    age: shares(rows.map((r) => [r.age_range]), n),
    interests: interestShares.slice(0, 5),
    going_out_for: shares(rows.map((r) => r.going_out_for ?? []), n, 4),
    food: shares(rows.map((r) => r.food_prefs ?? []), n, 4),
    price: shares(rows.map((r) => [r.price_pref]), n),
    areas: shares(rows.map((r) => [r.home_area]), n, 5),
    neighborhood,
    standouts,
  };
}

/** One-line description for the AI promo writer. Never identifying. */
export function audienceSummary(a: AudienceResult): string | null {
  if (!a.available) return null;
  const parts: string[] = [];
  if (a.age[0]) parts.push(`most customers are ${a.age[0].label}`);
  if (a.interests.length) parts.push(`top interests: ${a.interests.slice(0, 3).map((i) => i.label).join(", ")}`);
  if (a.going_out_for[0]) parts.push(`they mostly come in for ${a.going_out_for[0].label.toLowerCase()}`);
  if (a.price[0]) parts.push(`price comfort: ${a.price[0].label.toLowerCase()}`);
  return parts.length ? parts.join("; ") : null;
}
