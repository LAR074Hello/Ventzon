/**
 * stripe-setup.mjs
 *
 * Run this ONCE to create the test-mode Billing Meter + metered price
 * for the Ventzon Free plan.
 *
 *   node scripts/stripe-setup.mjs
 *
 * When it finishes it prints the price ID — paste that into .env.local as
 *   STRIPE_PRICE_FREE_METERED=price_...
 */

import Stripe from "stripe";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local manually ────────────────────────────────────────────────
const envPath = resolve(process.cwd(), ".env.local");
let envText = "";
try {
  envText = readFileSync(envPath, "utf8");
} catch {
  console.error("❌  Could not read .env.local — run this script from the project root.");
  process.exit(1);
}

function envVar(name) {
  const match = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

const STRIPE_SECRET_KEY = envVar("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error("❌  STRIPE_SECRET_KEY in .env.local must be a test-mode key (sk_test_...).");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-03-31.basil" });

const METER_EVENT_NAME = "reward_redeemed"; // must match checkin/route.ts
const PRICE_UNIT_CENTS  = 100;              // $1.00 per reward

// ── 1. Find or create the Billing Meter ─────────────────────────────────────
console.log("\n🔍  Looking for existing test-mode meter …");

let meter;
const { data: meters } = await stripe.billing.meters.list({ limit: 100 });
meter = meters.find((m) => m.event_name === METER_EVENT_NAME && m.status === "active");

if (meter) {
  console.log(`✅  Found meter: ${meter.id} (event_name="${meter.event_name}")`);
} else {
  console.log(`➕  Creating meter with event_name="${METER_EVENT_NAME}" …`);
  meter = await stripe.billing.meters.create({
    display_name: "Rewards Redeemed",
    event_name:   METER_EVENT_NAME,
    default_aggregation: { formula: "sum" },
  });
  console.log(`✅  Created meter: ${meter.id}`);
}

// ── 2. Find or create the Free Rewards product ──────────────────────────────
console.log("\n🔍  Looking for Free Rewards product …");

let product;
const { data: products } = await stripe.products.list({ limit: 100, active: true });
product = products.find((p) => p.name.toLowerCase().includes("free"));

if (product) {
  console.log(`✅  Using product: ${product.id}  "${product.name}"`);
} else {
  console.log("➕  Creating Free Rewards product …");
  product = await stripe.products.create({
    name: "Ventzon Free Rewards",
    type: "service",
  });
  console.log(`✅  Created product: ${product.id}`);
}

// ── 3. Find or create a metered price linked to the meter ───────────────────
console.log("\n🔍  Looking for existing metered price …");

let price;
const { data: prices } = await stripe.prices.list({ product: product.id, limit: 100 });
price = prices.find(
  (p) =>
    p.active &&
    p.recurring?.usage_type === "metered" &&
    p.recurring?.meter === meter.id
);

if (price) {
  console.log(`✅  Found price: ${price.id}  ($${(price.unit_amount / 100).toFixed(2)}/reward)`);
} else {
  console.log("➕  Creating metered price …");
  price = await stripe.prices.create({
    product:     product.id,
    currency:    "usd",
    unit_amount: PRICE_UNIT_CENTS,
    recurring: {
      interval:    "month",
      usage_type:  "metered",
      meter:       meter.id,
    },
    nickname: "Free plan – $1.00/reward",
  });
  console.log(`✅  Created price: ${price.id}`);
}

// ── 4. Patch .env.local ─────────────────────────────────────────────────────
console.log("\n✏️   Updating .env.local …");

const updated = envText.replace(
  /^(STRIPE_PRICE_FREE_METERED=).*$/m,
  `$1${price.id}`
);

if (updated === envText) {
  console.warn("⚠️   STRIPE_PRICE_FREE_METERED line not found in .env.local — add it manually:");
  console.log(`\n   STRIPE_PRICE_FREE_METERED=${price.id}\n`);
} else {
  writeFileSync(envPath, updated, "utf8");
  console.log("✅  .env.local updated.");
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Done!  Test-mode setup complete.

  Meter ID    : ${meter.id}
  event_name  : ${meter.event_name}
  Price ID    : ${price.id}
  Product     : ${product.name}

Your .env.local now has:
  STRIPE_PRICE_FREE_METERED=${price.id}

Restart your dev server:  npm run dev
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
