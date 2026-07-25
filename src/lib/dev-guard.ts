/**
 * Refuses to let destructive development tooling touch production.
 *
 * Until 2026-07-25 there was one Supabase project and `.env.local` pointed at
 * it, so every local run — including anything that wrote — was operating on
 * live merchant and customer data. A dev project now exists; this guard is
 * what stops the two being confused again.
 *
 * The production ref is hardcoded rather than read from the environment on
 * purpose: a guard that trusts the same env var it is guarding is not a guard.
 */
export const PRODUCTION_PROJECT_REF = "pxdnwpqnmuzpdtjvbawa";
export const DEV_PROJECT_REF = "ziowgeluoertdxslehbl";

function supabaseUrl(): string {
  return (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  );
}

/** The project ref the current environment is pointed at, or null. */
export function currentProjectRef(): string | null {
  const m = /https:\/\/([a-z0-9]+)\.supabase\.co/i.exec(supabaseUrl());
  return m ? m[1] : null;
}

export function isProduction(): boolean {
  return currentProjectRef() === PRODUCTION_PROJECT_REF;
}

/**
 * Call at the top of anything that writes or deletes bulk data.
 * Throws unless DEV_SEED=true AND the target is not production.
 */
export function assertSafeToSeed(action: string): void {
  const ref = currentProjectRef();

  if (isProduction()) {
    throw new Error(
      `REFUSING: "${action}" targets the PRODUCTION project (${PRODUCTION_PROJECT_REF}).\n` +
        `That database holds real merchants, customers and check-ins.\n` +
        `Point SUPABASE_URL at the dev project (${DEV_PROJECT_REF}) first.`
    );
  }

  if (process.env.DEV_SEED !== "true") {
    throw new Error(
      `REFUSING: "${action}" requires DEV_SEED=true.\n` +
        `This is a second, deliberate opt-in on top of the project check.`
    );
  }

  if (!ref) {
    throw new Error(
      `REFUSING: "${action}" could not determine the Supabase project from ` +
        `SUPABASE_URL. Refusing to guess.`
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      `REFUSING: "${action}" needs SUPABASE_SERVICE_ROLE_KEY.\n` +
        `Supabase does not expose it through the management API — copy it from\n` +
        `Dashboard > Ventzon Dev > Project Settings > API keys > service_role.`
    );
  }
}
