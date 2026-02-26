// src/app/pricing/page.tsx
"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const freeFeatures = [
  "QR code + join page",
  "Unlimited customer check-ins",
  "SMS reward notifications",
  "Basic merchant dashboard",
  "Cancel anytime",
];

const proFeatures = [
  "Everything in Free",
  "Custom reward goal (2–12 visits)",
  "Custom SMS messages",
  "Analytics dashboard",
  "Promotional texting ($0.04/customer)",
];

const comparisonRows = [
  { feature: "QR code + join page", free: true, pro: true },
  { feature: "Unlimited customer check-ins", free: true, pro: true },
  { feature: "SMS reward notifications", free: true, pro: true },
  { feature: "Basic merchant dashboard", free: true, pro: true },
  { feature: "Custom reward goal (2–12 visits)", free: false, pro: true },
  { feature: "Custom SMS messages", free: false, pro: true },
  { feature: "Analytics dashboard", free: false, pro: true },
  { feature: "Promotional texting", free: false, pro: true },
];

const faqs = [
  {
    q: "How does the Free plan work?",
    a: "The Free plan costs $0 per month. You only pay $1 per reward redeemed by a customer. No upfront cost, no commitment.",
  },
  {
    q: "What does promotional texting cost?",
    a: "On the Pro plan, you can text your opted-in customer list at $0.04 per customer per promo. Example: texting 500 customers costs $20.",
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
            Start free.{" "}
            <br className="hidden sm:block" />
            Grow when you&rsquo;re ready.
          </h1>

          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-[#888] opacity-0 sm:text-lg">
            No commitment on the Free plan &mdash; pay only when customers redeem.
            <br className="hidden sm:block" />
            Upgrade to Pro for the full suite.
          </p>
        </div>
      </section>

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
                $1 per reward redeemed.
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
              <Link
                href="/signup"
                className="mt-10 block w-full rounded-full border border-[#333] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
              >
                Get started free
              </Link>
            </div>
          </ScrollReveal>

          {/* ── Pro Plan (recommended) ── */}
          <ScrollReveal delay={2}>
            <div className="group relative flex h-full flex-col rounded-2xl border border-[#2a2a2a] p-8 transition-all duration-500 hover:border-[#444] sm:p-10">
              {/* Badge */}
              <div className="absolute -top-3 left-8 rounded-full bg-[#ededed] px-4 py-1 text-[10px] font-normal tracking-[0.2em] text-black sm:left-10">
                RECOMMENDED
              </div>

              <div className="flex items-center gap-3">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                  PRO
                </p>
              </div>

              <div className="mt-6">
                <span className="text-5xl font-extralight tracking-tight text-[#ededed]">
                  $19
                </span>
                <span className="ml-1 text-lg font-light text-[#444]">
                  /mo
                </span>
              </div>

              <p className="mt-4 text-[14px] font-light leading-[1.7] text-[#555]">
                Everything in Free, plus analytics,
                <br />
                custom SMS &amp; promo texting.
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

              {/* Promo texting example */}
              <div className="mt-6 rounded-xl bg-white/[0.03] px-5 py-3">
                <p className="text-[12px] font-light text-[#666]">
                  Example: text 500 customers = $20
                </p>
              </div>

              {/* CTA — more prominent */}
              <button
                onClick={() => startCheckout("monthly")}
                disabled={!hasShop || loading !== null || loadingShop}
                className="mt-8 block w-full rounded-full border border-[#ededed] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading === "monthly"
                  ? "Redirecting…"
                  : hasShop
                  ? "Start free trial"
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
                <div className="flex justify-center">
                  <span className="text-[13px] font-light text-[#ededed]">$19</span>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-[#111] py-5 sm:grid-cols-[1fr_100px_100px]">
                <p className="text-[14px] font-light text-[#888]">
                  Per reward redeemed
                </p>
                <div className="flex justify-center">
                  <span className="text-[13px] font-light text-[#888]">$1</span>
                </div>
                <div className="flex justify-center">
                  <span className="text-[13px] font-light text-[#ededed]">$0</span>
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
      <footer className="px-8 pb-12 pt-16">
        <div className="luxury-divider mx-auto mb-10 max-w-xs" />
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-[11px] font-light tracking-[0.4em] text-[#444]">
            VENTZON
          </div>
          <div className="flex gap-8 text-[12px] font-light tracking-[0.1em] text-[#444]">
            <Link
              href="/how-it-works"
              className="transition-colors duration-300 hover:text-[#999]"
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              className="transition-colors duration-300 hover:text-[#999]"
            >
              Pricing
            </Link>
            <Link
              href="/privacy-policy"
              className="transition-colors duration-300 hover:text-[#999]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors duration-300 hover:text-[#999]"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
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
