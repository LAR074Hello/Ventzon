import crypto from "crypto";

const SECRET = process.env.JOIN_TOKEN_SECRET;

/** Deterministic 12-char hex token for a given shop slug. */
export function generateJoinToken(shopSlug: string): string {
  if (!SECRET) {
    throw new Error(
      "JOIN_TOKEN_SECRET environment variable is not set. " +
      "Add it to your .env.local and Vercel project settings."
    );
  }
  return crypto
    .createHmac("sha256", SECRET)
    .update(shopSlug)
    .digest("hex")
    .slice(0, 12);
}
