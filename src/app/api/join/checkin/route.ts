import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import crypto from "crypto";
import { sendSms } from "@/lib/twilio";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------- PIN hashing (scrypt) ----------
function hashPin(pin: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

function verifyPin(pin: string, stored: string) {
  // stored format: scrypt:<salt>:<hex>
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1];
  const expected = parts[2];
  const derived = crypto.scryptSync(pin, salt, 32).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(expected));
}

// ---------- template helper ----------
function applyTemplate(tpl: string, vars: Record<string, string | number>) {
  let out = tpl || "";
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/join/checkin",
      methods: ["POST"],
      usage:
        "POST JSON: { shop_slug: string, phone: string, pin?: string(6 digits, optional) }",
      example_curl:
        "curl -s -X POST http://localhost:3000/api/join/checkin -H 'Content-Type: application/json' -d '{\"shop_slug\":\"govans-groceries\",\"phone\":\"+14105551234\",\"pin\":\"123456\"}'",
    },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  // Rate limit: 20 check-ins per IP per minute
  const ip = getClientIp(req);
  const rl = rateLimit(`checkin:${ip}`, 20, 60_000);
  if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const shop_slug = String(body?.shop_slug ?? "").trim().toLowerCase();
    const phone = String(body?.phone ?? "").trim();
    const pin = String(body?.pin ?? "").trim();

    if (!shop_slug || !phone) {
      return NextResponse.json(
        { error: "Missing shop_slug or phone" },
        { status: 400 }
      );
    }

    // PIN is optional (QR check-ins don't require one),
    // but if provided it must be exactly 6 digits.
    if (pin && !/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Load shop settings (goal + templates)
    const { data: settings, error: settingsErr } = await supabase
      .from("shop_settings")
      .select(
        "shop_slug, shop_name, deal_title, visits_required, reward_sms_template, progress_sms_template"
      )
      .eq("shop_slug", shop_slug)
      .limit(1)
      .maybeSingle();

    if (settingsErr) {
      return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    }

    const shopName = settings?.shop_name || shop_slug;
    const dealTitle = settings?.deal_title || "your reward";
    const goal = Number(settings?.visits_required ?? 5);

    // Find or create customer
    const { data: existing, error: findErr } = await supabase
      .from("customers")
      .select("id, shop_slug, phone, pin_hash, visits, last_checkin_date, opted_out")
      .eq("shop_slug", shop_slug)
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    let customer = existing as any;

    if (!customer) {
      // Create customer; hash PIN only if one was provided
      const { data: inserted, error: insertErr } = await supabase
        .from("customers")
        .insert({
          shop_slug,
          phone,
          pin_hash: pin ? hashPin(pin) : null,
          visits: 0,
          last_checkin_date: null,
          first_seen_at: now.toISOString(),
          last_seen_at: now.toISOString(),
          opted_out: false,
        })
        .select("id, shop_slug, phone, pin_hash, visits, last_checkin_date")
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      customer = inserted;
    } else {
      // Verify PIN only when the customer already has one set
      if (customer.pin_hash) {
        if (!pin) {
          // Customer has a PIN but none was provided — allow QR check-in
          // (skip PIN verification)
        } else if (!verifyPin(pin, String(customer.pin_hash))) {
          return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
        }
      } else if (pin) {
        // No PIN stored yet — set it now
        const { data: updatedPin, error: pinErr } = await supabase
          .from("customers")
          .update({ pin_hash: hashPin(pin) })
          .eq("id", customer.id)
          .select("id, shop_slug, phone, pin_hash, visits, last_checkin_date")
          .single();

        if (pinErr) {
          return NextResponse.json({ error: pinErr.message }, { status: 500 });
        }
        customer = updatedPin;
      }

      // Keep last_seen_at fresh
      await supabase.from("customers").update({ last_seen_at: now.toISOString() }).eq("id", customer.id);
    }

    // Enforce 1 check-in/day via checkins table (unique index must exist)
    const { error: checkinInsertErr } = await supabase.from("checkins").insert({
      shop_slug,
      customer_id: customer.id,
      checkin_date: today,
      created_at: now.toISOString(),
    });

    if (checkinInsertErr) {
      // If duplicate, they already checked in today
      if (String(checkinInsertErr.message || "").toLowerCase().includes("duplicate")) {
        const visits = Number(customer.visits ?? 0);
        return NextResponse.json(
          {
            ok: true,
            status: "already_checked_in",
            visits,
            goal,
            remaining: Math.max(goal - visits, 0),
            message: "Already checked in today.",
          },
          { status: 200 }
        );
      }

      return NextResponse.json({ error: checkinInsertErr.message }, { status: 500 });
    }

    // New check-in → increment visits
    const currentVisits = Number(customer.visits ?? 0);
    const nextVisits = currentVisits + 1;

    const hitGoal = nextVisits >= goal;

    const newVisitsValue = hitGoal ? 0 : nextVisits;
    const { data: updatedCustomer, error: updateErr } = await supabase
      .from("customers")
      .update({
        visits: newVisitsValue,
        last_checkin_date: today,
      })
      .eq("id", customer.id)
      .select("id, shop_slug, phone, visits, last_checkin_date")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // ── Record reward event + report Stripe metered usage ──
    if (hitGoal) {
      // Insert reward_events row
      await supabase.from("reward_events").insert({
        shop_slug,
        customer_id: customer.id,
        reward_date: today,
      });

      // Report metered usage to Stripe for free-plan shops (Billing Meters API)
      try {
        const { data: shopRow } = await supabase
          .from("shops")
          .select("plan_type, stripe_customer_id")
          .eq("slug", shop_slug)
          .maybeSingle();

        if (
          shopRow &&
          (shopRow as any).plan_type === "free" &&
          (shopRow as any).stripe_customer_id
        ) {
          const stripeKey = process.env.STRIPE_SECRET_KEY;
          if (stripeKey) {
            const stripe = new Stripe(stripeKey);
            // Report a meter event — Stripe aggregates and invoices monthly
            await stripe.billing.meterEvents.create({
              event_name: "reward_redeemed",
              payload: {
                stripe_customer_id: (shopRow as any).stripe_customer_id,
                value: "1",
              },
            });
          }
        }
      } catch (usageErr: any) {
        // Non-fatal: log but don't block the customer's reward
        console.error("[checkin] Stripe usage reporting failed:", usageErr?.message);
      }
    }

    const vars = {
      shop_name: shopName,
      deal_title: dealTitle,
      visits: hitGoal ? goal : nextVisits,
      goal,
      remaining: hitGoal ? 0 : Math.max(goal - nextVisits, 0),
    };

    const rewardTpl =
      settings?.reward_sms_template ||
      "You qualify for {{deal_title}} at {{shop_name}} 🎉 Show this message to redeem.";
    const progressTpl =
      settings?.progress_sms_template ||
      "Checked in at {{shop_name}} ✅ You're at {{visits}}/{{goal}} visits. {{remaining}} to go.";

    const message = hitGoal
      ? applyTemplate(rewardTpl, vars)
      : applyTemplate(progressTpl, vars);

    // Send SMS if enabled (skip opted-out customers)
    const isOptedOut = customer.opted_out === true;
    if (process.env.SMS_ENABLED === "true" && !isOptedOut) {
      try {
        await sendSms(phone, message);
      } catch (smsErr: any) {
        console.error("SMS send failed:", smsErr?.message);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        status: hitGoal ? "reward" : "progress",
        visits: hitGoal ? goal : nextVisits,
        goal,
        remaining: hitGoal ? 0 : Math.max(goal - nextVisits, 0),
        reset: hitGoal,
        message,
        customer: updatedCustomer,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}