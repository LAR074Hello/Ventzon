#!/usr/bin/env node
/**
 * Backfill shops.plan_interval from Stripe subscription data.
 *
 * WHY THIS EXISTS. The 20260822_plan_interval migration adds shops.plan_interval
 * as NULL. The database cannot know which plan a merchant bought — that lives
 * on the Stripe subscription (items[].price.recurring.interval). This script
 * asks Stripe for each subscribed shop's interval and stores it, so the rep
 * commission logic (src/lib/rep-utils.ts) credits annual signups ($150 in
 * month one, then $15/mo) and monthly signups ($15/mo only) correctly.
 *
 * SAFETY. Purely informational — it only writes the plan_interval column and
 * never touches commission or payout records. Shops whose subscription can't
 * be resolved (missing stripe_subscription_id, price mismatch, Stripe error)
 * are left NULL, which src/lib/rep-utils.ts treats as the safe $15/mo monthly
 * treatment. It NEVER credits a $150 signup commission retroactively.
 *
 * EXECUTION (production):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... STRIPE_SECRET_KEY=... \
 *     node scripts/backfill-plan-interval.mjs --apply
 *
 * Dry-run by default: prints how many shops would be 'monthly' / 'annual'.
 * Idempotent: only writes rows whose interval actually changed.
 */
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const APPLY = process.argv.includes("--apply");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!url || !key || !stripeKey) {
  console.error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and STRIPE_SECRET_KEY are required.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const stripe = new Stripe(stripeKey);

async function main() {
  const { data: shops, error } = await db
    .from("shops")
    .select("slug, stripe_subscription_id, plan_interval")
    .not("stripe_subscription_id", "is", null);
  if (error) throw new Error(error.message);

  console.log(`${shops?.length ?? 0} shop(s) with a Stripe subscription.`);

  let monthly = 0;
  let annual = 0;
  let skipped = 0;

  for (const shop of shops ?? []) {
    let interval = null;
    try {
      const sub = await stripe.subscriptions.retrieve(shop.stripe_subscription_id);
      const price = sub.items?.data?.[0]?.price;
      if (price?.recurring?.interval === "year") interval = "annual";
      else if (price?.recurring?.interval === "month") interval = "monthly";
    } catch (e) {
      console.warn(`Could not resolve subscription for shop ${shop.slug}: ${e?.message ?? e}`);
    }

    if (!interval) {
      skipped++;
      continue;
    }

    if (!APPLY) {
      if (interval === "annual") annual++;
      else monthly++;
      continue;
    }

    // Idempotent: skip rows that already carry the right value.
    if (shop.plan_interval === interval) {
      if (interval === "annual") annual++;
      else monthly++;
      continue;
    }

    const { error: upErr } = await db
      .from("shops")
      .update({ plan_interval: interval })
      .eq("slug", shop.slug);
    if (upErr) {
      console.error(`Failed to update shop ${shop.slug}: ${upErr.message}`);
      skipped++;
    } else {
      if (interval === "annual") annual++;
      else monthly++;
    }
  }

  console.log(`${monthly} shop(s) → 'monthly' (${APPLY ? "applied" : "would be applied"}).`);
  console.log(`${annual} shop(s) → 'annual' (${APPLY ? "applied" : "would be applied"}).`);
  console.log(`${skipped} shop(s) left NULL — safe $15/mo monthly treatment, no retroactive $150 credits.`);
  if (!APPLY) console.log("Dry run — re-run with --apply to write plan_interval.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
