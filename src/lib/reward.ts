// Shared reward-mode logic used by both the public check-in
// (/api/join/checkin) and the merchant manual check-in
// (/api/merchant/manual-checkin) so the two never diverge.
//
// Both modes share one balance column (customers.visits) and one
// threshold (shop_settings.reward_goal):
//   stamps — each check-in earns 1 (2 on bonus days); balance resets
//            to 0 when the goal is reached.
//   points — each check-in earns points_per_visit (doubled on bonus
//            days); balance carries the remainder (balance -= goal)
//            when the goal is reached. No dollar amount is involved,
//            so check-in stays fully self-serve (QR), same as stamps.

export type RewardMode = "stamps" | "points";

export function normalizeMode(v: unknown): RewardMode {
  return v === "points" ? "points" : "stamps";
}

/**
 * Points earned for a single check-in.
 * - stamps: 1, or 2 on a bonus day
 * - points: pointsPerVisit, or 2× on a bonus day
 */
export function earnedForCheckin(opts: {
  mode: RewardMode;
  isBonusDay?: boolean;
  pointsPerVisit?: number;
}): number {
  if (opts.mode === "points") {
    const base = Math.max(1, Math.round(Number(opts.pointsPerVisit ?? 10)));
    return opts.isBonusDay ? base * 2 : base;
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
