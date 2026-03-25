import crypto from "crypto";

const SECRET =
  process.env.JOIN_TOKEN_SECRET ||
  process.env.RESEND_API_KEY ||
  "ventzon-join-default";

/** Deterministic 12-char hex token for a given shop slug. */
export function generateJoinToken(shopSlug: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(shopSlug)
    .digest("hex")
    .slice(0, 12);
}
