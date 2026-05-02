// src/app/pricing/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const freeFeatures = [
  "QR code + join page",
  "Unlimited customer check-ins",
  "Push notification rewards",
  "Basic merchant dashboard",
  "Cancel anytime",
];

const proFeatures = [
  "Everything in Free",
  "Custom reward goal (2–12 visits)",
  "Analytics dashboard",
  "Customer list & CSV export",
  "Manual stamp tool",
  "Email campaigns",
];

const comparisonRows = [
  { feature: "QR code + join page", free: true, pro: true },
  { feature: "Unlimited customer check-ins", free: true, pro: true },
  { feature: "Push notification rewards", free: true, pro: true },
  { feature: "Basic merchant dashboard", free: true, pro: true },
  { feature: "Custom reward goal (2–12 visits)", free: false, pro: true },
  { feature: "Analytics dashboard", free: false, pro: true },
  { feature: "Customer list & CSV export", free: false, pro: true },
  { feature: "Manual stamp tool", free: false, pro: true },
  { feature: "Email campaigns", free: false, pro: true },
];

const faqs = [
  {
    q: "How does the Free plan work?",
    a: "The Free plan costs $0 per month. You only pay $0.85 per reward redeemed by a customer — no upfront cost, no commitment. You get the core loyalty tools to get started.",
  },
  {
    q: "What does the $25/month cover on Pro?",
    a: "The $25 operational fee covers your full Pro suite — analytics, customer list, CSV export, manual stamp tool, and email campaigns. You still pay $0.85 per redemption on top of that.",
  },
  {
    q: "How do customers get notified?",
    a: "Customers who install the Ventzon app receive push notifications when they earn rewards or are close to earning one. No SMS required.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade or downgrade anytime from your merchant dashboard.",
  },
  {
    q: "What happens if I cancel?",
    a: "Your shop stays active until the end of your billing period. No data is deleted.",
  },
];

