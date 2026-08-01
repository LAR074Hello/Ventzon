#!/usr/bin/env node
/**
 * Proves the app is wired to the DEV database, end to end:
 * boot, read, write, FK cascade, RLS, auth, storage, and the guard
 * correctly refusing when pointed at production.
 *
 *   npm run verify:dev
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import {
  loadEnv,
  assertSafeToSeed,
  PRODUCTION_PROJECT_REF,
  DEV_PROJECT_REF,
  projectRefFrom,
} from "./dev-guard.mjs";
import { runSchemaDiff, formatFindings } from "./schema-diff.mjs";

const env = { ...loadEnv(), ...process.env };
const url = env.SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE = env.BASE_URL ?? "http://localhost:3000";

const results = [];
const ok = (name, pass, detail = "") => results.push({ name, pass, detail });

ok("env targets dev project", projectRefFrom(url) === DEV_PROJECT_REF, projectRefFrom(url) ?? "none");
ok("env does NOT target prod", !String(url).includes(PRODUCTION_PROJECT_REF));

const admin = createClient(url, service, { auth: { persistSession: false } });
const pub = createClient(url, anon, { auth: { persistSession: false } });

// ── read ────────────────────────────────────────────────────────────
{
  const { error, count } = await admin.from("shops").select("*", { count: "exact", head: true });
  ok("service-role READ shops", !error, error ? error.message : `count=${count}`);
}

// ── write, FK, cascade ──────────────────────────────────────────────
{
  const slug = `__verify_${Date.now()}`;
  const ins = await admin.from("shops").insert({ slug }).select().single();
  ok("service-role WRITE shops", !ins.error, ins.error?.message ?? "inserted");

  if (!ins.error) {
    const st = await admin
      .from("shop_settings")
      .insert({ shop_slug: slug, shop_name: "Verify Co", reward_goal: 5 })
      .select()
      .single();
    ok("FK write shop_settings -> shops", !st.error, st.error?.message ?? "ok");

    const del = await admin.from("shops").delete().eq("slug", slug);
    ok("delete shop", !del.error, del.error?.message ?? "removed");

    const gone = await admin.from("shop_settings").select("shop_slug").eq("shop_slug", slug);
    ok("ON DELETE CASCADE removed settings", (gone.data ?? []).length === 0);
  }
}

// ── RLS ─────────────────────────────────────────────────────────────
{
  const { data, error } = await pub.from("customers").select("id").limit(1);
  ok("anon blocked from customers (RLS)", error !== null || (data ?? []).length === 0,
     error ? "error" : "0 rows");
}

// ── auth ────────────────────────────────────────────────────────────
{
  const email = `verify_${Date.now()}@ventzon.test`;
  const password = "Passw0rd!verify";
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  ok("auth: create user", !created.error, created.error?.message ?? "created");
  if (!created.error) {
    const signIn = await pub.auth.signInWithPassword({ email, password });
    ok("auth: sign in returns session", !!signIn.data?.session, signIn.error?.message ?? "session");
    await admin.auth.admin.deleteUser(created.data.user.id);
    ok("auth: cleanup", true);
  }
}

// ── storage ─────────────────────────────────────────────────────────
{
  const { data, error } = await admin.storage.listBuckets();
  const names = (data ?? []).map((b) => b.id);
  ok("storage bucket 'posts' exists", !error && names.includes("posts"), names.join(",") || "none");
}

// ── the guard ───────────────────────────────────────────────────────
{
  let refusedProd = false;
  try {
    assertSafeToSeed("verify", {
      SUPABASE_URL: `https://${PRODUCTION_PROJECT_REF}.supabase.co`,
      DEV_SEED: "true",
      SUPABASE_SERVICE_ROLE_KEY: "x",
    });
  } catch (e) {
    refusedProd = /PRODUCTION/.test(e.message);
  }
  ok("guard REFUSES production ref", refusedProd);

  let refusedNoFlag = false;
  try {
    assertSafeToSeed("verify", {
      SUPABASE_URL: `https://${DEV_PROJECT_REF}.supabase.co`,
      SUPABASE_SERVICE_ROLE_KEY: "x",
    });
  } catch (e) {
    refusedNoFlag = /DEV_SEED/.test(e.message);
  }
  ok("guard REFUSES without DEV_SEED=true", refusedNoFlag);

  let allowsDev = false;
  try {
    assertSafeToSeed("verify", {
      SUPABASE_URL: `https://${DEV_PROJECT_REF}.supabase.co`,
      DEV_SEED: "true",
      SUPABASE_SERVICE_ROLE_KEY: "x",
    });
    allowsDev = true;
  } catch {}
  ok("guard ALLOWS dev + DEV_SEED", allowsDev);
}

// ── banned authors must never outlive the ban ───────────────────────
// `ban` ships with the report queue, in beta scope. If it lands without the
// share-page filter being wired, a moderator bans someone and their content
// stays publicly reachable by share link — looking removed while it is not.
// This check fails the moment a ban column exists and the filter is still off.
{
  const { data: probe } = await admin
    .from("customer_profiles")
    .select("*")
    .limit(1);
  const columns = probe && probe.length ? Object.keys(probe[0]) : [];
  const banColumn = columns.find((c) => /^(banned|banned_at|is_banned|ban_reason)$/.test(c));

  const src = readFileSync("src/lib/public-visibility.ts", "utf8");
  const wired = !/export const BANNED_COLUMN: string \| null = null;/.test(src);

  if (!banColumn) {
    ok("ban filter not yet required (no ban column)", true, "safety slice");
  } else {
    ok(
      `ban column "${banColumn}" is filtered on share pages`,
      wired,
      wired ? "wired" : `SET BANNED_COLUMN in src/lib/public-visibility.ts`
    );
  }
}

// ── the running app ─────────────────────────────────────────────────
{
  try {
    const r = await fetch(`${BASE}/api/customer/shops-map`);
    ok("app route responds (shops-map)", r.ok, `HTTP ${r.status}`);
  } catch (e) {
    ok("app route responds (shops-map)", false, "dev server not running");
  }
}

// ── production schema drift ─────────────────────────────────────────
// Twice production has been missing indexes its own migrations create, and
// both times it was found by accident. This is the check that would have
// caught either one on the day it happened.
//
// It SKIPS rather than passes when production credentials are absent, which
// they are by default and on purpose. A skip is reported as its own state —
// never folded into "ALL PASS", because a check that reports success without
// running is worse than not having it.
let schemaDiff;
{
  schemaDiff = await runSchemaDiff();
  if (schemaDiff.status === "match") ok("production schema matches dev", true, schemaDiff.message);
  else if (schemaDiff.status === "drift") ok("production schema matches dev", false, schemaDiff.message);
  else if (schemaDiff.status === "error") ok("production schema matches dev", false, schemaDiff.message);
}

let failed = 0;
console.log("");
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  — " + r.detail : ""}`);
}

if (schemaDiff.status === "drift") {
  console.log(formatFindings(schemaDiff.findings));
}

// A skipped check must never be readable as coverage. It is not a quiet SKIP
// line under a green summary — the run is NOT CLEAN and exits non-zero, so
// nothing downstream can treat "verify:dev passed" as "production matches".
// Opting out is possible, but only by saying so out loud:
//   SCHEMA_DIFF_OPTIONAL=true npm run verify:dev
const skipTolerated = String(env.SCHEMA_DIFF_OPTIONAL ?? "") === "true";

if (schemaDiff.status === "skipped" && !skipTolerated) {
  console.log(`\n${failed === 0 ? `${results.length} checks passed` : failed + " FAILED"}`);
  console.log("\n  ✗ NOT CLEAN — the production schema check DID NOT RUN.");
  console.log("    " + schemaDiff.message.split("\n").join("\n    "));
  console.log("\n    Twice production has drifted from its own migrations and both");
  console.log("    times it was found by accident. A check that silently does nothing");
  console.log("    looks like coverage and is worse than no check, so this exits 1.");
  console.log("    Deliberately skipping: SCHEMA_DIFF_OPTIONAL=true npm run verify:dev\n");
  process.exit(1);
}

if (schemaDiff.status === "skipped") {
  console.log(`  SKIP  production schema diff — explicitly opted out via SCHEMA_DIFF_OPTIONAL`);
}

console.log(`\n${failed === 0 ? "ALL PASS" : failed + " FAILED"}`);
process.exit(failed === 0 ? 0 : 1);
