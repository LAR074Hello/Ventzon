// src/app/pricing/PricingContent.tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import Divider from "@/components/Divider";
import SiteFooter from "@/components/SiteFooter";

/* Render comparison cells: true/false become lucide Check/X icons, strings render as text. */
function YesNoCell({ value, dim = false }: { value: string | boolean; dim?: boolean }) {
  if (value === true) {
    return <Check className={`mx-auto h-4 w-4 ${dim ? "text-fog-600" : "text-fog-100"}`} strokeWidth={2} />;
  }
  if (value === false) {
    return <X className="mx-auto h-4 w-4 text-fog-600" strokeWidth={2} />;
  }
  return <span className={`text-[13px] font-light ${dim ? "text-fog-600" : "text-fog-100"}`}>{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const proFeatures = [
  "QR code + join page",
  "Unlimited customer check-ins",
  "Custom reward goal (2–12 visits)",
  "Analytics dashboard",
  "Customer list & CSV export",
  "Manual stamp tool",
  "Email campaigns",
  "Cancel anytime",
];

const faqs = [
  {
    q: "What does the $30/month cover?",
    a: "The $30 operational fee covers everything — your shop listing, QR code, stamp tracking, analytics, customer list, CSV export, manual stamp tool, and email campaigns.",
  },
  {
    q: "How do customers get notified?",
    a: "Customers who install the Ventzon app receive push notifications when they earn rewards or are close to earning one.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your merchant dashboard. Your shop stays active until the end of your billing period and no data is deleted.",
  },
  {
    q: "Is yearly billing worth it?",
    a: "At $300/year vs $360 billed monthly, you save $60 — that's 2 months free.",
  },
];

/* ------------------------------------------------------------------ */
/*  Pricing content (client) — receives ?shop= as a prop from the      */
/*  server page, so there's no Suspense/useSearchParams dance.         */
/* ------------------------------------------------------------------ */

export default function PricingContent({
  shopFromQuery,
  shopNameFromQuery,
}: {
  shopFromQuery: string;
  shopNameFromQuery: string;
}) {
  const supabase = createSupabaseBrowserClient();

  // Legacy activation: ?shop=<existing-slug>. New onboarding: ?shop_name=<name>
  // (no shop row exists yet — it is created only after payment).
  const isOnboarding = !shopFromQuery && shopNameFromQuery.trim().length > 0;

  const [shop, setShop] = useState(shopFromQuery);
  const [shopName, setShopName] = useState<string | null>(null);
  const [onboardingName, setOnboardingName] = useState(shopNameFromQuery.trim());
  const [editingName, setEditingName] = useState(false);
  const [loadingShop, setLoadingShop] = useState(!shopFromQuery && !shopNameFromQuery);
  // A signed-in merchant is the only visitor who gets the shop context
  // bar (their shop, or a "create a shop" prompt). Anonymous visitors see
  // neither that bar nor any loading state.
  const [knownUser, setKnownUser] = useState(false);
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState("");

  const hasShop = shop.length > 0;
  const displayName = isOnboarding ? onboardingName : shopName || shop;

  // Auto-detect the logged-in user's shop if neither ?shop= nor ?shop_name=
  // is present (marketing pricing for a signed-in merchant). Onboarding carries
  // its own name and must not be replaced by an unrelated existing shop.
  useEffect(() => {
    if (shopFromQuery || shopNameFromQuery) return;

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoadingShop(false);
          return;
        }

        setKnownUser(true);

        const { data: shops } = await supabase
          .from("shops")
          .select("slug, id")
          .eq("user_id", userData.user.id)
          .limit(1);

        if (shops && shops.length > 0) {
          setShop((shops[0] as { slug: string }).slug);
        }
      } catch (e) {
        console.error("Failed to auto-detect shop", e);
      } finally {
        setLoadingShop(false);
      }
    })();
  }, [shopFromQuery, shopNameFromQuery, supabase]);

  // Load shop name for display (legacy activation only — onboarding carries
  // the name in client state and has no DB row yet).
  useEffect(() => {
    if (!shop || isOnboarding) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("shop_settings")
          .select("shop_name")
          .eq("shop_slug", shop)
          .maybeSingle();
        if (data && (data as { shop_name: string }).shop_name) {
          setShopName((data as { shop_name: string }).shop_name);
        }
      } catch {}
    })();
  }, [shop, isOnboarding, supabase]);

  async function startCheckout(plan: "monthly" | "yearly") {
    let payload: { shop_name?: string; shop?: string; plan: string };
    if (isOnboarding) {
      const name = onboardingName.trim();
      if (!name) {
        setError("Enter your shop name.");
        return;
      }
      payload = { shop_name: name, plan };
    } else {
      if (!hasShop) {
        setError("No shop found. Please create a shop first.");
        return;
      }
      payload = { shop, plan };
    }

    setLoading(plan);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Read the raw body so a non-JSON (HTML error page / empty) response is
      // logged instead of surfacing as a confusing generic message.
      const raw = await res.text();
      let data: { url?: string; error?: string } | null = null;
      if (raw.trim()) {
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          console.error(
            "[pricing] non-JSON checkout response",
            res.status,
            raw.slice(0, 300),
            parseErr
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Checkout failed — the server responded with an error (${res.status}). Please try again.`
        );
      }

      if (!data?.url) {
        console.error(
          "[pricing] checkout response missing url",
          res.status,
          raw.slice(0, 300)
        );
        throw new Error(
          "Checkout failed — the server did not return a checkout link. Please try again."
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  return (
    <main className="marketing min-h-screen bg-night-950 text-fog-100">

      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 sm:px-8 pt-24">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="animate-fade-in anim-delay-200 text-[11px] font-light tracking-[0.5em] text-fog-500 opacity-0">
            PRICING
          </p>

          <h1 className="animate-fade-in anim-delay-400 mt-8 font-display text-4xl font-light tracking-[0.01em] text-white opacity-0 sm:text-5xl lg:text-6xl">
            Simple pricing.{" "}
            <br className="hidden sm:block" />
            One flat rate.
          </h1>

          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-fog-300 opacity-0 sm:text-lg">
            $30/month, flat &mdash; everything included.
            <br className="hidden sm:block" />
            No per-redemption fees, no surprises.
          </p>
        </div>
      </section>

      {/* ============================================================
          ONBOARDING STEP INDICATOR (shown when coming from get-started)
          ============================================================ */}
      {(shopFromQuery || shopNameFromQuery) && (
        <section className="px-4 sm:px-8 pb-4">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-night-600">
                <span className="text-[11px] font-light text-fog-500">1</span>
              </div>
              <span className="text-[11px] font-light tracking-[0.1em] text-fog-500">Name your shop</span>
            </div>
            <div className="h-[1px] w-6 bg-fog-500" />
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-fog-100">
                <span className="text-[11px] font-normal text-black">2</span>
              </div>
              <span className="text-[11px] font-light tracking-[0.1em] text-fog-100">Choose a plan</span>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SHOP CONTEXT BAR
          Only meaningful for a signed-in merchant (their shop, or a
          "create a shop" prompt) or a ?shop= slug in the URL. Anonymous
          visitors get a clean page — no "Finding your shop…" flash, no
          "no shop found" prompt.
          ============================================================ */}
      <section className="px-8">
        <div className="mx-auto max-w-lg">
          {loadingShop ? null : isOnboarding ? (
            <div className="animate-fade-in rounded-2xl border border-night-700 px-6 py-4">
              {!editingName ? (
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
                  <span className="text-[13px] font-light text-fog-500">Subscribing for </span>
                  <span className="max-w-[240px] truncate text-[13px] font-normal tracking-[0.05em] text-fog-100">
                    {onboardingName}
                  </span>
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setError("");
                    }}
                    className="text-[12px] font-normal underline decoration-night-600 underline-offset-2 text-fog-400 transition-colors duration-200 hover:text-fog-100"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <form
                    className="flex w-full items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!onboardingName.trim()) {
                        setError("Enter your shop name.");
                        return;
                      }
                      setEditingName(false);
                    }}
                  >
                    <input
                      autoFocus
                      value={onboardingName}
                      onChange={(e) => setOnboardingName(e.target.value)}
                      maxLength={60}
                      placeholder="Shop name"
                      className="min-w-0 flex-1 rounded-lg border border-night-700 bg-night-900 px-3 py-2 text-[13px] text-fog-100 outline-none transition-colors placeholder:text-fog-600 focus:border-night-600"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full border border-fog-100 px-4 py-2 text-[12px] font-light text-fog-100 transition-all duration-300 hover:bg-fog-100 hover:text-black"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className="shrink-0 text-[12px] font-light text-fog-500 transition-colors hover:text-fog-100"
                    >
                      Cancel
                    </button>
                  </form>
                  <p className="text-center text-[11px] font-light text-fog-600">
                    Applies to this checkout only — your shop is created after
                    payment.
                  </p>
                </div>
              )}
            </div>
          ) : hasShop ? (
            <div className="animate-fade-in rounded-2xl border border-night-700 px-6 py-4 text-center">
              <span className="text-[13px] font-light text-fog-500">Subscribing for </span>
              <span className="text-[13px] font-normal tracking-[0.05em] text-fog-100">
                {displayName}
              </span>
            </div>
          ) : knownUser ? (
            <div className="animate-fade-in rounded-2xl border border-night-700 px-8 py-8 text-center">
              <p className="text-[15px] font-light text-fog-300">
                No shop found. Create your shop first, then come back to pick a plan.
              </p>
              <a
                href="/get-started"
                className="group btn-pill mt-6 inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white hover:border-white hover:bg-white hover:text-black"
              >
                Create a shop
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
              </a>
            </div>
          ) : null}
        </div>
      </section>

      {/* ============================================================
          PLAN CARD
          ============================================================ */}
      <section className="px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-lg">
          <ScrollReveal>
            <div className="flex flex-col rounded-2xl border border-night-600 p-8 shadow-warm transition-all duration-500 ease-luxe hover:-translate-y-1 hover:border-white/20 hover:shadow-warm-lg sm:p-10">

              <div className="flex items-center justify-between">
                <p className="text-[11px] font-light tracking-[0.3em] text-fog-500">
                  VENTZON PRO
                </p>
                {/* Billing period toggle */}
                <div className="flex items-center rounded-full border border-night-600 p-0.5">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`rounded-full px-3 py-1 text-[10px] font-light tracking-[0.1em] transition-all duration-300 ${
                      billingPeriod === "monthly"
                        ? "bg-fog-100 text-black"
                        : "text-fog-500 hover:text-fog-300"
                    }`}
                  >
                    MONTHLY
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`rounded-full px-3 py-1 text-[10px] font-light tracking-[0.1em] transition-all duration-300 ${
                      billingPeriod === "yearly"
                        ? "bg-fog-100 text-black"
                        : "text-fog-500 hover:text-fog-300"
                    }`}
                  >
                    YEARLY
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-5xl font-light tracking-tight text-fog-100">
                  {billingPeriod === "yearly" ? "$300" : "$30"}
                </span>
                <span className="ml-1 text-lg font-light text-fog-600">
                  {billingPeriod === "yearly" ? "/yr" : "/mo"}
                </span>
              </div>

              {billingPeriod === "yearly" ? (
                <p className="mt-2 text-[11px] font-light tracking-[0.05em] text-emerald-500">
                  Save $60 vs monthly &mdash; that&apos;s 2 months free
                </p>
              ) : (
                <p className="mt-2 text-[11px] font-light text-fog-500">
                  or $300/yr and save $60
                </p>
              )}

              <p className="mt-4 text-[14px] font-light leading-[1.7] text-fog-500">
                Everything included &mdash; no per-redemption fees
              </p>

              {/* Divider */}
              <div className="my-8 h-[1px] bg-night-700" />

              {/* Features */}
              <ul className="flex-1 space-y-4">
                {proFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] font-light text-fog-300"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fog-100" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {(isOnboarding || hasShop) ? (
                <button
                  onClick={() => startCheckout(billingPeriod)}
                  disabled={loading !== null || loadingShop}
                  className="btn-pill mt-8 block w-full rounded-full border border-fog-100 py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-fog-100 hover:bg-fog-100 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading === billingPeriod ? "Redirecting…" : "Get started"}
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="btn-pill group mt-8 block w-full rounded-full border border-fog-100 py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-fog-100 hover:bg-fog-100 hover:text-black"
                >
                  Create an account
                </Link>
              )}
            </div>
          </ScrollReveal>

          {/* Error message */}
          {error && (
            <div className="mt-6 text-center text-[13px] font-light text-red-400">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          TRUST SIGNALS
          ============================================================ */}
      <section className="px-8 pb-12">
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { stat: "5 min", label: "to set up" },
              { stat: "0", label: "hardware needed" },
              { stat: "Any device", label: "works everywhere" },
              { stat: "Cancel", label: "anytime, no hassle" },
            ].map(({ stat, label }) => (
              <div key={label} className="rounded-xl border border-night-700 px-4 py-4 text-center">
                <p className="text-lg font-light tracking-tight text-fog-100">{stat}</p>
                <p className="mt-1 text-[11px] font-light text-fog-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          THE ECONOMICS
          ============================================================ */}
      <section className="px-8 py-24 sm:py-32">
        <Divider className="mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">THE MATH</p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
              One flat rate. No fine print.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-fog-500">
              Everything is in the $30/month &mdash; rewards, analytics, the customer list. Here&rsquo;s what that looks like when a customer comes back.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mt-14 rounded-2xl border border-night-700 bg-night-950 p-8 sm:p-10">
              {/* Stamp card visual */}
              <p className="text-[11px] font-light tracking-[0.3em] text-fog-500">EXAMPLE — 8 VISIT REWARD</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-fog-100 text-[13px] text-fog-100"
                  >
                    <Check className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-night-700 p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">RETURN VISITS DRIVEN</p>
                  <p className="mt-2 text-3xl font-light text-white">8</p>
                  <p className="mt-1 text-[12px] font-light text-fog-500">customers came back</p>
                </div>
                <div className="rounded-xl border border-night-700 p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">YOU PAY VENTZON</p>
                  <p className="mt-2 text-3xl font-light text-white">$30</p>
                  <p className="mt-1 text-[12px] font-light text-fog-500">per month, flat</p>
                </div>
                <div className="rounded-xl border border-night-700 p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">PER REDEMPTION</p>
                  <p className="mt-2 text-3xl font-light text-emerald-400">$0</p>
                  <p className="mt-1 text-[12px] font-light text-fog-500">no per-redemption fees</p>
                </div>
              </div>

              <p className="mt-8 text-[13px] font-light leading-[1.8] text-fog-500">
                Whether a customer redeems one reward or fifty, the price doesn&rsquo;t move. Paid ads and flyers can&rsquo;t say that.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          COMPARISON
          ============================================================ */}
      <section className="px-8 py-24 sm:py-32">
        <Divider className="mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">COMPARE</p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
              How Ventzon stacks up.
            </h2>
          </ScrollReveal>

          <div className="mt-16">
            <div className="grid grid-cols-[1fr_80px_80px_80px] items-end border-b border-night-700 pb-4 sm:grid-cols-[1fr_100px_100px_100px]">
              <div />
              <p className="text-center text-[11px] font-light tracking-[0.1em] text-fog-100">VENTZON</p>
              <p className="text-center text-[11px] font-light tracking-[0.1em] text-fog-500">SQUARE</p>
              <p className="text-center text-[11px] font-light tracking-[0.1em] text-fog-500">VISIT CARDS</p>
            </div>

            {[
              { feature: "Monthly fee", ventzon: "$30", square: "paid", punch: "$0" },
              { feature: "Per-redemption fees", ventzon: "$0", square: "included", punch: "$0" },
              { feature: "Customer data & analytics", ventzon: true, square: true, punch: false },
              { feature: "Digital stamp tracking", ventzon: true, square: true, punch: false },
              { feature: "Push notifications", ventzon: true, square: false, punch: false },
              { feature: "Works without a POS system", ventzon: true, square: false, punch: true },
              { feature: "Fraud-proof stamps", ventzon: true, square: true, punch: false },
            ].map((row) => (
              <ScrollReveal key={row.feature}>
                <div className="grid grid-cols-[1fr_80px_80px_80px] items-center border-b border-night-800 py-4 sm:grid-cols-[1fr_100px_100px_100px]">
                  <p className="text-[13px] font-light text-fog-300">{row.feature}</p>
                  <p className="text-center"><YesNoCell value={row.ventzon} /></p>
                  <p className="text-center"><YesNoCell value={row.square} dim /></p>
                  <p className="text-center"><YesNoCell value={row.punch} dim /></p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] font-light text-fog-600">
            Competitor plans and pricing change &mdash; check each vendor&rsquo;s current site.
          </p>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section className="px-8 py-24 sm:py-32">
        <Divider className="mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
              QUESTIONS
            </p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
              Frequently asked
            </h2>
          </ScrollReveal>

          <div className="mt-16 space-y-0">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i}>
                <div className="border-t border-night-900 py-8 lg:py-10">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
                    <h3 className="text-[15px] font-normal tracking-[0.02em] text-fog-100">
                      {faq.q}
                    </h3>
                    <p className="text-[14px] font-light leading-[1.8] text-fog-500">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
            <div className="border-t border-night-900" />
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="px-8 py-28 sm:py-36">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-light tracking-[0.01em] sm:text-4xl lg:text-5xl">
            Ready to grow?
          </h2>
          <p className="mt-6 text-base font-light leading-relaxed text-fog-500">
            Run your loyalty program on Ventzon
            <br className="hidden sm:block" />
            and get discovered by locals who actually show up.
          </p>
          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group btn-pill inline-flex items-center gap-3 rounded-full border border-fog-100 px-10 py-4 text-[13px] font-light tracking-[0.15em] text-fog-100 hover:bg-fog-100 hover:text-black"
            >
              Create your account
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
            <Link
              href="/how-it-works"
              className="text-[12px] font-light tracking-[0.15em] text-white/30 transition-colors duration-500 hover:text-white"
            >
              How it works
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <SiteFooter />
    </main>
  );
}

