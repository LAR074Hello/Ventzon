// Shared helpers for the social layer: creator profiles, stats, and
// milestone badges. Badges are computed live from real visit data —
// there is no badges table to drift out of sync.

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
  if (existing) return existing;

  const { data: created, error } = await admin
    .from("customer_profiles")
    .upsert(
      {
        email: e,
        display_name: seed?.display_name ?? null,
        avatar_url: seed?.avatar_url ?? null,
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

/** Milestone badges — pure progress framing, no streaks, no loss. */
export function computeBadges(stats: {
  checkins: number;
  businesses_visited: number;
  rewards_earned: number;
  referrals: number;
}): Badge[] {
  // Four tiers, all reachable in weeks rather than years. Unreachable
  // badges (100 check-ins) advertise how far you are from earning
  // anything, which is the opposite of the point.
  return [
    { id: "first-steps", label: "First Steps", description: "First check-in", earned: stats.checkins >= 1 },
    { id: "first-reward", label: "First Reward", description: "Earned a reward", earned: stats.rewards_earned >= 1 },
    { id: "explorer", label: "Explorer", description: "5 businesses visited", earned: stats.businesses_visited >= 5 },
    { id: "regular", label: "Regular", description: "25 check-ins", earned: stats.checkins >= 25 },
  ];
}

/**
 * Which (author_email, shop_slug) pairs represent a REAL visit?
 *
 * A post is a "verified visit" when its author has at least one
 * check-in at the business it's tagged to. This is the one trust
 * signal no other platform can copy — it comes from the QR moat, not
 * from self-reporting — so it is computed from `checkins`, never
 * stored on the post where it could drift or be forged.
 *
 * Returns a Set of "email|shop_slug" keys.
 */
export async function getVerifiedVisitSet(
  admin: any,
  pairs: { author_email: string; shop_slug: string | null }[]
): Promise<Set<string>> {
  const verified = new Set<string>();
  const emails = [...new Set(pairs.map((p) => p.author_email))];
  const slugs = [...new Set(pairs.map((p) => p.shop_slug).filter(Boolean))] as string[];
  if (emails.length === 0 || slugs.length === 0) return verified;

  // customers rows tie an email to a shop; checkins tie a customer row
  // to actual visits. Both are needed — a membership without a check-in
  // is not a visit.
  const { data: memberships } = await admin
    .from("customers")
    .select("id, email, shop_slug")
    .in("email", emails)
    .in("shop_slug", slugs);
  if (!memberships?.length) return verified;

  const { data: visits } = await admin
    .from("checkins")
    .select("customer_id")
    .in(
      "customer_id",
      memberships.map((m: any) => m.id)
    );
  const visited = new Set((visits ?? []).map((v: any) => v.customer_id));

  for (const m of memberships as any[]) {
    if (visited.has(m.id)) verified.add(`${m.email}|${m.shop_slug}`);
  }
  return verified;
}
