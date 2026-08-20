#!/usr/bin/env node
/**
 * Backfill customer referral codes for existing profiles.
 *
 * WHY THIS EXISTS. The 20260820_referral_codes migration adds
 * customer_profiles.referral_code as NULL; codes are assigned with the SAME
 * collision-safe generator the app uses for new users (src/lib/referral.ts),
 * so existing and new users get identical codes. Pure SQL hashing was
 * deliberately rejected — assignment must be collision-checked the way the
 * API does it.
 *
 * EXECUTION (production):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-referral-codes.mjs --apply
 *
 * Dry-run by default: prints how many profiles need a code. With --apply,
 * assigns codes to every profile that has none. Idempotent: only touches
 * rows with referral_code IS NULL, and never clobbers a concurrent
 * assignment. Unique violations (23505) are retried with a fresh code.
 *
 * MUST stay in lockstep with src/lib/referral.ts — the alphabet and length
 * are the code-format contract.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const APPLY = process.argv.includes("--apply");

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const LENGTH = 8;

function generateCode() {
  const bytes = randomBytes(LENGTH);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: missing, error } = await db
    .from("customer_profiles")
    .select("email")
    .is("referral_code", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  console.log(`${missing?.length ?? 0} profile(s) need a referral code.`);
  if (!APPLY) {
    console.log("Dry run — re-run with --apply to assign codes.");
    return;
  }

  let assigned = 0;
  for (const row of missing ?? []) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { data: updated, error: upErr } = await db
        .from("customer_profiles")
        .update({ referral_code: code })
        .eq("email", row.email)
        .is("referral_code", null)
        .select("email")
        .maybeSingle();
      if (updated) { assigned++; break; }
      if (upErr && upErr.code !== "23505") throw new Error(upErr.message);
    }
  }
  console.log(`Assigned codes to ${assigned} profile(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
