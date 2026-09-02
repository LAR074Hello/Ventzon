/**
 * Shared helpers for deferred merchant shop creation.
 *
 * Onboarding no longer writes a shop row when the merchant types their name.
 * The only place a shop is created is the Stripe webhook once payment is
 * confirmed (checkout.session.completed). These helpers are deliberately DB-
 * adapter-shaped so the webhook logic can be exercised against a mock DB in
 * tests without network access.
 */

export interface ShopSlugLookup {
  findSlug(slug: string): Promise<{
    data: { id: string } | null;
    error: { message: string } | null;
  }>;
}

export interface ShopWriteDb extends ShopSlugLookup {
  insertShop(row: {
    slug: string;
    user_id: string;
    is_paid: boolean;
    subscription_status: string;
    plan_type: string;
    plan_interval: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  }): Promise<{
    data: { id: string; slug: string } | null;
    error: { message: string } | null;
  }>;
  insertMember(row: {
    shop_id: string;
    user_id: string;
    role: string;
  }): Promise<{ error: { message: string } | null }>;
  insertSettings(row: {
    shop_slug: string;
    shop_name: string;
    deal_title: string | null;
    deal_details: string | null;
    reward_goal: number;
  }): Promise<{ error: { message: string } | null }>;
}

/** URL-safe slug. Users never see the word "slug". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isUniqueViolation(message: string): boolean {
  const code = /code\s*[=:]\s*23505/i.test(message);
  const text = /duplicate|unique/i.test(message);
  return code || text;
}

/** Find an unused slug, appending -2, -3, … while taken. */
export async function uniqueSlug(
  db: ShopSlugLookup,
  base: string
): Promise<string> {
  let candidate = base || `shop-${Date.now()}`;
  let n = 2;
  for (;;) {
    const { data, error } = await db.findSlug(candidate);
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    candidate = `${base || "shop"}-${n}`;
    n += 1;
  }
}

export type CreatePaidShopOptions = {
  slug: string;
  name: string;
  userId: string;
  planType?: string;
  planInterval?: "monthly" | "annual" | string;
  customerId?: string | null;
  subscriptionId?: string | null;
};

/**
 * Insert a paid/active shop plus its settings and owner row. Called only after
 * payment is confirmed. Retries with a -N slug suffix if the slug was taken
 * between checkout and webhook processing. Settings/membership inserts are
 * best-effort (the dashboard lazily backfills settings; ownership is also
 * carried by shops.user_id).
 */
export async function createPaidShop(
  db: ShopWriteDb,
  opts: CreatePaidShopOptions
): Promise<{ id: string; slug: string }> {
  const base = opts.slug || slugify(opts.name);
  const planType = opts.planType || "pro";
  const planInterval = opts.planInterval || "monthly";

  let row: { id: string; slug: string } | null = null;

  for (let attempt = 0; attempt < 10 && !row; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { data, error } = await db.insertShop({
      slug: candidate,
      user_id: opts.userId,
      is_paid: true,
      subscription_status: "active",
      plan_type: planType,
      plan_interval: planInterval,
      stripe_customer_id: opts.customerId ?? null,
      stripe_subscription_id: opts.subscriptionId ?? null,
    });

    if (!error && data) {
      row = data;
      break;
    }

    if (error && isUniqueViolation(error.message)) {
      continue; // slug raced — try the next suffix
    }
    if (error) throw new Error(error.message);
  }

  if (!row) {
    throw new Error("Could not reserve a unique shop slug");
  }

  const { error: memberErr } = await db.insertMember({
    shop_id: row.id,
    user_id: opts.userId,
    role: "owner",
  });
  if (memberErr) {
    console.warn("shop_members insert failed (non-fatal):", memberErr.message);
  }

  const { error: settingsErr } = await db.insertSettings({
    shop_slug: row.slug,
    shop_name: opts.name,
    deal_title: null,
    deal_details: null,
    reward_goal: 5,
  });
  if (settingsErr) {
    console.warn("shop_settings insert failed (non-fatal):", settingsErr.message);
  }

  return row;
}
