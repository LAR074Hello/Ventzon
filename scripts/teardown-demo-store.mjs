#!/usr/bin/env node
/**
 * Remove the App Store review demo store and every demo row it created.
 *
 * Touches ONLY rows tied to demo@ventzon.app / demo.customerX@ventzon.app,
 * the bluebird-coffee-co shop slug, and the fixed demo post ids. No real
 * data is ever matched.
 *
 * Usage:
 *   node scripts/teardown-demo-store.mjs              # dry-run
 *   node scripts/teardown-demo-store.mjs --apply      # remove from DEV
 *   node scripts/teardown-demo-store.mjs --apply --production
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, projectRefFrom, PRODUCTION_PROJECT_REF, DEV_PROJECT_REF } from "./dev-guard.mjs";
import { DEMO_SHOP_SLUG, DEMO_OWNER_EMAIL, DEMO_CUSTOMERS, DEMO_POSTS } from "./seed/demo-store-data.mjs";

const APPLY = process.argv.includes("--apply");
const PROD_FLAG = process.argv.includes("--production");

const env = { ...loadEnv(), ...process.env };
const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ref = projectRefFrom(url);

function die(msg) { console.error(`✗ ${msg}`); process.exit(1); }

if (!url) die("SUPABASE_URL not set (check .env.local).");
if (!key) die("SUPABASE_SERVICE_ROLE_KEY not set (check .env.local).");
if (!ref) die("Could not detect a Supabase project ref in the URL.");
if (ref === PRODUCTION_PROJECT_REF && !PROD_FLAG) die("Targets PRODUCTION — pass --production to confirm.");
if (ref === PRODUCTION_PROJECT_REF && PROD_FLAG) console.log("Target: PRODUCTION (confirmed via --production).");
if (ref === DEV_PROJECT_REF && PROD_FLAG) die("--production given but URL points at the DEV project.");
if (ref !== PRODUCTION_PROJECT_REF && ref !== DEV_PROJECT_REF) die(`Unknown project ref ${ref} — refusing.`);

const db = createClient(url, key, { auth: { persistSession: false } });
const step = (msg) => console.log((APPLY ? "· remove: " : "· plan:    ") + msg);

const emails = [DEMO_OWNER_EMAIL, ...DEMO_CUSTOMERS.map((c) => c.email)];
const postIds = DEMO_POSTS.map((p) => p.id);

// Count (or delete, in apply mode) rows matched by the given filter.
async function del(table, qb) {
  const countQ = qb(db.from(table).select("*", { count: "exact", head: true }));
  const { count } = await countQ;
  const n = count ?? 0;
  step(`${table}  ${n}`);
  if (n === 0) return;
  if (!APPLY) return;
  const { error } = await qb(db.from(table).delete());
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  // Read-only: find the demo shop id so member rows can be matched.
  const { data: shop } = await db.from("shops").select("id").eq("slug", DEMO_SHOP_SLUG).maybeSingle();
  const shopId = shop?.id ?? null;

  // FK-safe order: engagement → posts → loyalty → shop → profiles → auth.
  await del("post_comments", (q) => q.in("post_id", postIds));
  await del("post_likes", (q) => q.in("post_id", postIds));
  await del("post_saves", (q) => q.in("post_id", postIds));
  await del("posts", (q) => q.in("id", postIds));
  await del("customer_follows", (q) => q.in("email", emails).eq("shop_slug", DEMO_SHOP_SLUG));
  await del("referrals", (q) => q.in("referrer_email", emails));
  await del("checkins", (q) => q.eq("shop_slug", DEMO_SHOP_SLUG));
  await del("reward_events", (q) => q.eq("shop_slug", DEMO_SHOP_SLUG));
  await del("customers", (q) => q.eq("shop_slug", DEMO_SHOP_SLUG));
  await del("promotions", (q) => q.eq("shop_slug", DEMO_SHOP_SLUG));
  await del("shop_settings", (q) => q.eq("shop_slug", DEMO_SHOP_SLUG));
  await del("places", (q) => q.eq("slug", DEMO_SHOP_SLUG));
  if (shopId) await del("shop_members", (q) => q.eq("shop_id", shopId));
  await del("shops", (q) => q.eq("slug", DEMO_SHOP_SLUG));
  await del("customer_profiles", (q) => q.in("email", emails));

  // ── auth users (shops/shop_members already removed, so no FK blocks) ──
  const { data: allUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const demoUsers = (allUsers?.users ?? []).filter((u) =>
    emails.some((e) => u.email?.toLowerCase() === e.toLowerCase())
  );
  step(`auth.users  ${demoUsers.length}`);
  if (APPLY) {
    for (const u of demoUsers) {
      const { error } = await db.auth.admin.deleteUser(u.id);
      if (error) throw new Error(`auth.users ${u.email}: ${error.message}`);
    }
  }

  console.log("");
  console.log(APPLY ? "✓ Demo store removed." : "✓ Dry-run plan above — nothing was deleted.");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("✗", err?.message ?? err);
  process.exit(1);
});
