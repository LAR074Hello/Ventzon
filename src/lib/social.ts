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
  return [
    { id: "first-steps", label: "First Steps", description: "First check-in", earned: stats.checkins >= 1 },
    { id: "regular", label: "Regular", description: "25 check-ins", earned: stats.checkins >= 25 },
    { id: "local-legend", label: "Local Legend", description: "100 check-ins", earned: stats.checkins >= 100 },
    { id: "explorer", label: "Explorer", description: "5 businesses visited", earned: stats.businesses_visited >= 5 },
    { id: "pathfinder", label: "Pathfinder", description: "15 businesses visited", earned: stats.businesses_visited >= 15 },
    { id: "first-reward", label: "First Reward", description: "Earned a reward", earned: stats.rewards_earned >= 1 },
    { id: "connector", label: "Connector", description: "Referred a friend", earned: stats.referrals >= 1 },
    { id: "ambassador", label: "Ambassador", description: "5 referrals", earned: stats.referrals >= 5 },
  ];
}
