// src/app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createPaidShop, type ShopWriteDb } from "@/lib/merchant-shop";
import { sendEmail } from "@/lib/resend";
import { scheduleOnboardingDrip } from "@/lib/onboarding-drip";

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

// Adapter from the service-role Supabase client to the narrow ShopWriteDb
// surface used by src/lib/merchant-shop.ts (mockable in tests).
function toShopDb(admin: NonNullable<typeof supabaseAdmin>): ShopWriteDb {
  return {
    findSlug: async (slug) => {
      const { data, error } = await admin
        .from("shops")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      return {
        data: data as { id: string } | null,
        error: error ? { message: error.message } : null,
      };
    },
    insertShop: async (row) => {
      const { data, error } = await admin
        .from("shops")
        .insert(row)
        .select("id, slug")
        .single();
      return {
        data: data as { id: string; slug: string } | null,
        error: error ? { message: error.message } : null,
      };
    },
    insertMember: async (row) => {
      const { error } = await admin.from("shop_members").insert(row);
      return { error: error ? { message: error.message } : null };
    },
    insertSettings: async (row) => {
      const { error } = await admin.from("shop_settings").insert(row);
      return { error: error ? { message: error.message } : null };
    },
  };
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

      // Non-duplicate DB error — fail so Stripe retries the event
      console.error("[WEBHOOK] stripe_events insert failed, returning 500 for retry:", insertErr);
      return ok({ error: "Idempotency check failed, will retry" }, 500);
    } else {
      console.log("[WEBHOOK] recorded stripe_events", event.id);
    }
  } catch (e: any) {
    console.error("[WEBHOOK] stripe_events idempotency block error, returning 500 for retry:", e);
    return ok({ error: "Idempotency check failed, will retry" }, 500);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const shopSlug = (session.metadata?.shop_slug ?? "").trim().toLowerCase();
        const planType = (session.metadata?.plan_type ?? "").trim().toLowerCase() || "pro";
        const planInterval =
          (session.metadata?.plan_interval ?? "").trim().toLowerCase() === "annual"
            ? "annual"
            : "monthly";
        // New-onboarding metadata: the shop may not exist yet. user_id is
        // server-stamped by the checkout route — never client-supplied.
        const shopName = (session.metadata?.shop_name ?? "").trim();
        const userId = (session.metadata?.user_id ?? "").trim();

        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        const customerId = typeof session.customer === "string" ? session.customer : null;

        if (!shopSlug) {
          console.warn("checkout.session.completed missing metadata.shop_slug", {
            sessionId: session.id,
          });
          break;
        }

        const { data: existingShop, error: findErr } = await supabaseAdmin
          .from("shops")
          .select("id")
          .eq("slug", shopSlug)
          .maybeSingle();

        if (findErr) {
          console.error("checkout.session.completed: shop lookup failed", findErr);
          return ok({ error: "Shop lookup failed, will retry" }, 500);
        }

        if (existingShop) {
          // ── Legacy activation: row already exists → update, never recreate.
          // This is the path every existing shop takes (incl. the-daily-grind)
          // and preserves the plan_interval handling unchanged.
          const { error } = await supabaseAdmin
            .from("shops")
            .update({
              is_paid: true,
              subscription_status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_type: planType,
              plan_interval: planInterval,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("slug", shopSlug);

          if (error) {
            console.error("Supabase update failed on checkout.session.completed", error);
            return ok({ error: "Shop activation update failed, will retry" }, 500);
          }
          console.log("[WEBHOOK] shop activated (existing)", { shopSlug, planType, planInterval });
          break;
        }

        // ── Deferred onboarding: no shop row yet — create it now, paid/active.
        if (!shopName || !userId) {
          console.warn(
            "checkout.session.completed missing shop_name/user_id for shop creation",
            { sessionId: session.id, shopSlug }
          );
          break;
        }

        let created: { id: string; slug: string };
        try {
          created = await createPaidShop(toShopDb(supabaseAdmin), {
            slug: shopSlug,
            name: shopName,
            userId,
            planType,
            planInterval,
            customerId,
            subscriptionId,
          });
        } catch (e) {
          console.error("checkout.session.completed: shop creation failed", e);
          return ok({ error: "Shop creation failed, will retry" }, 500);
        }
        console.log("[WEBHOOK] shop created after payment", created);

        // Post-payment drip + welcome email — best-effort, never blocks payment.
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
          const email = authUser?.user?.email;
          if (email) {
            await scheduleOnboardingDrip(email, created.slug);
            await sendEmail(
              email,
              `Welcome to Ventzon — ${shopName} is live`,
              `Hi there,\n\nYour shop "${shopName}" is now live on Ventzon. Here's what to do next:\n\n1. Set your reward deal — tell customers what they're working toward (e.g. "Free coffee after 8 visits").\n2. Upload your logo — helps customers recognize your shop in the app.\n3. Print your QR code — this is what customers scan to check in.\n\nYour dashboard: https://ventzon.com/merchant/${created.slug}\n\nAny questions? Reply to this email or reach us at support@ventzon.com.\n\n— The Ventzon Team`
            );
          }
        } catch (emailErr) {
          console.warn("Post-payment welcome email/drip failed (non-fatal):", emailErr);
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
        const planInterval = (sub.metadata?.plan_interval ?? "").trim().toLowerCase();

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

        // Only update plan_interval if metadata has a valid value (legacy subs
        // carry no metadata — leave their existing value, or NULL, untouched).
        if (planInterval === "monthly" || planInterval === "annual") {
          updatePayload.plan_interval = planInterval;
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
