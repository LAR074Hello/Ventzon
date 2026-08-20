import { safeJson } from "@/lib/safe-json";

export type CheckinResult = {
  ok?: boolean;
  status?: "progress" | "reward" | "already_checked_in";
  visits?: number;
  goal?: number;
  remaining?: number;
  message?: string;
  error?: string;
};

/**
 * Shared, hardened check-in POST. Used by the scan page after a QR decodes
 * (and by any fallback path) so the camera-first flow and any direct flow
 * exercise the same code.
 *
 * Response parsing goes through safeJson: a non-JSON body (HTML error page,
 * SSO redirect) becomes a caught, logged error with the real status + body
 * instead of Safari's raw "The string did not match the expected pattern."
 */
export async function performCheckin(opts: {
  shopSlug: string;
  email: string;
  referredBy?: string | null;
}): Promise<CheckinResult> {
  let referredBy = opts.referredBy ?? null;
  if (referredBy == null) {
    try {
      referredBy = localStorage.getItem("ventzon_ref");
    } catch {
      referredBy = null;
    }
  }

  const res = await fetch("/api/join/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shop_slug: opts.shopSlug,
      email: opts.email,
      ...(referredBy ? { referred_by: referredBy } : {}),
    }),
  });

  const json = await safeJson<CheckinResult>(res);
  if (!res.ok) throw new Error(json?.error ?? "Check-in failed");
  return json;
}
