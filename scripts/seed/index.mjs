#!/usr/bin/env node
/**
 * Demo-city seed — INSERT LAYER.
 *
 * Everything database-shaped lives here; the content lives in content.mjs and
 * knows nothing about tables. Slice 1.3 makes places first-class and will
 * rewrite this file wholesale — content.mjs should survive untouched.
 *
 * Maps onto the CURRENT schema only:
 *   place      -> shops + shop_settings
 *   person     -> customer_profiles (+ auth user)
 *   membership -> customers (per shop) + checkins
 *   reward     -> reward_events
 *   post       -> posts (+ post_likes, post_comments)
 *   follow     -> user_follows, customer_follows
 *   notice     -> customer_notification_log
 *   flag       -> reports (+ posts.hidden)
 *
 * Since Slice 1.3, `places` is first-class and this seed owns it. posts and
 * checkins carry BOTH shop_slug and place_id (expand-contract), written from
 * one slug->id map so the two can never diverge here either.
 * `verification_tier` is seeded but the claim FLOW is Slice 1.5.
 *
 *   npm run dev:seed     seed on top of whatever is there
 *   npm run dev:reset    wipe seeded rows, then seed
 */
import { createClient } from "@supabase/supabase-js";
import { assertSafeToSeed } from "../dev-guard.mjs";
import { buildCity, IMPORTED_PLACES, UNCLAIMED_SLUGS } from "./content.mjs";

const RESET = process.argv.includes("--reset");

// Refuses production, refuses without DEV_SEED=true, refuses without a key.
const { url, serviceKey, ref } = assertSafeToSeed(RESET ? "dev:reset" : "dev:seed");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const SEED_PASSWORD = "ventzon-dev-password";
const log = (...a) => console.log("  ", ...a);

/** Everything the seed creates is identifiable, so reset is surgical. */
const SEED_EMAIL_DOMAIN = "@ventzon.test";

async function chunked(rows, fn, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const { error } = await fn(rows.slice(i, i + size));
    if (error) throw new Error(error.message);
  }
}