/* ------------------------------------------------------------------ */
/*  Pricing content (needs Suspense for useSearchParams)               */
/* ------------------------------------------------------------------ */

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const shopFromQuery = (searchParams.get("shop") || "").trim();

  const [shop, setShop] = useState(shopFromQuery);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loadingShop, setLoadingShop] = useState(!shopFromQuery);
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [error, setError] = useState("");

  const hasShop = shop.length > 0;

  // Auto-detect the logged-in user's shop if no ?shop= param
  useEffect(() => {
    if (shopFromQuery) {
      setLoadingShop(false);
      return;
    }

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoadingShop(false);
          return;
        }

        const { data: shops } = await supabase
          .from("shops")
          .select("slug, id")
          .eq("user_id", userData.user.id)
          .limit(1);

        if (shops && shops.length > 0) {
          setShop((shops[0] as any).slug);
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
        if (data && (data as any).shop_name) {
          setShopName((data as any).shop_name);
        }
      } catch {}
    })();
  }, [shop, supabase]);

  async function startCheckout(plan: "monthly" | "yearly" | "free") {
    if (!hasShop) {
      setError("No shop found. Please create a shop first.");
      return;
    }

    setLoading(plan as any);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-[#ededed]">

      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-8 pt-24">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="animate-fade-in anim-delay-200 text-[11px] font-light tracking-[0.5em] text-[#666] opacity-0">
            PRICING
          </p>

          <h1 className="animate-fade-in anim-delay-400 mt-8 text-4xl font-extralight tracking-[-0.02em] text-white opacity-0 sm:text-5xl lg:text-6xl">
            Simple pricing.{" "}
            <br className="hidden sm:block" />
            Pay for what works.
          </h1>

          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-[#888] opacity-0 sm:text-lg">
            Start free with no monthly fee &mdash; or go Pro for the full suite.
            <br className="hidden sm:block" />
            Either way, you only pay $0.85 when a customer redeems their reward.
          </p>
        </div>
      </section>

      {/* ============================================================
          ONBOARDING STEP INDICATOR (shown when coming from get-started)
          ============================================================ */}
      {shopFromQuery && (
        <section className="px-8 pb-4">
          <div className="mx-auto flex max-w-4xl items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#333]">
                <span className="text-[11px] font-light text-[#555]">1</span>
              </div>
              <span className="text-[11px] font-light tracking-[0.1em] text-[#555]">Name your shop</span>
            </div>
            <div className="h-[1px] w-6 bg-[#555]" />
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ededed]">
                <span className="text-[11px] font-normal text-black">2</span>
              </div>
              <span className="text-[11px] font-light tracking-[0.1em] text-[#ededed]">Choose a plan</span>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          SHOP CONTEXT BAR
          ============================================================ */}
      <section className="px-8">
        <div className="mx-auto max-w-4xl">
          {loadingShop ? (
            <div className="animate-fade-in rounded-2xl border border-[#1a1a1a] px-6 py-4 text-center text-[13px] font-light text-[#555]">
              Finding your shop…
            </div>
          ) : hasShop ? (
            <div className="animate-fade-in rounded-2xl border border-[#1a1a1a] px-6 py-4 text-center">
              <span className="text-[13px] font-light text-[#555]">
                Subscribing for{" "}
              </span>
              <span className="text-[13px] font-normal tracking-[0.05em] text-[#ededed]">
                {shopName || shop}
              </span>
            </div>
          ) : (
            <div className="animate-fade-in rounded-2xl border border-[#1a1a1a] px-8 py-8 text-center">
              <p className="text-[15px] font-light text-[#888]">
                No shop found. Create your shop first, then come back to pick a
                plan.
              </p>
              <a
                href="/get-started"
                className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
              >
                Create a shop
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          PLAN CARDS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">

          {/* ── Free Plan ── */}
          <ScrollReveal delay={1}>
            <div className="group flex h-full flex-col rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333] sm:p-10">
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                FREE
              </p>

              <div className="mt-6">
                <span className="text-5xl font-extralight tracking-tight text-[#ededed]">
                  $0
                </span>
                <span className="ml-1 text-lg font-light text-[#444]">
                  /mo
                </span>
              </div>

              <p className="mt-4 text-[14px] font-light leading-[1.7] text-[#555]">
                $0.85 per reward redeemed.
                <br />
                No monthly commitment.
              </p>

              {/* Divider */}
              <div className="my-8 h-[1px] bg-[#1a1a1a]" />

              {/* Features */}
              <ul className="flex-1 space-y-4">
                {freeFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] font-light text-[#888]"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#444]" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {hasShop ? (
                <button
                  onClick={() => startCheckout("free")}
                  disabled={loading !== null || loadingShop}
                  className="mt-10 block w-full rounded-full border border-[#333] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading === ("free" as any) ? "Redirecting\u2026" : "Get started free"}
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="mt-10 block w-full rounded-full border border-[#333] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
                >
                  Get started free
                </Link>
              )}
            </div>
          </ScrollReveal>

          {/* ── Pro Plan (recommended) ── */}
          <ScrollReveal delay={2}>
            <div className="group relative flex h-full flex-col rounded-2xl border border-[#2a2a2a] p-8 transition-all duration-500 hover:border-[#444] sm:p-10">
              {/* Badge */}
              <div className="absolute -top-3 left-8 rounded-full bg-[#ededed] px-4 py-1 text-[10px] font-normal tracking-[0.2em] text-black sm:left-10">
                RECOMMENDED
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                  PRO
                </p>
                {/* Billing period toggle */}
                <div className="flex items-center rounded-full border border-[#2a2a2a] p-0.5">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`rounded-full px-3 py-1 text-[10px] font-light tracking-[0.1em] transition-all duration-300 ${
                      billingPeriod === "monthly"
                        ? "bg-[#ededed] text-black"
                        : "text-[#555] hover:text-[#888]"
                    }`}
                  >
                    MONTHLY
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`rounded-full px-3 py-1 text-[10px] font-light tracking-[0.1em] transition-all duration-300 ${
                      billingPeriod === "yearly"
                        ? "bg-[#ededed] text-black"
                        : "text-[#555] hover:text-[#888]"
                    }`}
                  >
                    YEARLY
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <span className="text-5xl font-extralight tracking-tight text-[#ededed]">
                  {billingPeriod === "yearly" ? "$240" : "$25"}
                </span>
                <span className="ml-1 text-lg font-light text-[#444]">
                  {billingPeriod === "yearly" ? "/yr" : "/mo"}
                </span>
              </div>

              {billingPeriod === "yearly" && (
                <p className="mt-2 text-[11px] font-light tracking-[0.05em] text-emerald-500">
                  Save $60 vs monthly — that&apos;s 2 months free
                </p>
              )}

              <p className="mt-4 text-[14px] font-light leading-[1.7] text-[#555]">
                $0.85 per reward redeemed.
                <br />
                Full suite &mdash; analytics, tools &amp; more.
              </p>

              {/* Divider */}
              <div className="my-8 h-[1px] bg-[#1a1a1a]" />

              {/* Features */}
              <ul className="flex-1 space-y-4">
                {proFeatures.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[14px] font-light text-[#888]"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ededed]" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA — more prominent */}
              <button
                onClick={() => startCheckout(billingPeriod)}
                disabled={!hasShop || loading !== null || loadingShop}
                className="mt-8 block w-full rounded-full border border-[#ededed] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading === billingPeriod
                  ? "Redirecting…"
                  : hasShop
                  ? "Get started"
                  : "Create a shop first"}
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-auto mt-8 max-w-4xl text-center text-[13px] font-light text-red-400">
            {error}
          </div>
        )}
      </section>

      {/* ============================================================
          DASHBOARD PREVIEW — Visual mock of what merchants get
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              DASHBOARD
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              See what you get.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-[#666]">
              Real-time stats and analytics charts &mdash;
              all in one place.
            </p>
          </ScrollReveal>

          {/* Dashboard mock container */}
          <ScrollReveal>
            <div className="mt-14 rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 sm:p-8">
              {/* Mock header */}
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-5">
                <div>
                  <p className="text-[11px] font-light tracking-[0.5em] text-[#555]">MERCHANT DASHBOARD</p>
                  <p className="mt-2 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">Sunrise Bakery</p>
                </div>
                <span className="rounded-full border border-emerald-800/50 px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-emerald-400">
                  Active
                </span>
              </div>

              {/* Stats cards row */}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#1a1a1a] px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#555]">TOTAL SIGNUPS</p>
                  <p className="mt-2 text-3xl font-extralight tracking-tight text-white">1,247</p>
                </div>
                <div className="rounded-xl border border-[#1a1a1a] px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#555]">TODAY</p>
                  <p className="mt-2 text-3xl font-extralight tracking-tight text-white">23</p>
                </div>
                <div className="rounded-xl border border-[#1a1a1a] px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#555]">REWARD GOAL</p>
                  <p className="mt-2 text-3xl font-extralight tracking-tight text-white">8</p>
                </div>
              </div>

              {/* Analytics charts — PRO badge */}
              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">ANALYTICS</p>
                  <span className="rounded-full bg-[#ededed] px-2.5 py-0.5 text-[9px] font-normal tracking-[0.15em] text-black">PRO</span>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {/* Check-ins line chart */}
                  <div className="rounded-xl border border-[#1a1a1a] p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-light tracking-[0.15em] text-[#555]">CUSTOMER CHECK-INS</p>
                      <div className="flex gap-1">
                        {["7d", "30d", "60d"].map((p) => (
                          <span
                            key={p}
                            className={`rounded-full px-2 py-0.5 text-[9px] font-light ${
                              p === "30d" ? "bg-[#ededed] text-black" : "text-[#444]"
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

                  {/* Rewards bar chart */}
                  <div className="rounded-xl border border-[#1a1a1a] p-5">
                    <p className="text-[10px] font-light tracking-[0.15em] text-[#555]">REWARDS REDEEMED</p>
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

              {/* Push notification preview row */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#1a1a1a] p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#555]">CUSTOMER LIST</p>
                  <div className="mt-3 rounded-lg border border-[#111] bg-[#0a0a0a] px-4 py-3">
                    <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">SAMPLE</p>
                    <p className="mt-1.5 font-mono text-[11px] font-light text-[#888]">
                      customer@example.com · 7 stamps · Last visit: today
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#1a1a1a] p-5">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#555]">PUSH NOTIFICATION</p>
                  <div className="mt-3 rounded-lg border border-[#111] bg-[#0a0a0a] px-4 py-3">
                    <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">PREVIEW</p>
                    <p className="mt-1.5 font-mono text-[11px] font-light text-[#888]">
                      🏆 Reward earned! You've earned your reward at Sunrise Bakery. Show the app at the register.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          FEATURE COMPARISON — Clean table
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              COMPARE
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              What&rsquo;s included
            </h2>
          </ScrollReveal>

          <div className="mt-16">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px] items-end border-b border-[#1a1a1a] pb-4 sm:grid-cols-[1fr_100px_100px]">
              <div />
              <p className="text-center text-[11px] font-light tracking-[0.15em] text-[#555]">
                FREE
              </p>
              <p className="text-center text-[11px] font-light tracking-[0.15em] text-[#555]">
                PRO
              </p>
            </div>

            {/* Rows */}
            {comparisonRows.map((row) => (
              <ScrollReveal key={row.feature}>
                <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-[#111] py-5 sm:grid-cols-[1fr_100px_100px]">
                  <p className="text-[14px] font-light text-[#888]">
                    {row.feature}
                  </p>
                  <div className="flex justify-center">
                    {row.free ? (
                      <Check className="h-4 w-4 text-[#555]" />
                    ) : (
                      <span className="text-[13px] text-[#333]">—</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {row.pro ? (
                      <Check className="h-4 w-4 text-[#ededed]" />
                    ) : (
                      <span className="text-[13px] text-[#333]">—</span>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}

            {/* Pricing row */}
            <ScrollReveal>
              <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-[#111] py-5 sm:grid-cols-[1fr_100px_100px]">
                <p className="text-[14px] font-light text-[#888]">
                  Monthly cost
                </p>
                <div className="flex justify-center">
                  <span className="text-[13px] font-light text-[#888]">$0</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[13px] font-light text-[#ededed]">$25/mo</span>
                  <span className="text-[11px] font-light text-[#555]">or $240/yr</span>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-[#111] py-5 sm:grid-cols-[1fr_100px_100px]">
                <p className="text-[14px] font-light text-[#888]">
                  Per reward redeemed
                </p>
                <div className="flex justify-center">
                  <span className="text-[13px] font-light text-[#888]">$0.85</span>
                </div>
                <div className="flex justify-center">
                  <span className="text-[13px] font-light text-[#ededed]">$0.85</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              QUESTIONS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Frequently asked
            </h2>
          </ScrollReveal>

          <div className="mt-16 space-y-0">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i}>
                <div className="border-t border-[#161616] py-8 lg:py-10">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1.5fr] lg:gap-12">
                    <h3 className="text-[15px] font-normal tracking-[0.02em] text-[#ededed]">
                      {faq.q}
                    </h3>
                    <p className="text-[14px] font-light leading-[1.8] text-[#666]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
            <div className="border-t border-[#161616]" />
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="px-8 py-28 sm:py-36">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Ready to grow?
          </h2>
          <p className="mt-6 text-base font-light leading-relaxed text-[#666]">
            Join hundreds of local businesses using Ventzon
            <br className="hidden sm:block" />
            to turn one-time buyers into loyal regulars.
          </p>
          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full border border-[#ededed] px-10 py-4 text-[13px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
            >
              Create your account
              <ArrowRight className="h-3.5 w-3.5" />
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

/* ------------------------------------------------------------------ */
/*  Page wrapper (Suspense boundary for useSearchParams)               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
