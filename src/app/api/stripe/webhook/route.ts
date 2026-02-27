// src/app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil" as any,
});

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

  if (!supabaseAdmin) {
    console.warn(
      "Webhook received but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; skipping DB update.",
      { type: event.type }
    );
    return ok({ received: true, skipped_db: true });
  }

  // Idempotency: prevent duplicate processing
  try {
    const { error: insertErr } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: event.id } as any);

    if (insertErr) {
      const code = (insertErr as any).code;
      const msg = String((insertErr as any).message ?? "").toLowerCase();

      if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
        console.log("[WEBHOOK] duplicate event, skipping", event.id);
        return ok({ received: true, duplicate: true });
      }

      console.warn("[WEBHOOK] stripe_events insert failed (non-fatal), continuing:", insertErr);
    } else {
      console.log("[WEBHOOK] recorded stripe_events", event.id);
    }
  } catch (e: any) {
    console.warn("[WEBHOOK] stripe_events idempotency block error (non-fatal), continuing:", e);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const shopSlug = (session.metadata?.shop_slug ?? "").trim().toLowerCase();
        const planType = (session.metadata?.plan_type ?? "").trim().toLowerCase() || "pro";

        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const customerId = typeof session.customer === "string" ? session.customer : null;

        if (!shopSlug) {
          console.warn("checkout.session.completed missing metadata.shop_slug", {
            sessionId: session.id,
          });
          break;
        }

        const { error } = await supabaseAdmin
          .from("shops")
          .update({
            is_paid: true,
            subscription_status: "active",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("slug", shopSlug);

        if (error) {
          console.error("Supabase update failed on checkout.session.completed", error);
        } else {
          console.log("[WEBHOOK] shop activated", { shopSlug, planType });
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status;
        const isPaid = status === "active" || status === "trialing";

        let shopSlug = (sub.metadata?.shop_slug ?? "").trim().toLowerCase();

        if (!shopSlug) {
          console.warn("subscription event missing metadata.shop_slug, falling back to DB lookup", {
            subId: sub.id,
            type: event.type,
          });

          const { data: shopRow } = await supabaseAdmin
            .from("shops")
            .select("slug")
            .eq("stripe_subscription_id", sub.id)
            .maybeSingle();

          if (shopRow?.slug) {
            shopSlug = shopRow.slug;
          } else {
            console.error("Could not resolve shop for subscription event", {
              subId: sub.id,
              type: event.type,
            });
            break;
          }
        }

        const planType = (sub.metadata?.plan_type ?? "").trim().toLowerCase();

        const updatePayload: Record<string, any> = {
          is_paid: isPaid,
          subscription_status: status,
          stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        };

        // Only update plan_type if metadata has it (avoids wiping it on legacy subs)
        if (planType) {
          updatePayload.plan_type = planType;
        }

        const { error } = await supabaseAdmin
          .from("shops")
          .update(updatePayload as any)
          .eq("slug", shopSlug);

        if (error) {
          console.error("Supabase update failed on subscription event", { type: event.type, error });
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as any).subscription === "string" ? (invoice as any).subscription : null;

        if (subId) {
          // Mark all unbilled reward_events as billed for this shop
          const { data: shopRow } = await supabaseAdmin
            .from("shops")
            .select("slug")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();

          if (shopRow?.slug) {
            await supabaseAdmin
              .from("reward_events")
              .update({ billed: true } as any)
              .eq("shop_slug", shopRow.slug)
              .eq("billed", false);

            console.log("[WEBHOOK] invoice paid, marked reward_events as billed", {
              shop: shopRow.slug,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof (invoice as any).subscription === "string" ? (invoice as any).subscription : null;

        if (subId) {
          const { data: shopRow } = await supabaseAdmin
            .from("shops")
            .select("slug")
            .eq("stripe_subscription_id", subId)
            .maybeSingle();

          if (shopRow?.slug) {
            console.warn("[WEBHOOK] invoice payment failed", {
              shop: shopRow.slug,
              invoiceId: invoice.id,
            });
            // Stripe's built-in dunning will retry automatically.
            // The subscription.updated event will update status to past_due if needed.
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (e: any) {
    console.error("Webhook handler error", e);
    return ok({ received: true, handler_error: e?.message ?? "unknown" });
  }

  return ok({ received: true });
}
