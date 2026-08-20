const CODE_KEY = "ventzon_referral_code";

/**
 * Client-side referral capture. The referral code is stashed locally so it
 * survives the auth dance (email OTP, Google in-browser, Apple) and the age
 * gate; attribution itself is server-side and idempotent.
 *
 * The code is only ever SENT to the server. The referrer is resolved
 * server-side; the client never names one, and a client-supplied referrer id
 * is never trusted.
 */

export function stashReferralCode(code: string | null | undefined): void {
  if (!code) return;
  try {
    localStorage.setItem(CODE_KEY, String(code).trim().toUpperCase());
  } catch {
    /* storage unavailable — attribution is best-effort */
  }
}

export function getPendingReferralCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferralCode(): void {
  try {
    localStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Capture a referral from a shared link. Two formats coexist:
 *  - legacy merchant-era shares use ?ref=<profile_id> (a UUID) → kept for
 *    the check-in flow in ventzon_ref, untouched.
 *  - the customer referral system uses ?ref=<code> and /invite/<code> →
 *    stashed as the pending referral code.
 */
export function captureReferralParam(ref: string | null | undefined): void {
  if (!ref) return;
  const trimmed = String(ref).trim();
  if (!trimmed) return;
  if (UUID_RE.test(trimmed)) {
    try {
      localStorage.setItem("ventzon_ref", trimmed);
    } catch {
      /* ignore */
    }
    return;
  }
  stashReferralCode(trimmed);
}

/**
 * Send any pending referral code to the server. Idempotent server-side.
 * Clears on every terminal outcome; keeps the code while onboarding is still
 * pending so the age-gate flush can complete attribution.
 */
export async function flushPendingReferral(): Promise<void> {
  const code = getPendingReferralCode();
  if (!code) return;
  try {
    const res = await fetch("/api/customer/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.status === 401) return; // signed out — retry after auth
    const json = await res.json().catch(() => ({}));
    if (json?.status === "pending_onboarding") return; // retry after age gate
    clearPendingReferralCode(); // attributed / already_attributed / invalid / self
  } catch {
    // network failure — leave the code for the next attempt
  }
}
