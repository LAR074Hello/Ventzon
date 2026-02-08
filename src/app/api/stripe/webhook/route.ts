// src/app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Stripe client (TS typing for apiVersion can be overly strict; `as any` avoids noise)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil" as any,
});

// Server-side Supabase client (service role required for updates from webhooks)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) return ok({ error: "Missing stripe-signature" }, 400);
  if (!webhookSecret) return ok({ error: "Missing STRIPE_WEBHOOK_SECRET" }, 500);

  // IMPORTANT: use raw body for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    console.log("[WEBHOOK] received", {
      id: event.id,
      type: event.type,
      livemode: (event as any).livemode,
    });
  } catch (err: any) {
    return ok({ error: `Webhook Error: ${err?.message ?? "invalid signature"}` }, 400);
  }

  // If Supabase server env vars aren't set, we still return 200 so Stripe stops retrying,
  // but we include a helpful log.
  if (!supabaseAdmin) {
    console.warn(
      "Webhook received but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; skipping DB update.",
      { type: event.type }
    );
    return ok({ received: true, skipped_db: true });
  }

  // Idempotency: record processed Stripe event IDs so retries don't double-apply updates.
  // Requires a table: public.stripe_events(id text primary key, created_at timestamptz default now())
  try {
    const { error: insertErr } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: event.id } as any);

    console.log("[WEBHOOK] inserted stripe_events", event.id);

    if (insertErr) {
      const code = (insertErr as any).code;
      const msg = String((insertErr as any).message ?? "").toLowerCase();

      // Postgres unique violation (already processed)
      if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
        return ok({ received: true, duplicate: true });
      }

      console.error("[WEBHOOK] stripe_events insertErr", insertErr);
      console.error("stripe_events insert failed", insertErr);
      // Return 200 so Stripe doesn't retry forever; surface the failure for debugging.
      return ok({ received: true, stripe_events_insert_error: true });
    }
  } catch (e: any) {
    console.error("stripe_events idempotency block failed", e);
    return ok({ received: true, stripe_events_insert_error: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // We pass the shop slug into metadata when creating the checkout session.
        const shopSlug = (session.metadata?.shop_slug ?? "").trim().toLowerCase();

        // For subscriptions, Stripe provides these on the session.
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const customerId = typeof session.customer === "string" ? session.customer : null;

        if (!shopSlug) {
          console.warn("checkout.session.completed missing metadata.shop_slug", {
            sessionId: session.id,
          });
          break;
        }

        // Update your shops table. If your table/column names differ, adjust here.
        // Assumed schema: table `shops` with columns:
        //   - slug (text)
        //   - is_paid (bool)
        //   - subscription_status (text)
        //   - stripe_customer_id (text)
        //   - stripe_subscription_id (text)
        const { error } = await supabaseAdmin
          .from("shops")
          .update({
            is_paid: true,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("slug", shopSlug);

        if (error) {
          console.error("Supabase update failed on checkout.session.completed", error);
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        // We also stamp metadata on the subscription by passing metadata at checkout creation.
        const shopSlug = (sub.metadata?.shop_slug ?? "").trim().toLowerCase();
        const status = sub.status; // active, trialing, canceled, unpaid, past_due, etc.

        if (!shopSlug) {
          // If you don't have shop_slug on the subscription metadata, you can alternatively
          // look it up by stripe_subscription_id in your DB. This assumes metadata exists.
          console.warn("subscription event missing metadata.shop_slug", {
            subId: sub.id,
            type: event.type,
          });
          break;
        }

        const isPaid = status === "active" || status === "trialing";

        const { error } = await supabaseAdmin
          .from("shops")
          .update({
            is_paid: isPaid,
            subscription_status: status,
            stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("slug", shopSlug);

        if (error) {
          console.error("Supabase update failed on subscription event", { type: event.type, error });
        }

        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (e: any) {
    console.error("Webhook handler error", e);
    // Return 200 to prevent Stripe from retrying forever on transient app errors.
    return ok({ received: true, handler_error: e?.message ?? "unknown" });
  }

  return ok({ received: true });
}