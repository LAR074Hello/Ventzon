// Shared reward-mode logic used by both the public check-in
// (/api/join/checkin) and the merchant manual check-in
// (/api/merchant/manual-checkin) so the two never diverge.
//
// Both modes share one balance column (customers.visits) and one
// threshold (shop_settings.reward_goal):
//   stamps — each check-in earns 1 (2 on bonus days); balance resets
//            to 0 when the goal is reached.
//   points — each check-in earns round(amount * points_per_dollar);
//            balance carries the remainder (balance -= goal) so points
//            from a large purchase are not lost.

export type RewardMode = "stamps" | "points";

export function normalizeMode(v: unknown): RewardMode {
  return v === "points" ? "points" : "stamps";
}

/**
 * Points earned for a single check-in.
 * - stamps: 1, or 2 on a bonus day
 * - points: round(amount * pointsPerDollar), never negative
 */
export function earnedForCheckin(opts: {
  mode: RewardMode;
  isBonusDay?: boolean;
  amount?: number;         // dollar amount (points mode)
  pointsPerDollar?: number;
}): number {
  if (opts.mode === "points") {
    const amt = Number(opts.amount ?? 0);
    const rate = Number(opts.pointsPerDollar ?? 1);
    if (!Number.isFinite(amt) || amt <= 0) return 0;
    return Math.max(0, Math.round(amt * rate));
  }
  return opts.isBonusDay ? 2 : 1;
}

/**
 * Apply earned units to the current balance and decide whether a
 * reward was triggered.
 */
export function applyReward(opts: {
  mode: RewardMode;
  currentBalance: number;
  goal: number;
  earned: number;
}): { newBalance: number; hitGoal: boolean } {
  const raw = Number(opts.currentBalance ?? 0) + Number(opts.earned ?? 0);
  const hitGoal = opts.goal > 0 && raw >= opts.goal;
  if (!hitGoal) return { newBalance: raw, hitGoal: false };
  // Stamps wipe to 0; points carry the overflow forward.
  const newBalance = opts.mode === "points" ? raw - opts.goal : 0;
  return { newBalance, hitGoal: true };
}
