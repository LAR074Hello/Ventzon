import crypto from "crypto";

const SECRET = process.env.JOIN_TOKEN_SECRET;

if (!SECRET) {
  console.error("[join-token] JOIN_TOKEN_SECRET env var is not set — QR code tokens will be insecure!");
}

const EFFECTIVE_SECRET = SECRET ?? "ventzon-join-default-insecure";

/** Deterministic 12-char hex token for a given shop slug. */
export function generateJoinToken(shopSlug: string): string {
  return crypto
    .createHmac("sha256", EFFECTIVE_SECRET)
    .update(shopSlug)
    .digest("hex")
    .slice(0, 12);
}
