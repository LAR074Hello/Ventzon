import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Customer referral codes — one code per account, assigned server-side,
 * safe to display publicly, unique and collision-resistant.
 *
 * FORMAT CONTRACT: an 8-character code from the alphabet below (no
 * I/L/O/U/0/1, so codes are typable and unambiguous). This is a contract
 * between src/lib/referral.ts and scripts/backfill-referral-codes.mjs —
 * they MUST stay in lockstep, because the backfill assigns codes to
 * existing users and this file assigns them to new users.
 */

const REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;

/** Collision-safe random referral code. 256 is a multiple of 32, so the
 *  modulo has no bias; 8 chars = 40 bits. Callers retry on a unique
 *  violation, which makes a collision impossible in practice. */
export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(REFERRAL_CODE_LENGTH);
  let code = "";
  for (const b of bytes) code += REFERRAL_ALPHABET[b % REFERRAL_ALPHABET.length];
  return code;
}

/**
 * Guarantee the user has a referral code, generating one when missing.
 *
 * Idempotent and race-safe: the update only lands on rows whose code is
 * still NULL, so a concurrent assignment is never clobbered. A unique
 * violation on the generated code itself (23505) is retried with a fresh
 * one, bounded.
 */
export async function ensureReferralCode(admin: SupabaseClient, email: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: me } = await admin
      .from("customer_profiles")
      .select("referral_code")
      .eq("email", email)
      .maybeSingle();
    if (me?.referral_code) return me.referral_code;

    const code = generateReferralCode();
    const { data: updated, error } = await admin
      .from("customer_profiles")
      .update({ referral_code: code })
      .eq("email", email)
      .is("referral_code", null)
      .select("referral_code")
      .maybeSingle();
    if (updated?.referral_code) return updated.referral_code;
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("Could not assign a unique referral code");
}

/**
 * Referral attribution outcome. pending_onboarding means the referred
 * account exists but has not completed the required onboarding (the
 * 13+ age gate) yet — the client keeps the code and retries later.
 */
export type ReferralOutcome =
  | { status: "attributed" }
  | { status: "already_attributed" }
  | { status: "pending_onboarding" }
  | { status: "self_referral" }
  | { status: "invalid_code" };

/**
 * Attribute the signed-in user to a referrer, server-side and idempotent.
 *
 * The client only ever supplies a CODE; the referrer is resolved here, so
 * a client-supplied referrer id can never be trusted or forged.
 *
 * Onboarding gate: the referred account must have completed the required
 * onboarding. In this app that is the 13+ age gate — customer_profiles.dob
 * present, and no recorded under-13 refusal (blocked wins over a stored
 * dob). A referral is never credited for a mere account creation.
 */
export async function attributeReferral(
  admin: SupabaseClient,
  referredEmail: string,
  rawCode: string
): Promise<ReferralOutcome> {
  const code = String(rawCode ?? "").trim().toUpperCase();
  if (!code) return { status: "invalid_code" };

  const { data: referrer } = await admin
    .from("customer_profiles")
    .select("email")
    .eq("referral_code", code)
    .maybeSingle();
  if (!referrer?.email) return { status: "invalid_code" };
  if (referrer.email === referredEmail) return { status: "self_referral" };

  const { data: referred } = await admin
    .from("customer_profiles")
    .select("email, dob, underage_refused_at")
    .eq("email", referredEmail)
    .maybeSingle();
  if (!referred || !referred.dob || referred.underage_refused_at) {
    return { status: "pending_onboarding" };
  }

  // Idempotent by construction: UNIQUE(referred_email) is the one-referrer-
  // per-account rule, enforced by the database. Whichever attribution lands
  // first is permanent; a later one is reported, not retried.
  const { error } = await admin.from("referrals").insert({
    referrer_email: referrer.email,
    referred_email: referredEmail,
    shop_slug: null, // customer referral — the merchant flow sets its own
  });
  if (!error) return { status: "attributed" };
  if (error.code === "23505") return { status: "already_attributed" };
  throw new Error(error.message);
}
