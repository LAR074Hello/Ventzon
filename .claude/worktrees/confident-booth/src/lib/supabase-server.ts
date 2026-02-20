import { createClient } from "@supabase/supabase-js";

/**
 * Returns a service-role Supabase client for use in API routes.
 * Call once per request — do not share across requests.
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
