#!/usr/bin/env node
/**
 * Dry-run impact analysis for the fake-location removal migration
 * (supabase/migrations/20260820_remove_fake_places.sql).
 *
 * READ-ONLY. Reports exactly what the migration WILL delete/convert so it
 * can be reviewed before anything destructive runs.
 *
 * Usage (against the target database):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/dry-run-fake-places.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const PAGE = 1000;

async function allRows(from, cols) {
  const rows = [];
  for (let start = 0; ; start += PAGE) {
    const { data, error } = await db
      .from(from)
      .select(cols)
      .range(start, start + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function countWhere(from, filter) {
  const { count, error } = await db
    .from(from)
    .select("id", { count: "exact", head: true })
    .match(filter);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function main() {
  const osmCount = await countWhere("places", { source: "osm" });
  const seedCount = await countWhere("places", { source: "seed" });
  const merchantCount = await countWhere("places", { source: "merchant" });

  // Fake place ids — used to intersect with check-ins and posts.
  const allPlaces = await allRows("places", "id, source");
  const fakeIds = new Set(
    allPlaces.filter((p) => p.source === "osm" || p.source === "seed").map((p) => p.id)
  );

  // Place-lane check-ins (customer_id NULL) pointing at a fake place.
  const allCheckins = await allRows("checkins", "place_id");
  const removedCheckins = allCheckins.filter(
    (c) => c.place_id && fakeIds.has(c.place_id)
  ).length;

  // Posts whose only anchor is a fake place (will become community posts).
  const allPosts = await allRows("posts", "place_id, shop_slug");
  const convertedPosts = allPosts.filter(
    (p) => p.place_id && !p.shop_slug && fakeIds.has(p.place_id)
  ).length;

  console.log("-- Fake-location removal - dry-run impact -------------");
  console.log("Places to DELETE (source=osm)      " + osmCount);
  console.log("Places to DELETE (source=seed)     " + seedCount);
  console.log("Places to PRESERVE (merchant)      " + merchantCount);
  console.log("Place-lane check-ins to REMOVE     " + removedCheckins);
  console.log("Posts to CONVERT to community      " + convertedPosts);
  console.log("(No other tables reference places; the posts/checkins FKs are");
  console.log(" ON DELETE SET NULL and are accounted for above.)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
