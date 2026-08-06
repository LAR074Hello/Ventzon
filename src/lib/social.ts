// Shared helpers for the social layer: creator profiles, stats, and the
// badge tier. Badges are computed live from real check-in data — there is
// no badges table to drift out of sync.

export type CreatorStats = {
  followers: number;
  following: number;
  posts: number;
  businesses_visited: number;
  total_points: number;
  referrals: number;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
};

/**
 * Fetch the profile row for an email, creating it on first touch.
 * Display name / avatar are seeded from auth metadata when provided.
 */
export async function getOrCreateProfile(
  admin: any,
  email: string,
  seed?: { display_name?: string | null; avatar_url?: string | null }
) {
  const e = email.toLowerCase().trim();
  const { data: existing } = await admin
    .from("customer_profiles")
    .select("*")
    .eq("email", e)
    .maybeSingle();

  // BACKFILL, don't just return.
  //
  // A profile is created by whichever route the user happens to hit first, and
  // only some of them pass a seed — posting, liking and commenting all called
  // this with no name at all. Whoever got there first therefore decided
  // permanently whether you have a name, and someone who posted before opening
  // their profile was stuck rendering as "Creator" forever.
  //
  // Apple Sign In makes this worse rather than rarer: the name is offered ONCE,
  // at first authorization, and never again. Missing it is not recoverable by
  // asking the provider later.
  if (existing) {
    const wants: Record<string, string> = {};
    if (!existing.display_name && seed?.display_name) wants.display_name = seed.display_name;
    if (!existing.avatar_url && seed?.avatar_url) wants.avatar_url = seed.avatar_url;
    if (Object.keys(wants).length === 0) return existing;
    const { data: patched } = await admin
      .from("customer_profiles")
      .update(wants)
      .eq("email", e)
      .select("*")
      .single();
    return patched ?? existing;
  }

  const { data: created, error } = await admin
    .from("customer_profiles")
    .upsert(
      {
        email: e,
        display_name: seed?.display_name ?? null,
        avatar_url: seed?.avatar_url ?? null,
        // Public by default. is_creator is the switch that makes a profile
        // findable in search, suggestable, followable and linkable — a new
        // user who stays private is invisible to the friends they signed up
        // to find. Opting out (settings) still works; this only sets the
        // default on CREATE, the existing-profile branch above never rewrites
        // a deliberate choice back on.
        is_creator: true,
      },
      { onConflict: "email" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return created;
}

/**
 * Emails invisible to this viewer: people they blocked plus people who
 * blocked them. Feeds, comments, lists, and follow actions all filter
 * through this one set so blocking behaves the same everywhere.
 */
export async function getBlockedSet(admin: any, email: string | null): Promise<Set<string>> {
  const set = new Set<string>();
  if (!email) return set;
  const e = email.toLowerCase().trim();
  const [{ data: mine }, { data: theirs }] = await Promise.all([
    admin.from("user_blocks").select("blocked_email").eq("blocker_email", e),
    admin.from("user_blocks").select("blocker_email").eq("blocked_email", e),
  ]);
  for (const r of mine ?? []) set.add(r.blocked_email);
  for (const r of theirs ?? []) set.add(r.blocker_email);
  return set;
}

async function countRows(admin: any, table: string, col: string, value: string) {
  const { count } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(col, value);
  return count ?? 0;
}

/** Live stats for a creator profile. Lifetime visits come from checkins. */
export async function creatorStats(admin: any, email: string): Promise<CreatorStats & { checkins: number; rewards_earned: number }> {
  const e = email.toLowerCase().trim();

  const { data: memberships } = await admin
    .from("customers")
    .select("id, shop_slug")
    .eq("email", e);
  const customerIds = (memberships ?? []).map((m: any) => m.id);

  let checkins = 0;
  let rewardsEarned = 0;
  if (customerIds.length > 0) {
    const [{ count: ci }, { count: re }] = await Promise.all([
      admin
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .in("customer_id", customerIds),
      admin
        .from("reward_events")
        .select("id", { count: "exact", head: true })
        .in("customer_id", customerIds),
    ]);
    checkins = ci ?? 0;
    rewardsEarned = re ?? 0;
  }

  const [followers, following, posts, referrals] = await Promise.all([
    countRows(admin, "user_follows", "followee_email", e),
    countRows(admin, "user_follows", "follower_email", e),
    countRows(admin, "posts", "author_email", e),
    countRows(admin, "referrals", "referrer_email", e),
  ]);

  return {
    followers,
    following,
    posts,
    businesses_visited: (memberships ?? []).length,
    // "Points" on a public profile = lifetime check-ins, which is real,
    // comparable across stamp/points shops, and can't be gamed by mode.
    total_points: checkins,
    referrals,
    checkins,
    rewards_earned: rewardsEarned,
  };
}

/**
 * Founding Member cutoff — freeze at the public-launch date. Anyone whose
 * earliest Ventzon touch is at or before this instant earns the badge;
 * everyone after it does not. Date-based rather than "first 100 per metro"
 * because the schema has no user-location field to anchor a metro on (and a
 * rank query over all users per request is both heavy and fuzzy). Revisit
 * only if a location column ever lands.
 */
export const FOUNDING_MEMBER_CUTOFF = new Date("2026-09-30T23:59:59.999Z");

/**
 * The badge tier — four badges, all computed live at request time, no
 * badges table to drift out of sync.
 *
 * The old milestone badges counted membership check-ins only, so they were
 * structurally unreachable at the imported places beta users actually check
 * in. This tier reads BOTH check-in lanes (membership `customer_id` and
 * place `customer_email`) deduplicated on the visit identity — the same rule
 * `getVerifiedVisitSet` uses — so every badge can be earned at any place a
 * user can see.
 */
export async function computeBadgeTier(admin: any, email: string): Promise<Badge[]> {
  const e = email.toLowerCase().trim();

  // ── Founding Member ─────────────────────────────────────────────────
  // Earliest touch is whichever came first: the social profile (created on
  // first authenticated touch) or the earliest membership row (first QR
  // check-in). Comparing both means a QR-only user still counts.
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    admin.from("customer_profiles").select("created_at").eq("email", e).maybeSingle(),
    admin
      .from("customers")
      .select("first_seen_at")
      .eq("email", e)
      .order("first_seen_at", { ascending: true })
      .limit(1),
  ]);
  const joinedAt =
    [profile?.created_at, memberships?.[0]?.first_seen_at]
      .filter(Boolean)
      .map((t: string) => new Date(t).getTime())
      .sort((a, b) => a - b)[0] ?? null;
  const foundingMember = joinedAt != null && joinedAt <= FOUNDING_MEMBER_CUTOFF.getTime();

  // ── Visits across both lanes, deduplicated on the visit ────────────
  // After a merchant claims a place, one person can legitimately hold both a
  // membership and a place check-in for the same visit — counting rows would
  // report one visit as two. Dedupe on (place-anchor, checkin_date); the
  // anchor is place_id, with the slug fallback for rows written before the
  // place link existed.
  type VisitRow = {
    customer_id?: string | null;
    customer_email?: string | null;
    place_id: string | null;
    shop_slug: string | null;
    checkin_date: string;
    created_at: string;
  };

  const { data: customerRows } = await admin.from("customers").select("id").eq("email", e);
  const customerIds = (customerRows ?? []).map((m: any) => m.id);

  const laneQueries: Promise<{ data: any[] | null }>[] = [];
  if (customerIds.length > 0) {
    laneQueries.push(
      admin
        .from("checkins")
        .select("customer_id, place_id, shop_slug, checkin_date, created_at")
        .in("customer_id", customerIds)
    );
  }
  laneQueries.push(
    admin
      .from("checkins")
      .select("customer_email, place_id, shop_slug, checkin_date, created_at")
      .eq("customer_email", e)
  );

  const laneResults = await Promise.all(laneQueries);
  const seen = new Set<string>();
  const visits: { placeId: string | null; anchor: string; at: number }[] = [];
  for (const row of laneResults.flatMap((r) => r.data ?? []) as VisitRow[]) {
    const placeId = row.place_id;
    const anchor = placeId ?? (row.shop_slug ? `slug:${row.shop_slug}` : "none");
    const key = `${anchor}|${row.checkin_date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    visits.push({ placeId, anchor, at: new Date(row.created_at).getTime() });
  }

  // ── Neighborhoods: one join for all visited place ids ───────────────
  const placeIds = [...new Set(visits.map((v) => v.placeId).filter(Boolean))] as string[];
  const neighborhoodByPlace = new Map<string, string>();
  if (placeIds.length > 0) {
    const { data: places } = await admin
      .from("places")
      .select("id, neighborhood")
      .in("id", placeIds);
    for (const p of places ?? []) {
      if (p.neighborhood) neighborhoodByPlace.set(p.id, p.neighborhood);
    }
  }
  const neighborhoodCounts = new Map<string, number>();
  for (const v of visits) {
    const hood = v.placeId ? neighborhoodByPlace.get(v.placeId) : undefined;
    if (!hood) continue;
    neighborhoodCounts.set(hood, (neighborhoodCounts.get(hood) ?? 0) + 1);
  }
  const bestNeighborhood = Math.max(0, ...neighborhoodCounts.values());

  // ── Pioneer: the user's earliest check-in at a place is also the
  // globally earliest there. Permanent by construction — the comparison is
  // against the whole check-ins table, so it can only be revoked by a row
  // forged with an earlier timestamp.
  let pioneer = false;
  if (placeIds.length > 0) {
    const userEarliest = new Map<string, number>();
    for (const v of visits) {
      if (!v.placeId) continue;
      const prev = userEarliest.get(v.placeId);
      if (prev == null || v.at < prev) userEarliest.set(v.placeId, v.at);
    }

    const { data: earliestRows } = await admin
      .from("checkins")
      .select("place_id, created_at")
      .in("place_id", placeIds)
      .order("created_at", { ascending: true });
    const globalEarliest = new Map<string, number>();
    for (const row of earliestRows ?? []) {
      if (!row.place_id || globalEarliest.has(row.place_id)) continue;
      globalEarliest.set(row.place_id, new Date(row.created_at).getTime());
    }

    for (const [placeId, at] of userEarliest) {
      const g = globalEarliest.get(placeId);
      if (g == null || at <= g) {
        pioneer = true;
        break;
      }
    }
  }

  const distinctPlaces = visits.filter((v) => v.anchor !== "none").length;

  return [
    {
      id: "founding-member",
      label: "Founding Member",
      description: "On Ventzon before the public launch",
      earned: foundingMember,
    },
    {
      id: "pioneer",
      label: "Pioneer",
      description: "First person ever to check in at a place",
      earned: pioneer,
    },
    {
      id: "explorer",
      label: "Explorer",
      description: "5 places checked in",
      earned: distinctPlaces >= 5,
    },
    {
      id: "neighborhood-regular",
      label: "Neighborhood Regular",
      description: "5 check-ins in one neighborhood",
      earned: bestNeighborhood >= 5,
    },
  ];
}

/** A post, reduced to what the verified-visit question needs. */
export type VisitCandidate = {
  id: string;
  author_email: string;
  shop_slug: string | null;
  place_id: string | null;
  created_at: string;
};

/**
 * How long before a post a check-in still counts as proof of that visit.
 *
 * A verified visit means "you were there when you posted this", not "you went
 * there once, at some point". Without a window a single check-in in February
 * badges every post at that place forever, which is a claim the data does not
 * support.
 *
 * NOTE for the GPS slice: the window is deliberately BACKWARD-only, so a
 * check-in written after the post does not count. That matters, because the
 * GPS design has the post publishing before the location fix resolves — a
 * check-in landing seconds AFTER its own post is the normal case there, not an
 * edge case, and it will not badge under this rule. Resolve it there with an
 * explicit forward grace value rather than by widening this one silently.
 */
const VISIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Which posts represent a REAL visit?
 *
 * A post is a "verified visit" when its author checked in at the place it is
 * tagged to, within VISIT_WINDOW_MS before the post was made. This is the one
 * trust signal no other platform can copy, so it is computed from `checkins`,
 * never stored on the post where it could drift or be forged.
 *
 * TWO LANES, because a check-in can be anchored two ways:
 *
 *   A. membership — `customers` ties an email to a shop, `checkins.customer_id`
 *      ties that membership to visits. The original QR path.
 *   B. place — `checkins.customer_email` + `place_id`, for the 3,281 imported
 *      places where no merchant account exists, so no membership can.
 *
 * The lanes are UNIONED AND DEDUPLICATED ON (email, place_id, checkin_date),
 * not counted. One person can legitimately hold both kinds of row for the same
 * visit once a merchant claims a place — the membership appears and the older
 * place check-in stays — and any count built on top of this later would then
 * report one visit as two. Deduplicating on the identity of the visit rather
 * than on the row makes that impossible by construction instead of by everyone
 * downstream remembering.
 *
 * Returns a Set of POST IDS. It used to return "email|shop_slug" keys, which a
 * time window makes wrong: two posts by the same author at the same place can
 * now differ, so the answer belongs to the post, not to the pair.
 */
export async function getVerifiedVisitSet(
  admin: any,
  posts: VisitCandidate[]
): Promise<Set<string>> {
  const verified = new Set<string>();
  if (posts.length === 0) return verified;

  const emails = [...new Set(posts.map((p) => p.author_email))];
  const slugs = [...new Set(posts.map((p) => p.shop_slug).filter(Boolean))] as string[];
  const placeIds = [...new Set(posts.map((p) => p.place_id).filter(Boolean))] as string[];
  if (emails.length === 0 || (slugs.length === 0 && placeIds.length === 0)) return verified;

  // One window covering the whole batch, narrowed per post below. Fetching
  // per post would be N queries for a feed page.
  const times = posts.map((p) => new Date(p.created_at).getTime()).filter((t) => !isNaN(t));
  if (times.length === 0) return verified;
  const windowStart = new Date(Math.min(...times) - VISIT_WINDOW_MS).toISOString();
  const windowEnd = new Date(Math.max(...times)).toISOString();

  // A visit, independent of which lane produced it.
  type Visit = { email: string; shopSlug: string | null; placeId: string | null; at: number };
  type MembershipRow = { id: string; email: string; shop_slug: string };
  type CheckinRow = {
    customer_id?: string | null;
    customer_email?: string | null;
    place_id: string | null;
    shop_slug: string | null;
    checkin_date: string;
    created_at: string;
  };
  const seen = new Set<string>();
  const byEmail = new Map<string, Visit[]>();

  const addVisit = (v: Visit, checkinDate: string) => {
    // The dedup identity. `place_id` is the real anchor; a check-in at a shop
    // with no `places` row falls back to its slug so those rows still collapse
    // against themselves rather than silently defeating the check.
    const anchor = v.placeId ?? (v.shopSlug ? `slug:${v.shopSlug}` : "none");
    const key = `${v.email}|${anchor}|${checkinDate}`;
    if (seen.has(key)) return;
    seen.add(key);
    const list = byEmail.get(v.email);
    if (list) list.push(v);
    else byEmail.set(v.email, [v]);
  };

  // ── Lane A: membership check-ins ──────────────────────────────────────
  if (slugs.length > 0) {
    const { data: memberships } = await admin
      .from("customers")
      .select("id, email, shop_slug")
      .in("email", emails)
      .in("shop_slug", slugs);

    if (memberships?.length) {
      const byCustomerId = new Map<string, { email: string; shop_slug: string }>(
        (memberships as MembershipRow[]).map((m) => [
          m.id,
          { email: m.email, shop_slug: m.shop_slug },
        ])
      );
      const { data: visits } = await admin
        .from("checkins")
        .select("customer_id, place_id, shop_slug, checkin_date, created_at")
        .in("customer_id", [...byCustomerId.keys()])
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd);

      for (const v of (visits ?? []) as CheckinRow[]) {
        const owner = v.customer_id ? byCustomerId.get(v.customer_id) : undefined;
        if (!owner) continue;
        addVisit(
          {
            email: owner.email,
            shopSlug: v.shop_slug ?? owner.shop_slug,
            placeId: v.place_id ?? null,
            at: new Date(v.created_at).getTime(),
          },
          v.checkin_date
        );
      }
    }
  }

  // ── Lane B: place check-ins ───────────────────────────────────────────
  if (placeIds.length > 0) {
    const { data: placeVisits } = await admin
      .from("checkins")
      .select("customer_email, place_id, shop_slug, checkin_date, created_at")
      .in("customer_email", emails)
      .in("place_id", placeIds)
      .gte("created_at", windowStart)
      .lte("created_at", windowEnd);

    for (const v of (placeVisits ?? []) as CheckinRow[]) {
      if (!v.customer_email) continue;
      addVisit(
        {
          email: v.customer_email,
          shopSlug: v.shop_slug ?? null,
          placeId: v.place_id ?? null,
          at: new Date(v.created_at).getTime(),
        },
        v.checkin_date
      );
    }
  }

  // ── Resolve per post ──────────────────────────────────────────────────
  for (const post of posts) {
    const postedAt = new Date(post.created_at).getTime();
    if (isNaN(postedAt)) continue;
    const candidates = byEmail.get(post.author_email);
    if (!candidates) continue;

    const hit = candidates.some((v) => {
      // Same place: by id when both sides have one, by slug otherwise. A post
      // at an imported place has place_id and NO shop_slug, which is exactly
      // the case the slug-only version could never match.
      const samePlace =
        (post.place_id != null && v.placeId != null && v.placeId === post.place_id) ||
        (post.shop_slug != null && v.shopSlug != null && v.shopSlug === post.shop_slug);
      if (!samePlace) return false;
      return v.at <= postedAt && v.at >= postedAt - VISIT_WINDOW_MS;
    });

    if (hit) verified.add(post.id);
  }

  return verified;
}