async function reset() {
  log("wiping seeded rows…");
  const city = buildCity();
  const slugs = city.places.map((p) => p.slug);
  const emails = city.people.map((p) => p.email);

  // Children first where cascade does not cover us.
  await db.from("reports").delete().like("reporter_email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("post_comments").delete().like("email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("post_likes").delete().like("email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("posts").delete().like("author_email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("user_follows").delete().like("follower_email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("customer_follows").delete().like("email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("customer_notification_log").delete().like("email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("customer_profiles").delete().like("email", `%${SEED_EMAIL_DOMAIN}`);
  await db.from("reward_events").delete().in("shop_slug", slugs);
  // checkins and customers cascade from shops; shop_settings too.
  await db.from("shops").delete().in("slug", slugs);
  // places do NOT cascade from shops (claimed_by is ON DELETE SET NULL), so
  // they are removed explicitly — otherwise dev:reset leaves orphans and the
  // reviewed database stops matching the one the seed produces.
  await db.from("places").delete().in("slug", slugs);
  await db.from("places").delete().in("slug", IMPORTED_PLACES.map((p) => p.slug));

  // Auth users
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith(SEED_EMAIL_DOMAIN)) await db.auth.admin.deleteUser(u.id);
  }
  log(`wiped ${slugs.length} places, ${emails.length} people and their rows`);
}

async function seed() {
  const city = buildCity();
  const t0 = Date.now();

  // ── places ────────────────────────────────────────────────────────
  await chunked(
    city.places.map((p) => ({
      slug: p.slug,
      address: p.address,
      latitude: p.lat,
      longitude: p.lng,
      // Stand-ins for verification_tier until Slice 1.5.
      is_paid: p.subscribed,
      plan_type: p.subscribed ? "pro" : "free",
      subscription_status: p.subscribed ? "active" : "inactive",
    })),
    (rows) => db.from("shops").insert(rows)
  );
  await chunked(
    city.places.map((p) => ({
      shop_slug: p.slug,
      shop_name: p.name,
      deal_title: p.rewardTitle,
      deal_details: `${p.rewardGoal} visits, ${p.rewardTitle.toLowerCase()}`,
      reward_goal: p.rewardGoal,
      visits_required: Math.min(Math.max(p.rewardGoal, 2), 31),
      reward_mode: p.rewardMode,
      points_per_visit: p.pointsPerVisit,
    })),
    (rows) => db.from("shop_settings").insert(rows)
  );
  // ── places (Slice 1.3) ────────────────────────────────────────────
  // The seed owns places now. Without this, dev:reset produces a database
  // with shops but no places, which is not what the app reads.
  await chunked(
    city.places.map((p) => ({
      slug: p.slug,
      name: p.name,
      address: p.address,
      latitude: p.lat,
      longitude: p.lng,
      neighborhood: p.neighbourhood,
      city: city.city.name,
      category: p.category,
      // One seeded place is left unclaimed on purpose: a shop can exist
      // without anyone having claimed the place it sits at.
      verification_tier: UNCLAIMED_SLUGS.has(p.slug)
        ? "unclaimed"
        : p.subscribed
        ? "subscribed"
        : "claimed",
      source: "seed",
    })),
    (rows) => db.from("places").insert(rows)
  );

  // Imported-place fixtures: unclaimed, no posts, OSM provenance. These are
  // what the "be the first" invitation exists for.
  await chunked(
    IMPORTED_PLACES.map((p) => ({
      slug: p.slug,
      name: p.name,
      address: p.address,
      latitude: p.lat,
      longitude: p.lng,
      neighborhood: p.neighborhood,
      city: p.city,
      category: p.category,
      verification_tier: "unclaimed",
      source: "osm",
      osm_updated_at: new Date("2026-03-14T00:00:00Z").toISOString(),
    })),
    (rows) => db.from("places").insert(rows)
  );

  // Link claimed places back to their shop account.
  const { data: shopRows } = await db.from("shops").select("id, slug").in("slug", city.places.map((p) => p.slug));
  for (const shop of shopRows ?? []) {
    if (UNCLAIMED_SLUGS.has(shop.slug)) continue;
    await db.from("places").update({ claimed_by: shop.id, claimed_at: new Date().toISOString() }).eq("slug", shop.slug);
  }

  // One map, used for every place_id written below. Expand-contract means
  // shop_slug and place_id must always agree; deriving both from here is how
  // that is guaranteed rather than remembered.
  const { data: placeRows } = await db
    .from("places")
    .select("id, slug")
    .in("slug", [...city.places.map((p) => p.slug), ...IMPORTED_PLACES.map((p) => p.slug)]);
  const placeIdBySlug = new Map((placeRows ?? []).map((p) => [p.slug, p.id]));

  log(`places        ${city.places.length} seeded + ${IMPORTED_PLACES.length} imported (${UNCLAIMED_SLUGS.size} unclaimed)`);

  // ── people ────────────────────────────────────────────────────────
  for (const person of city.people) {
    await db.auth.admin.createUser({
      email: person.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: person.name },
    });
  }
  await chunked(
    city.people.map((p) => ({
      email: p.email,
      display_name: p.name,
      bio: p.bio,
      is_creator: p.creator,
      show_on_leaderboard: true,
    })),
    (rows) => db.from("customer_profiles").insert(rows)
  );
  log(`people        ${city.people.length} (all password: ${SEED_PASSWORD})`);

  // ── memberships, check-ins, rewards ───────────────────────────────
  const customerRows = city.memberships.map((m) => ({
    shop_slug: m.placeSlug,
    email: m.email,
    visits: m.visits,
    reward_unlocked: m.rewardReady,
    reward_unlocked_at: m.rewardReady ? new Date().toISOString() : null,
  }));
  await chunked(customerRows, (rows) => db.from("customers").insert(rows));

  const { data: customers } = await db
    .from("customers")
    .select("id, shop_slug, email")
    .in("shop_slug", city.places.map((p) => p.slug));
  const custId = new Map((customers ?? []).map((c) => [`${c.email}|${c.shop_slug}`, c.id]));

  const checkinRows = [];
  for (const m of city.memberships) {
    const id = custId.get(`${m.email}|${m.placeSlug}`);
    if (!id) continue;
    for (const day of m.checkinDays) {
      const d = new Date(Date.now() - day * 86400e3);
      checkinRows.push({
        shop_slug: m.placeSlug,
        place_id: placeIdBySlug.get(m.placeSlug) ?? null,
        customer_id: id,
        // The unique index is on (customer_id, checkin_date), so one per day.
        checkin_date: d.toISOString().slice(0, 10),
        created_at: d.toISOString(),
      });
    }
  }
  await chunked(checkinRows, (rows) => db.from("checkins").insert(rows));
  log(`memberships   ${customerRows.length}   check-ins ${checkinRows.length}`);

  const rewardRows = city.memberships
    .filter((m) => m.rewardReady)
    .map((m) => ({
      shop_slug: m.placeSlug,
      customer_id: custId.get(`${m.email}|${m.placeSlug}`),
      is_redeemed: false,
    }))
    .filter((r) => r.customer_id);
  await chunked(rewardRows, (rows) => db.from("reward_events").insert(rows));
  log(`rewards ready ${rewardRows.length}`);

  // ── posts, likes, comments ────────────────────────────────────────
  const postRows = city.posts.map((p) => ({
    author_email: p.authorEmail,
    shop_slug: p.placeSlug,
    place_id: placeIdBySlug.get(p.placeSlug) ?? null,
    body: p.body,
    media_url: p.mediaUrl,
    media_type: p.mediaType,
    post_kind: "business",
    hidden: p.hidden,
    created_at: p.createdAt.toISOString(),
  }));
  // Capture the ids from the insert itself rather than re-querying and
  // matching on created_at: Postgres returns timestamps in a different
  // string form than the ISO value we sent, so the join silently found
  // nothing and likes, comments and reports all came back empty.
  const postIds = [];
  for (let i = 0; i < postRows.length; i += 500) {
    const { data, error } = await db
      .from("posts")
      .insert(postRows.slice(i, i + 500))
      .select("id");
    if (error) throw new Error(error.message);
    for (const r of data ?? []) postIds.push(r.id);
  }
  if (postIds.length !== postRows.length) {
    throw new Error(`post id mismatch: inserted ${postRows.length}, got ${postIds.length}`);
  }
  const idFor = (index) => postIds[index];

  const likeRows = [];
  const commentRows = [];
  const emails = city.people.map((p) => p.email);
  city.posts.forEach((p, index) => {
    const id = idFor(index);
    // post_likes is unique on (post_id, email), so likers are distinct
    // people — the displayed count is capped by the size of the city.
    const likerCount = Math.min(p.likes, emails.length);
    for (let i = 0; i < likerCount; i++) likeRows.push({ post_id: id, email: emails[i] });
    p.commentBodies.forEach((body, k) => {
      commentRows.push({ post_id: id, email: emails[(index + k) % emails.length], body });
    });
  });
  await chunked(likeRows, (rows) => db.from("post_likes").insert(rows));
  await chunked(commentRows, (rows) => db.from("post_comments").insert(rows));
  log(`posts         ${postRows.length}   likes ${likeRows.length}   comments ${commentRows.length}`);

  // ── follows ───────────────────────────────────────────────────────
  await chunked(
    city.userFollows.map((f) => ({ follower_email: f.follower, followee_email: f.followee })),
    (rows) => db.from("user_follows").insert(rows)
  );
  await chunked(
    city.placeFollows.map((f) => ({ email: f.email, shop_slug: f.placeSlug })),
    (rows) => db.from("customer_follows").insert(rows)
  );
  log(`follows       ${city.userFollows.length} people, ${city.placeFollows.length} places`);

  // ── notifications ─────────────────────────────────────────────────
  await chunked(
    city.notifications.map((n) => ({
      email: n.email,
      type: n.type,
      shop_slug: n.placeSlug,
      ref_id: n.refId,
      sent_at: n.sentAt.toISOString(),
      read_at: n.read ? n.sentAt.toISOString() : null,
    })),
    (rows) => db.from("customer_notification_log").insert(rows)
  );
  log(`notifications ${city.notifications.length}`);

  // ── reports ───────────────────────────────────────────────────────
  const reportRows = [];
  city.posts.forEach((p, index) => {
    if (!p.flagged) return;
    reportRows.push({
      reporter_email: emails[0],
      target_type: "post",
      target_id: idFor(index),
      reason: p.flagReason,
      status: "open",
    });
  });
  await chunked(reportRows, (rows) => db.from("reports").insert(rows));
  log(`reports       ${reportRows.length} (1 hidden pending review)`);

  console.log(`\n  seeded ${ref} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`  sign in as any of: ${city.people.slice(0, 3).map((p) => p.email).join(", ")}`);
  console.log(`  password: ${SEED_PASSWORD}`);
}

try {
  if (RESET) await reset();
  await seed();
} catch (e) {
  console.error("\nSEED FAILED:", e.message);
  process.exit(1);
}
