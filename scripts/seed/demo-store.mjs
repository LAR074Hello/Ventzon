#!/usr/bin/env node
/**
 * Seed the App Store review demo merchant (idempotent).
 *
 * REVIEW CREDENTIALS (paste into App Store Connect review notes):
 *   Merchant: demo@ventzon.app / VentzonDemo2026!
 *   Customer: demo.customer1@ventzon.app (…customer5) / VentzonDemo2026!
 *
 * Usage:
 *   node scripts/seed/demo-store.mjs                # dry-run (no writes)
 *   node scripts/seed/demo-store.mjs --apply        # write to DEV
 *   node scripts/seed/demo-store.mjs --apply --production
 *
 * Reads env via loadEnv() (scripts/dev-guard.mjs) merged with process.env,
 * which wins. Refuses unknown projects and refuses PROD without --production.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, projectRefFrom, PRODUCTION_PROJECT_REF, DEV_PROJECT_REF } from "../dev-guard.mjs";
import {
  DEMO_SHOP_SLUG, DEMO_SHOP_NAME, DEMO_PASSWORD, DEMO_OWNER_EMAIL,
  DEMO_SHOP, DEMO_CUSTOMERS, DEMO_POSTS, DEMO_LIKES, DEMO_COMMENTS, DEMO_PROMOTIONS,
} from "./demo-store-data.mjs";

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

// shops.is_demo comes from supabase/migrations/20260820_demo_store.sql.
// Detect it so the seed still works before that migration is applied
// (the demo remains identifiable by @ventzon.app and the shop slug), while
// warning loudly that the tag is missing.
const { error: isDemoProbeErr } = await db.from("shops").select("is_demo").limit(1);
const hasIsDemo = !isDemoProbeErr;
if (!hasIsDemo) {
  console.warn(
    "⚠ shops.is_demo is missing — apply supabase/migrations/20260820_demo_store.sql, " +
    "then re-run so the demo store is tagged is_demo = true."
  );
}

async function ensureAuthUser(email, fullName) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (data?.user) return data.user;
  if (error) {
    // Already registered (idempotent re-run) → fetch the existing id.
    const { data: list, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
    const found = (list?.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    throw new Error(`createUser failed for ${email}: ${error.message}`);
  }
  throw new Error(`createUser returned no user for ${email}`);
}

const step = (msg) => console.log((APPLY ? "· apply: " : "· plan:  ") + msg);

async function write(table, rows, opts = {}) {
  if (!rows || rows.length === 0) return;
  step(`${table}  ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  if (!APPLY) return;
  const q = opts.upsert
    ? db.from(table).upsert(rows, { onConflict: opts.upsert })
    : db.from(table).insert(rows);
  if (opts.returning) q.select(opts.returning);
  const { error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  const now = Date.now();

  // ── auth users ─────────────────────────────────────────────────────
  // Created only in apply mode; a dry-run must not touch the API.
  let owner = { id: "00000000-0000-4000-8000-0000000000aa" };
  let customers = [];
  if (APPLY) {
    owner = await ensureAuthUser(DEMO_OWNER_EMAIL, "Bluebird Demo Owner");
    for (const c of DEMO_CUSTOMERS) {
      const u = await ensureAuthUser(c.email, c.display_name);
      customers.push({ ...c, userId: u.id });
    }
  } else {
    customers = DEMO_CUSTOMERS.map((c) => ({ ...c, userId: null }));
  }
  step(`auth.users  owner ${DEMO_OWNER_EMAIL} + ${DEMO_CUSTOMERS.length} demo customers`);

  // ── shop + settings + membership + place ───────────────────────────
  await write("shops", [{
    slug: DEMO_SHOP_SLUG,
    user_id: owner.id,
    is_paid: false,
    subscription_status: "inactive",
    plan_type: "free",
    logo_url: DEMO_SHOP.logo_url,
    address: DEMO_SHOP.address,
    latitude: DEMO_SHOP.latitude,
    longitude: DEMO_SHOP.longitude,
    ...(hasIsDemo ? { is_demo: true } : {}),
  }], { upsert: "slug" });

  let shopId = "00000000-0000-4000-8000-0000000000bb";
  if (APPLY) {
    const { data: s } = await db.from("shops").select("id").eq("slug", DEMO_SHOP_SLUG).single();
    if (!s) throw new Error("shop row missing after upsert");
    shopId = s.id;
  }

  await write("shop_members", [{ shop_id: shopId, user_id: owner.id, role: "owner" }], { upsert: "shop_id,user_id" });
  await write("shop_settings", [{
    shop_slug: DEMO_SHOP_SLUG,
    shop_name: DEMO_SHOP_NAME,
    deal_title: DEMO_SHOP.deal_title,
    deal_details: DEMO_SHOP.deal_details,
    reward_goal: DEMO_SHOP.reward_goal,
    visits_required: DEMO_SHOP.reward_goal,
    reward_mode: "stamps",
    reward_expires_days: 84,
    reward_unlocked_text: "Free coffee, on us. Thanks for being a regular!",
    welcome_sms_template: "Welcome to {shop_name}! Scan to start earning your free coffee.",
    progress_sms_template: "You are {visits}/{goal} visits from a free coffee at {shop_name}.",
  }], { upsert: "shop_slug" });
  await write("places", [{
    slug: DEMO_SHOP_SLUG,
    name: DEMO_SHOP_NAME,
    address: DEMO_SHOP.address,
    latitude: DEMO_SHOP.latitude,
    longitude: DEMO_SHOP.longitude,
    neighborhood: DEMO_SHOP.neighborhood,
    city: DEMO_SHOP.city,
    category: "cafe",
    photos: [DEMO_SHOP.logo_url],
    verification_tier: "claimed",
    source: "merchant",
    claimed_by: shopId,
    claimed_at: new Date().toISOString(),
  }], { upsert: "slug" });

  // ── demo customers: profiles + memberships + check-ins ─────────────
  const profileRows = customers.map((c) => ({
    email: c.email,
    display_name: c.display_name,
    bio: c.bio || null,
    is_creator: true,
    show_on_leaderboard: true,
    dob: c.dob,
  }));
  await write("customer_profiles", profileRows, { upsert: "email" });

  const memberRows = customers.map((c) => ({
    shop_slug: DEMO_SHOP_SLUG,
    email: c.email,
    dob: c.dob,
    visits: c.visits,
    total_spend: c.total_spend,
    reward_unlocked: c.visits >= DEMO_SHOP.reward_goal,
    reward_unlocked_at: c.visits >= DEMO_SHOP.reward_goal ? new Date().toISOString() : null,
    first_seen_at: new Date(now - 40 * 86400e3).toISOString(),
    last_seen_at: new Date(now - 2 * 3600e3).toISOString(),
  }));
  await write("customers", memberRows, { upsert: "shop_slug,email", returning: "id,email" });

  let placeId = "00000000-0000-4000-8000-0000000000cc";
  const custIdByEmail = new Map();
  if (APPLY) {
    const { data: p } = await db.from("places").select("id").eq("slug", DEMO_SHOP_SLUG).single();
    if (!p) throw new Error("place row missing after upsert");
    placeId = p.id;
    const { data: mems } = await db.from("customers").select("id,email").eq("shop_slug", DEMO_SHOP_SLUG);
    for (const m of mems ?? []) custIdByEmail.set(m.email, m.id);
  } else {
    // Placeholder ids so the dry-run plan prints realistic counts.
    let n = 0xd0;
    for (const c of DEMO_CUSTOMERS) {
      custIdByEmail.set(c.email, `00000000-0000-4000-8000-${String(n++).padStart(12, "0")}`);
    }
  }

  // Check-ins: distinct recent days, one per (customer, day). The most recent
  // check-in for a verified-visit author lands 2h before the post so the badge
  // window (src/lib/social.ts, 24h) renders in the feed.
  const DAY_OFFSETS = [0, 2, 5, 9, 14, 20, 27, 35];
  const verifiedByEmail = new Map(DEMO_POSTS.filter((p) => p.verifiedVisit).map((p) => [p.authorEmail, p]));
  const checkinRows = [];
  for (const c of customers) {
    const custId = custIdByEmail.get(c.email);
    const verified = verifiedByEmail.get(c.email);
    const usedDates = new Set();
    for (let i = 0; i < c.visits; i++) {
      const offset = DAY_OFFSETS[i] ?? DAY_OFFSETS[DAY_OFFSETS.length - 1] + (i - DAY_OFFSETS.length + 1);
      let created = new Date(now - offset * 86400e3);
      created.setHours(9 + (i % 10), 15, 0, 0);
      if (verified && i === 0) {
        const postAt = new Date(now - verified.hoursAgo * 3600e3);
        created = new Date(postAt.getTime() - 2 * 3600e3);
      }
      // One check-in per (customer, date); shift back a day until the UTC
      // date is unique for this customer (local-vs-UTC can collide).
      let date = created.toISOString().slice(0, 10);
      while (usedDates.has(date)) {
        created = new Date(created.getTime() - 86400e3);
        date = created.toISOString().slice(0, 10);
      }
      usedDates.add(date);
      checkinRows.push({
        shop_slug: DEMO_SHOP_SLUG,
        place_id: placeId,
        customer_id: custId,
        customer_email: c.email,
        checkin_date: date,
        created_at: created.toISOString(),
      });
    }
  }
  await write("checkins", checkinRows, { upsert: "customer_id,checkin_date" });

  // ── reward history ───────────────────────────────────────────────────
  const pending = customers.find((c) => c.visits >= DEMO_SHOP.reward_goal);
  const rewardRows = [];
  if (pending && custIdByEmail.get(pending.email)) {
    rewardRows.push({
      shop_slug: DEMO_SHOP_SLUG,
      customer_id: custIdByEmail.get(pending.email),
      reward_date: new Date(now).toISOString().slice(0, 10),
      is_redeemed: false,
    });
    rewardRows.push({
      shop_slug: DEMO_SHOP_SLUG,
      customer_id: custIdByEmail.get(pending.email),
      reward_date: new Date(now - 21 * 86400e3).toISOString().slice(0, 10),
      is_redeemed: true,
      redeemed_at: new Date(now - 19 * 86400e3).toISOString(),
    });
  }
  if (APPLY) {
    const { data: existing } = await db.from("reward_events").select("customer_id,reward_date").eq("shop_slug", DEMO_SHOP_SLUG);
    const have = new Set((existing ?? []).map((r) => `${r.customer_id}|${r.reward_date}`));
    await write("reward_events", rewardRows.filter((r) => !have.has(`${r.customer_id}|${r.reward_date}`)));
  } else {
    await write("reward_events", rewardRows);
  }

  // ── followers ────────────────────────────────────────────────────────
  await write(
    "customer_follows",
    customers.map((c) => ({ email: c.email, shop_slug: DEMO_SHOP_SLUG })),
    { upsert: "email,shop_slug" }
  );

  // ── promotions ───────────────────────────────────────────────────────
  let existingPromoNames = new Set();
  if (APPLY) {
    const { data: ex } = await db.from("promotions").select("name").eq("shop_slug", DEMO_SHOP_SLUG);
    existingPromoNames = new Set((ex ?? []).map((p) => p.name));
  }
  const promoRows = DEMO_PROMOTIONS.filter((p) => !existingPromoNames.has(p.name)).map((p) => ({
    shop_slug: DEMO_SHOP_SLUG,
    body: p.body,
    status: p.status,
    name: p.name,
    audience: "all",
    sent_at: null,
  }));
  await write("promotions", promoRows);

  // ── posts ────────────────────────────────────────────────────────────
  const postRows = DEMO_POSTS.map((p) => ({
    id: p.id,
    author_email: p.authorEmail,
    shop_slug: DEMO_SHOP_SLUG,
    place_id: placeId,
    body: p.body,
    media_url: p.media_url,
    media_type: "image",
    poster_url: null,
    post_kind: "business",
    hidden: false,
    created_at: new Date(now - p.hoursAgo * 3600e3).toISOString(),
  }));
  await write("posts", postRows, { upsert: "id" });

  // ── likes + comments ────────────────────────────────────────────────
  const likeRows = [];
  for (const l of DEMO_LIKES) for (const email of l.emails) likeRows.push({ post_id: l.postId, email });
  await write("post_likes", likeRows, { upsert: "post_id,email" });

  const commentRows = DEMO_COMMENTS.map((c) => ({
    id: c.id,
    post_id: c.postId,
    email: c.email,
    body: c.body,
    hidden: false,
  }));
  await write("post_comments", commentRows, { upsert: "id" });

  // ── done ─────────────────────────────────────────────────────────────
  console.log("");
  console.log(APPLY ? "✓ Demo store seeded." : "✓ Dry-run plan above — nothing was written.");
  console.log("");
  console.log("  ── APP STORE CONNECT REVIEW NOTES ────────────────────────────");
  console.log("     Demo merchant login (https://www.ventzon.com/login):");
  console.log(`       email:    ${DEMO_OWNER_EMAIL}`);
  console.log(`       password: ${DEMO_PASSWORD}`);
  console.log("     Demo customer login (customer app, /customer/auth):");
  console.log(`       email:    ${DEMO_CUSTOMERS[0].email} (through demo.customer5@ventzon.app)`);
  console.log(`       password: ${DEMO_PASSWORD}`);
  console.log(`     Demo store: ${DEMO_SHOP_NAME} (${DEMO_SHOP_SLUG})`);
  console.log("  ───────────────────────────────────────────────────────────────");
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("✗", err?.message ?? err);
  process.exit(1);
});
