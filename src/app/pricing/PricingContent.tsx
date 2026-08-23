// src/app/pricing/PricingContent.tsx
"use client";

import { safeJson } from "@/lib/safe-json";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, X, Trophy, ArrowRight } from "lucide-react";
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

export default function PricingContent({ shopFromQuery }: { shopFromQuery: string }) {
  const supabase = createSupabaseBrowserClient();

  const [shop, setShop] = useState(shopFromQuery);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loadingShop, setLoadingShop] = useState(!shopFromQuery);
  // A signed-in merchant is the only visitor who gets the shop context
  // bar (their shop, or a "create a shop" prompt). Anonymous visitors see
  // neither that bar nor any loading state.
  const [knownUser, setKnownUser] = useState(false);
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState("");

  const hasShop = shop.length > 0;

  // Auto-detect the logged-in user's shop if no ?shop= param. With a shop in
  // the URL, loadingShop already starts false — nothing to set here.
  useEffect(() => {
    if (shopFromQuery) return;

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
  }, [shopFromQuery, supabase]);

  // Load shop name for display
  useEffect(() => {
    if (!shop) return;
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
  }, [shop, supabase]);

  async function startCheckout(plan: "monthly" | "yearly") {
    if (!hasShop) {
      setError("No shop found. Please create a shop first.");
      return;
    }

    setLoading(plan);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
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
      {shopFromQuery && (
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
          {loadingShop ? null : hasShop ? (
            <div className="animate-fade-in rounded-2xl border border-night-700 px-6 py-4 text-center">
              <span className="text-[13px] font-light text-fog-500">Subscribing for </span>
              <span className="text-[13px] font-normal tracking-[0.05em] text-fog-100">
                {shopName || shop}
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
              {hasShop ? (
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
          DASHBOARD PREVIEW
          ============================================================ */}
      <section className="px-8 py-24 sm:py-32">
        <Divider className="mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">
              DASHBOARD
            </p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
              See what you get.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-fog-500">
              Real-time stats and analytics charts &mdash; all in one place.
            </p>
            <p className="mt-3 text-[11px] font-light tracking-[0.25em] text-fog-600">
              EXAMPLE SCREEN &middot; SAMPLE DATA
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div className="mt-14 rounded-2xl border border-night-700 bg-night-950 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-night-700 pb-5">
                <div>
                  <p className="text-[11px] font-light tracking-[0.5em] text-fog-500">MERCHANT DASHBOARD</p>
                  <p className="mt-2 text-xl font-light tracking-[-0.01em] text-white sm:text-2xl">Sunrise Bakery</p>
                </div>
                <span className="rounded-full border border-white/10 px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-fog-300">
                  SAMPLE DATA
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-night-700 px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">TOTAL SIGNUPS</p>
                  <p className="mt-2 text-3xl font-light tracking-tight text-white">1,247</p>
                </div>
                <div className="rounded-xl border border-night-700 px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">TODAY</p>
                  <p className="mt-2 text-3xl font-light tracking-tight text-white">23</p>
                </div>
                <div className="rounded-xl border border-night-700 px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">REWARD GOAL</p>
                  <p className="mt-2 text-3xl font-light tracking-tight text-white">8</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-light tracking-[0.2em] text-fog-500">ANALYTICS</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-night-700 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-light tracking-[0.15em] text-fog-500">CUSTOMER CHECK-INS</p>
                      <div className="flex gap-1">
                        {["7d", "30d", "60d"].map((p) => (
                          <span
                            key={p}
                            className={`rounded-full px-2 py-0.5 text-[9px] font-light ${
                              p === "30d" ? "bg-fog-100 text-black" : "text-fog-600"
                            }`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 h-[120px]">
                      <svg viewBox="0 0 400 100" className="h-full w-full" preserveAspectRatio="none">
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1a1a1a" strokeWidth="1" />
                        ))}
                        <path
                          d="M0,85 C25,80 50,75 75,68 C100,60 125,65 150,52 C175,40 200,45 225,35 C250,25 275,30 300,20 C325,14 350,17 375,10 C390,7 400,9 400,9 L400,100 L0,100 Z"
                          fill="url(#pricingGrad)"
                          opacity="0.12"
                        />
                        <path
                          d="M0,85 C25,80 50,75 75,68 C100,60 125,65 150,52 C175,40 200,45 225,35 C250,25 275,30 300,20 C325,14 350,17 375,10 C390,7 400,9 400,9"
                          fill="none"
                          stroke="#ededed"
                          strokeWidth="1.5"
                        />
                        <circle cx="375" cy="10" r="3" fill="#ededed" stroke="#050505" strokeWidth="2" />
                        <defs>
                          <linearGradient id="pricingGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ededed" />
                            <stop offset="100%" stopColor="#ededed" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-xl border border-night-700 p-5">
                    <p className="text-[10px] font-light tracking-[0.15em] text-fog-500">REWARDS REDEEMED</p>
                    <div className="mt-3 h-[120px]">
                      <svg viewBox="0 0 400 100" className="h-full w-full" preserveAspectRatio="none">
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1a1a1a" strokeWidth="1" />
                        ))}
                        {[
                          { x: 8, h: 20 }, { x: 38, h: 32 }, { x: 68, h: 24 }, { x: 98, h: 45 },
                          { x: 128, h: 38 }, { x: 158, h: 55 }, { x: 188, h: 42 }, { x: 218, h: 50 },
                          { x: 248, h: 65 }, { x: 278, h: 48 }, { x: 308, h: 72 }, { x: 338, h: 58 },
                          { x: 368, h: 68 },
                        ].map((bar, i) => (
                          <rect
                            key={i}
                            x={bar.x}
                            y={100 - bar.h}
                            width="18"
                            height={bar.h}
                            rx="2"
                            fill="#ededed"
                            opacity={0.5 + (i / 25)}
                          />
                        ))}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-night-700 p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">CUSTOMER LIST</p>
                  <div className="mt-3 rounded-lg border border-night-800 bg-night-900 px-4 py-3">
                    <p className="text-[10px] font-light tracking-[0.2em] text-fog-600">SAMPLE</p>
                    <p className="mt-1.5 font-mono text-[11px] font-light text-fog-300">
                      customer@example.com &middot; 7 stamps &middot; Last visit: today
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-night-700 p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-fog-500">PUSH NOTIFICATION</p>
                  <div className="mt-3 rounded-lg border border-night-800 bg-night-900 px-4 py-3">
                    <p className="text-[10px] font-light tracking-[0.2em] text-fog-600">PREVIEW</p>
                    <p className="mt-1.5 font-mono text-[11px] font-light text-fog-300">
                      <Trophy className="mr-1.5 inline h-3 w-3 -translate-y-px" />
                      Reward earned! You&apos;ve earned your reward at Sunrise Bakery. Show the app at the register.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
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

