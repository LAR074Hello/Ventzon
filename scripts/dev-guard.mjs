/**
 * Refuses to let development tooling touch production.
 *
 * Until 2026-07-25 there was one Supabase project and `.env.local` pointed at
 * it, so every local run — including writes — operated on live merchant and
 * customer data. A dev project now exists; this is what stops the two being
 * confused again.
 *
 * Lives in scripts/ as .mjs rather than src/lib as .ts on purpose: the only
 * callers are Node scripts (seed, reset), and Node cannot import TypeScript.
 * One guard with one home beats a guard the callers cannot reach.
 *
 * The production ref is hardcoded rather than read from the environment: a
 * guard that trusts the same variable it is guarding is not a guard.
 */
import { readFileSync } from "node:fs";

export const PRODUCTION_PROJECT_REF = "pxdnwpqnmuzpdtjvbawa";
export const DEV_PROJECT_REF = "ziowgeluoertdxslehbl";

/** Minimal .env.local reader — avoids depending on Next's loader. */
export function loadEnv(path = ".env.local") {
  const env = {};
  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return env;
  }
  for (const line of raw.split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) env[m[1]] = m[2];
  }
  return env;
}

export function projectRefFrom(url) {
  const m = /https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(url ?? "");
  return m ? m[1] : null;
}

/**
 * Throws unless it is safe to write bulk data.
 * Returns { url, serviceKey, ref } when safe.
 */
export function assertSafeToSeed(action, envOverride) {
  const env = envOverride ?? { ...loadEnv(), ...process.env };
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const ref = projectRefFrom(url);

  if (ref === PRODUCTION_PROJECT_REF) {
    throw new Error(
      `REFUSING: "${action}" targets the PRODUCTION project (${PRODUCTION_PROJECT_REF}).\n` +
        `That database holds real merchants, customers and check-ins.\n` +
        `Point SUPABASE_URL at the dev project (${DEV_PROJECT_REF}) first.`
    );
  }
  if (!ref) {
    throw new Error(
      `REFUSING: "${action}" could not determine the Supabase project from SUPABASE_URL. Refusing to guess.`
    );
  }
  if (env.DEV_SEED !== "true") {
    throw new Error(
      `REFUSING: "${action}" requires DEV_SEED=true — a second, deliberate opt-in on top of the project check.`
    );
  }
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      `REFUSING: "${action}" needs SUPABASE_SERVICE_ROLE_KEY.\n` +
        `Copy it from Dashboard > Ventzon Dev > Project Settings > API keys > service_role.`
    );
  }
  return { url, serviceKey, ref };
}
