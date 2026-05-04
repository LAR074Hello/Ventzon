import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import crypto from "crypto";
import { sendEmail } from "@/lib/resend";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { sendPushToDeviceTokens } from "@/lib/push";

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
    const email = String(body?.email ?? "").trim().toLowerCase();
    const pin = String(body?.pin ?? "").trim();

    // Customer must provide either phone or email
    if (!shop_slug || (!phone && !email)) {
      return NextResponse.json(
        { error: "Missing shop_slug, or provide phone or email" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    const contactMethod = email ? "email" : "none";

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
        "shop_slug, shop_name, deal_title, reward_goal, bonus_days"
      )
      .eq("shop_slug", shop_slug)
      .limit(1)
      .maybeSingle();

    if (settingsErr) {
      return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    }

    const shopName = settings?.shop_name || shop_slug;
    const dealTitle = settings?.deal_title || "your reward";
    const goal = Number(settings?.reward_goal ?? 5);

    // Find or create customer (by phone or email)
    let findQuery = supabase
      .from("customers")
      .select("id, shop_slug, phone, email, pin_hash, visits, last_checkin_date, opted_out")
      .eq("shop_slug", shop_slug);

    if (email) {
      findQuery = findQuery.eq("email", email);
    } else {
      findQuery = findQuery.eq("phone", phone);
    }

    const { data: existing, error: findErr } = await findQuery
      .limit(1)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Bonus days: if today's day-of-week is in bonus_days, award 2 stamps
    const bonusDays = (settings as any)?.bonus_days as number[] | null;
    const isBonusDay = Array.isArray(bonusDays) && bonusDays.includes(now.getDay()); // 0=Sun…6=Sat

    let customer = existing as any;

    if (!customer) {
      // Create customer; hash PIN only if one was provided
      const { data: inserted, error: insertErr } = await supabase
        .from("customers")
        .insert({
          shop_slug,
          phone: phone || null,
          email: email || null,
          pin_hash: pin ? hashPin(pin) : null,
          visits: 0,
          last_checkin_date: null,
          first_seen_at: now.toISOString(),
          last_seen_at: now.toISOString(),
          opted_out: false,
        })
        .select("id, shop_slug, phone, email, pin_hash, visits, last_checkin_date")
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
          .select("id, shop_slug, phone, email, pin_hash, visits, last_checkin_date")
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
      // Check for unique-constraint violation (duplicate check-in today)
      const errCode = (checkinInsertErr as any).code;
      const errMsg = String(checkinInsertErr.message ?? "").toLowerCase();
      const isDuplicate =
        errCode === "23505" ||
        errMsg.includes("duplicate") ||
        errMsg.includes("unique");

      if (isDuplicate) {
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

    // New check-in → increment visits (double on bonus days)
    const currentVisits = Number(customer.visits ?? 0);
    const stampBonus = isBonusDay ? 2 : 1;
    const nextVisits = currentVisits + stampBonus;

    const hitGoal = nextVisits >= goal;

    const newVisitsValue = hitGoal ? 0 : nextVisits;
    const { data: updatedCustomer, error: updateErr } = await supabase
      .from("customers")
      .update({
        visits: newVisitsValue,
        last_checkin_date: today,
      })
      .eq("id", customer.id)
      .select("id, shop_slug, phone, email, visits, last_checkin_date")
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

      // Report metered usage to Stripe for all subscribed shops ($0.95/redemption)
      try {
        const { data: shopRow } = await supabase
          .from("shops")
          .select("plan_type, stripe_customer_id")
          .eq("slug", shop_slug)
          .maybeSingle();

        if (
          shopRow &&
          ["free", "pro"].includes((shopRow as any).plan_type) &&
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

    const rewardTpl = "You've earned your reward at {{shop_name}} 🎉 Show the app at the register to redeem: {{deal_title}}";
    const progressTpl = "Checked in at {{shop_name}} ✅ You're at {{visits}}/{{goal}} stamps. {{remaining}} more to go!";

    const message = hitGoal
      ? applyTemplate(rewardTpl, vars)
      : applyTemplate(progressTpl, vars);

    // ── Push notifications ──
    try {
      if (email && customer.id) {
        // Look up auth user by email — paginate so we don't miss users past the
        // default page size and don't silently skip large accounts.
        let authUser: any = null;
        let page = 1;
        while (!authUser) {
          const { data: authPage } = await supabase.auth.admin.listUsers({
            page,
            perPage: 1000,
          });
          if (!authPage?.users?.length) break;
          authUser = authPage.users.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (authPage.users.length < 1000) break;
          page++;
        }
        if (authUser) {
          const { data: tokenRows } = await supabase
            .from("device_tokens")
            .select("token")
            .eq("user_id", authUser.id);
          const tokens = (tokenRows ?? []).map((r: any) => r.token).filter(Boolean);
          if (tokens.length > 0) {
            if (hitGoal) {
              await sendPushToDeviceTokens(
                tokens,
                "🏆 Reward earned!",
                `You've earned your reward at ${shopName}. Show the app at the register.`,
                { shop_slug, type: "reward" }
              );
            } else if (nextVisits === goal - 1) {
              await sendPushToDeviceTokens(
                tokens,
                "Almost there!",
                `Just 1 more visit to earn your reward at ${shopName}.`,
                { shop_slug, type: "almost" }
              );
            }
          }
        }
      }
    } catch (pushErr: any) {
      console.error("[checkin] Push notification failed:", pushErr?.message);
    }

    // Send notification (SMS or email) — skip opted-out customers
    const isOptedOut = customer.opted_out === true;
    if (!isOptedOut) {
      if (contactMethod === "email") {
        try {
          const subject = hitGoal
            ? `You earned a reward at ${shopName}!`
            : `Check-in at ${shopName}`;
          await sendEmail(email, subject, message);
        } catch (emailErr: any) {
          console.error("Email send failed:", emailErr?.message);
        }
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