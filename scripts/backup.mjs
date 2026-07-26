#!/usr/bin/env node
/**
 * Table backup, and — more importantly — a RESTORE REHEARSAL.
 *
 * The production migration plan calls for dumping shops, posts, checkins and
 * customers before touching anything. An untested backup is not a backup, so
 * this does both halves:
 *
 *   npm run backup            dump to .backups/<ref>-<timestamp>/
 *   npm run backup -- --verify  dump, restore into bak_* tables, compare, drop
 *
 * Supabase does not expose the database password through the management API,
 * so pg_dump is not available here. Reading every row through the service role
 * is the mechanism actually available for production, which is exactly why it
 * is the mechanism being tested.
 *
 * --verify restores into bak_-prefixed tables in the public schema rather than
 * a separate schema: PostgREST only exposes public, so a scratch schema could
 * not be written through the same client the real restore would use. Testing
 * a path we could not actually take would prove nothing.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnv, projectRefFrom, PRODUCTION_PROJECT_REF } from "./dev-guard.mjs";

/**
 * EVERY public table that can hold data, not a hand-picked six.
 *
 * The original list covered shops/shop_settings/customers/checkins/posts/
 * places and missed twelve tables that hold live production rows — including
 * stripe_events, shop_members, reward_events and customer_profiles. That was
 * survivable while PITR was assumed to exist. It is not survivable now that
 * this dump is the ONLY recovery path on the free plan.
 */
const TABLES = [
  "shops", "shop_settings", "customers", "checkins", "places",
  "posts", "post_likes", "post_saves", "post_comments",
  "customer_profiles", "user_follows", "customer_follows",
  "customer_notification_log", "customer_notification_prefs",
  "reward_events", "birthday_reward_sends", "referrals",
  "shop_members", "signups", "stripe_events", "messages", "promotions",
  "rep_profiles", "rep_invites", "rep_commission_logs",
  "job_applications", "scheduled_emails",
  "ad_campaigns", "ad_sends", "shop_occasions", "occasion_sends",
  "community_eligibility", "merchant_community_settings", "loyalty_events",
  "device_tokens", "user_blocks", "reports",
];
const VERIFY = process.argv.includes("--verify");
const PAGE = 1000;

const env = { ...loadEnv(), ...process.env };
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const ref = projectRefFrom(url);
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// Dumping production is legitimate — that is the point. Restoring into it is
// not, so --verify refuses there.
if (VERIFY && ref === PRODUCTION_PROJECT_REF) {
  console.error("REFUSING: --verify writes bak_* tables and must never run against production.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function dumpTable(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE) break;
  }
  return rows;
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dir = path.join(".backups", `${ref}-${stamp}`);
mkdirSync(dir, { recursive: true });

console.log(`\n  dumping ${ref} -> ${dir}`);
const counts = {};
for (const t of TABLES) {
  const rows = await dumpTable(t);
  counts[t] = rows.length;
  writeFileSync(path.join(dir, `${t}.json`), JSON.stringify(rows));
  console.log(`    ${String(rows.length).padStart(6)}  ${t}`);
}
// auth.users is NOT a public table and no SQL dump reaches it. Losing
// accounts is the most painful possible loss, so it is exported separately
// through the admin API.
{
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.users: ${error.message}`);
    users.push(...(data?.users ?? []));
    if ((data?.users ?? []).length < 1000) break;
  }
  counts["auth.users"] = users.length;
  writeFileSync(path.join(dir, "auth_users.json"), JSON.stringify(users));
  console.log(`    ${String(users.length).padStart(6)}  auth.users`);
}

writeFileSync(
  path.join(dir, "manifest.json"),
  JSON.stringify(
    {
      ref,
      at: stamp,
      counts,
      restores: "DATA ONLY (rows). Schema, constraints, indexes, triggers and RLS policies come from supabase/migrations/. Storage objects are NOT included.",
    },
    null,
    2
  )
);

if (!VERIFY) {
  console.log(`\n  dump complete. Run with --verify to prove it restores.\n`);
  process.exit(0);
}

// ── restore rehearsal ───────────────────────────────────────────────
console.log(`\n  restoring into bak_* tables…`);
let failed = 0;
const report = [];

for (const t of TABLES) {
  const rows = JSON.parse(readFileSync(path.join(dir, `${t}.json`), "utf8"));
  const bak = `bak_${t}`;

  // The bak_ tables are created by the caller (see npm run backup:prepare).
  const { error: clearErr } = await db.from(bak).delete().neq("__none__", "__none__");
  if (clearErr && !/does not exist/.test(clearErr.message)) {
    // delete-all needs a predicate; fall back to a always-true one.
    await db.from(bak).delete().gte("__ts__", "1970-01-01").then(() => {}, () => {});
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(bak).insert(rows.slice(i, i + 500));
    if (error) {
      report.push({ t, ok: false, detail: error.message.slice(0, 90) });
      failed++;
      inserted = -1;
      break;
    }
    inserted += Math.min(500, rows.length - i);
  }
  if (inserted < 0) continue;

  const { count } = await db.from(bak).select("*", { count: "exact", head: true });
  const ok = count === rows.length;
  if (!ok) failed++;
  report.push({ t, ok, detail: `dumped ${rows.length} -> restored ${count}` });
}

console.log("");
for (const r of report) console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.t.padEnd(15)} ${r.detail}`);
console.log(`\n${failed === 0 ? "RESTORE VERIFIED" : failed + " TABLE(S) FAILED"}\n`);
process.exit(failed === 0 ? 0 : 1);
