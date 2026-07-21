// Value-based notification plumbing for the retention layer.
//
// Only these notification types exist, each tied to something genuinely
// useful to the customer — a followed shop posting a drop, a reward
// nearing its expiry date, a new place opening nearby, a new follower,
// or someone engaging with your own post. There is no generic
// "come back!" type and none should be added.
//
// Frequency caps (per customer):
//   drop          — max 1 per day
//   reward_expiry — max 1 per day
//   new_nearby    — max 1 per week
//   new_follower  — max 1 per 6 hours
//   post_like     — max 1 per 6 hours
//   post_comment  — max 1 per hour (conversation is time-sensitive)
//   all types     — max 5 per week combined
//
// Dedupe: customer_notification_log is unique on (email, type, ref_id),
// so claiming the same notification twice is a no-op. Callers claim
// BEFORE sending, which keeps cron re-runs idempotent.

export type RetentionNotificationType =
  | "drop"
  | "reward_expiry"
  | "new_nearby"
  | "new_follower"
  | "post_like"
  | "post_comment";

const DAY_MS = 24 * 60 * 60 * 1000;

const TYPE_WINDOW_MS: Record<RetentionNotificationType, number> = {
  drop: DAY_MS,
  reward_expiry: DAY_MS,
  new_nearby: 7 * DAY_MS,
  new_follower: DAY_MS / 4,
  post_like: DAY_MS / 4,
  post_comment: DAY_MS / 24,
};

const GLOBAL_WINDOW_MS = 7 * DAY_MS;
const GLOBAL_CAP = 5;

const PREF_COLUMN: Record<RetentionNotificationType, string> = {
  drop: "notify_drops",
  reward_expiry: "notify_reward_expiry",
  new_nearby: "notify_new_nearby",
  new_follower: "notify_new_follower",
  post_like: "notify_post_engagement",
  post_comment: "notify_post_engagement",
};

/**
 * True when this customer can receive a notification of this type right
 * now: the per-type preference is on (default), the per-type cap has
 * room, and the combined weekly cap has room.
 */
export async function canNotify(
  admin: any,
  email: string,
  type: RetentionNotificationType
): Promise<boolean> {
  const e = email.toLowerCase().trim();
  if (!e) return false;

  const { data: pref } = await admin
    .from("customer_notification_prefs")
    .select("notify_drops, notify_reward_expiry, notify_new_nearby, notify_new_follower, notify_post_engagement")
    .eq("email", e)
    .maybeSingle();
  if (pref && pref[PREF_COLUMN[type]] === false) return false;

  const typeSince = new Date(Date.now() - TYPE_WINDOW_MS[type]).toISOString();
  const { count: typeCount } = await admin
    .from("customer_notification_log")
    .select("id", { count: "exact", head: true })
    .eq("email", e)
    .eq("type", type)
    .gte("sent_at", typeSince);
  if ((typeCount ?? 0) >= 1) return false;

  const globalSince = new Date(Date.now() - GLOBAL_WINDOW_MS).toISOString();
  const { count: totalCount } = await admin
    .from("customer_notification_log")
    .select("id", { count: "exact", head: true })
    .eq("email", e)
    .gte("sent_at", globalSince);
  if ((totalCount ?? 0) >= GLOBAL_CAP) return false;

  return true;
}

/**
 * Claim a notification before sending it. Returns false when this exact
 * (customer, type, ref_id) was already claimed — the caller should skip
 * the send. Insert-first makes concurrent cron runs safe.
 */
export async function claimNotification(
  admin: any,
  opts: {
    email: string;
    type: RetentionNotificationType;
    shopSlug?: string | null;
    refId: string;
  }
): Promise<boolean> {
  const { error } = await admin.from("customer_notification_log").insert({
    email: opts.email.toLowerCase().trim(),
    type: opts.type,
    shop_slug: opts.shopSlug ?? null,
    ref_id: opts.refId,
  });
  return !error;
}
