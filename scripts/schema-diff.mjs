#!/usr/bin/env node
/**
 * Does production's live schema still match dev's?
 *
 * Twice production has been found missing indexes its own migrations create —
 * `job_applications_role_idx` / `job_applications_submitted_at_idx`
 * (2026-07-25) and `idx_checkins_shop_slug` / `idx_checkins_customer_id`
 * (2026-08-01). Both times it surfaced while looking for something else.
 * Migration files describe an *intended* database; until this existed, nothing
 * compared that intention to the database people actually use.
 *
 * READ ONLY. It calls `public.schema_snapshot()` on both projects and compares
 * the results. It issues no DDL, writes no rows, and cannot: the function takes
 * no arguments and returns schema shape, never data.
 *
 *   node scripts/schema-diff.mjs          # run standalone
 *   npm run verify:dev                    # runs this as its last check
 *
 * PRODUCTION CREDENTIALS ARE NOT IN .env.local, DELIBERATELY — the file says
 * so in as many words, and that guard is why `npm run backup` cannot silently
 * dump the wrong database. So this check cannot run unless they are supplied
 * for the run:
 *
 *   PROD_SUPABASE_URL=https://<ref>.supabase.co \
 *   PROD_SUPABASE_SERVICE_ROLE_KEY=<production service_role> \
 *   node scripts/schema-diff.mjs
 *
 * Without them it SKIPS — loudly, printing the command — rather than passing.
 * A check that reports success when it did not run is worse than no check.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, projectRefFrom, PRODUCTION_PROJECT_REF, DEV_PROJECT_REF } from "./dev-guard.mjs";

const SECTIONS = ["columns", "constraints", "indexes", "policies", "rls", "functions", "triggers"];

/** Rows that exist in both databases but describe the checker itself. */
const IGNORED_KEYS = new Set(["schema_snapshot()"]);

export async function fetchSnapshot(url, key, label) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("schema_snapshot");
  if (error) {
    throw new Error(
      `${label}: could not read schema_snapshot() — ${error.message}\n` +
        `  If the function is missing, apply supabase/migrations/20260801_schema_snapshot_fn.sql there.`
    );
  }
  return data;
}

/** Index a section's rows by their stable key. */
function byKey(rows) {
  const m = new Map();
  for (const r of rows ?? []) {
    if (IGNORED_KEYS.has(r.k)) continue;
    const { k, ...rest } = r;
    m.set(k, rest);
  }
  return m;
}

function describe(v) {
  return Object.entries(v)
    .map(([k, val]) => `${k}=${val}`)
    .join("  ");
}

/**
 * Compare two snapshots. Direction matters in the reporting: dev is where
 * migrations are proven, so something present in dev and absent in production
 * is a migration production never received — the failure mode actually seen
 * twice. The reverse (in production, not in dev) is drift the other way, which
 * usually means something was applied by hand and never written down.
 */
export function diffSnapshots(devSnap, prodSnap) {
  const findings = [];
  for (const section of SECTIONS) {
    const dev = byKey(devSnap?.[section]);
    const prod = byKey(prodSnap?.[section]);

    for (const [k, v] of dev) {
      if (!prod.has(k)) findings.push({ section, key: k, kind: "missing-in-prod", detail: describe(v) });
    }
    for (const [k, v] of prod) {
      if (!dev.has(k)) findings.push({ section, key: k, kind: "missing-in-dev", detail: describe(v) });
    }
    for (const [k, v] of dev) {
      const p = prod.get(k);
      if (!p) continue;
      for (const field of Object.keys(v)) {
        if (String(v[field]) !== String(p[field])) {
          findings.push({
            section,
            key: k,
            kind: "differs",
            detail: `${field}: dev=${JSON.stringify(v[field])} prod=${JSON.stringify(p[field])}`,
          });
        }
      }
    }
  }
  return findings;
}

const LABEL = {
  "missing-in-prod": "in dev, NOT in production",
  "missing-in-dev": "in production, NOT in dev",
  differs: "differs",
};

export function formatFindings(findings) {
  const out = [];
  const bySection = new Map();
  for (const f of findings) {
    if (!bySection.has(f.section)) bySection.set(f.section, []);
    bySection.get(f.section).push(f);
  }
  for (const [section, items] of bySection) {
    out.push(`\n  ${section.toUpperCase()}`);
    for (const f of items) {
      out.push(`    ${LABEL[f.kind]}  ${f.key}`);
      if (f.detail) out.push(`        ${f.detail}`);
    }
  }
  return out.join("\n");
}

/**
 * Returns { status, findings, message }.
 * status: "match" | "drift" | "skipped" | "error"
 */
export async function runSchemaDiff() {
  const env = { ...loadEnv(), ...process.env };

  const devUrl = env.SUPABASE_URL;
  const devKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const prodUrl = env.PROD_SUPABASE_URL;
  const prodKey = env.PROD_SUPABASE_SERVICE_ROLE_KEY;

  if (!prodUrl || !prodKey) {
    return {
      status: "skipped",
      findings: [],
      message:
        "production credentials not supplied — this check did NOT run.\n" +
        "        PROD_SUPABASE_URL=https://" +
        PRODUCTION_PROJECT_REF +
        ".supabase.co \\\n" +
        "        PROD_SUPABASE_SERVICE_ROLE_KEY=<production service_role> \\\n" +
        "        npm run verify:dev",
    };
  }

  if (projectRefFrom(devUrl) !== DEV_PROJECT_REF) {
    return { status: "error", findings: [], message: `SUPABASE_URL is not the dev project (${projectRefFrom(devUrl) ?? "unknown"})` };
  }
  if (projectRefFrom(prodUrl) !== PRODUCTION_PROJECT_REF) {
    return { status: "error", findings: [], message: `PROD_SUPABASE_URL is not the production project (${projectRefFrom(prodUrl) ?? "unknown"})` };
  }

  let devSnap, prodSnap;
  try {
    [devSnap, prodSnap] = await Promise.all([
      fetchSnapshot(devUrl, devKey, "dev"),
      fetchSnapshot(prodUrl, prodKey, "production"),
    ]);
  } catch (e) {
    return { status: "error", findings: [], message: e.message };
  }

  const findings = diffSnapshots(devSnap, prodSnap);
  const counts = SECTIONS.map((s) => `${s}:${(devSnap?.[s] ?? []).length}`).join(" ");
  return {
    status: findings.length === 0 ? "match" : "drift",
    findings,
    message: findings.length === 0 ? `dev and production agree (${counts})` : `${findings.length} difference(s)`,
  };
}

// Standalone entry point.
if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runSchemaDiff();
  if (r.status === "skipped") {
    console.log(`\n  SKIP  schema diff — ${r.message}\n`);
    process.exit(0);
  }
  if (r.status === "error") {
    console.error(`\n  ERROR schema diff — ${r.message}\n`);
    process.exit(1);
  }
  if (r.status === "match") {
    console.log(`\n  PASS  schema diff — ${r.message}\n`);
    process.exit(0);
  }
  console.error(`\n  FAIL  schema diff — ${r.message}`);
  console.error(formatFindings(r.findings));
  console.error("");
  process.exit(1);
}
