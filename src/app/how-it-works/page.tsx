// src/app/how-it-works/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const customerSteps = [
  {
    number: "01",
    title: "Scan the shop QR",
    body: "Use your phone camera to scan the QR code at checkout. No app download needed — it just works.",
  },
  {
    number: "02",
    title: "Enter phone + 6-digit PIN",
    body: "Your phone ties visits to that shop. Your 6-digit PIN lets you check in later — no account login required.",
  },
  {
    number: "03",
    title: "Check in once per day",
    body: "To keep it fair, each customer can only check in once per day per shop. Simple and transparent.",
  },
  {
    number: "04",
    title: "Hit the goal, redeem",
    body: "When you reach the shop's visit goal, you'll get a redeem message via SMS. Show it to the cashier.",
  },
  {
    number: "05",
    title: "Progress resets after redeem",
    body: "After redeeming, your visit counter resets so you can start earning again. The cycle continues.",
  },
];

const merchantSteps = [
  {
    number: "01",
    title: "Set your reward",
    body: "Choose the reward title, details, and pick the visits goal (2–31). Make it something customers actually want.",
  },
  {
    number: "02",
    title: "Print + place the QR",
    body: "Put the QR near checkout so people can scan while paying. Takes under five minutes to set up.",
  },
  {
    number: "03",
    title: "Customize texts",
    body: "Edit the messages customers get for progress updates and redemption confirmations. Make it yours.",
  },
  {
    number: "04",
    title: "Send promos (optional)",
    body: "Message your opted-in customer list when you want to drive traffic. Direct SMS — no algorithm in the way.",
  },
];

const benefits = [
  {
    label: "Repeat visits",
    value: "↑",
    note: "A visible goal nudges customers to come back sooner to finish the punch card.",
  },
  {
    label: "Basket size",
    value: "↑",
    note: "Customers who feel close to earning often add an item or choose your shop over another.",
  },
  {
    label: "Direct channel",
    value: "SMS",
    note: "Promos go straight to the customer — not an algorithm. Opt-in only, always.",
  },
];

const goodToKnow = [
  "A customer is linked to a shop by phone number — the same phone can join multiple shops.",
  "The 6-digit PIN is for quick re-check-ins. No account creation needed.",
  "One check-in per day per shop prevents spam and keeps it fair.",
];

/* ------------------------------------------------------------------ */
/*  Animated number component for benefit stats                        */
/* ------------------------------------------------------------------ */

function ProgressBar({ started }: { started: boolean }) {
  return (
    <div className="relative h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/40 to-white/20 transition-all duration-[2000ms] ease-out"
        style={{ width: started ? "100%" : "0%" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HowItWorksPage() {
  const benefitsRef = useRef<HTMLDivElement>(null);
  const [benefitsVisible, setBenefitsVisible] = useState(false);

  useEffect(() => {
    if (!benefitsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setBenefitsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(benefitsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-black text-[#ededed]">

      {/* ============================================================
          HERO — Full-viewport cinematic opener
          ============================================================ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-8">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="animate-fade-in anim-delay-200 text-[11px] font-light tracking-[0.5em] text-[#666] opacity-0">
            VENTZON REWARDS
          </p>

          <h1 className="animate-fade-in anim-delay-400 mt-8 text-4xl font-extralight tracking-[-0.02em] text-white opacity-0 sm:text-5xl lg:text-6xl">
            A loyalty program{" "}
            <br className="hidden sm:block" />
            customers actually use.
          </h1>

          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-[#888] opacity-0 sm:text-lg">
            Scan a QR, enter your phone + a 6-digit PIN, check in once per day,
            and redeem when you hit the shop's goal. Simple for customers,
            valuable for merchants.
          </p>

          <div className="animate-fade-in-up anim-delay-800 mt-14 flex flex-col items-center gap-4 opacity-0 sm:flex-row sm:justify-center">
            <Link
              href="/merchant/dashboard"
              className="inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
            >
              Merchant dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="text-[12px] font-light tracking-[0.15em] text-white/40 transition-colors duration-500 hover:text-white"
            >
              View pricing
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in anim-delay-1200 absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0">
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-[#444] to-transparent" />
        </div>
      </section>

      {/* ============================================================
          QUICK BENEFITS — Two feature cards
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <ScrollReveal delay={1}>
              <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-colors duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                  ZERO FRICTION
                </p>
                <h3 className="mt-4 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
                  No apps to download
                </h3>
                <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#666]">
                  Customers use their phone camera and SMS. That's it. No
                  downloads, no sign-ups, no passwords to remember.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={2}>
              <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-colors duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                  BUILT FOR SPEED
                </p>
                <h3 className="mt-4 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
                  Designed for checkout
                </h3>
                <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#666]">
                  One scan, one check-in per day, one redemption text. The
                  entire experience takes seconds — not minutes.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR CUSTOMERS — Scroll-based storytelling
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              FOR CUSTOMERS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Earn rewards in seconds.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-[#666]">
              Fast check-ins and a clear redeem text to show at the register.
              No apps, no hassle.
            </p>
          </ScrollReveal>

          <div className="mt-20 space-y-0">
            {customerSteps.map((step, i) => (
              <ScrollReveal key={step.title}>
                <div className="group grid items-start gap-8 border-t border-[#161616] py-12 transition-colors duration-500 hover:border-[#333] lg:grid-cols-[80px_1fr_1.5fr] lg:gap-12 lg:py-16">
                  <p className="font-mono text-[13px] tracking-[0.3em] text-[#333] transition-colors duration-500 group-hover:text-[#666]">
                    {step.number}
                  </p>
                  <h3 className="text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="text-[15px] font-light leading-[1.8] text-[#666]">
                    {step.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
            {/* Final border */}
            <div className="border-t border-[#161616]" />
          </div>
        </div>
      </section>

      {/* ============================================================
          VISUAL BREAK — Large typographic statement
          ============================================================ */}
      <section className="px-8 py-28 sm:py-36">
        <ScrollReveal className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-extralight leading-[1.3] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
            Scan. Check in. Redeem.
            <br />
            <span className="text-[#444]">That&rsquo;s the whole experience.</span>
          </h2>
        </ScrollReveal>
      </section>

      {/* ============================================================
          FOR MERCHANTS — Scroll-based storytelling
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              FOR MERCHANTS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Set it up in five minutes.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-[#666]">
              Set the goal, customize the texts, and optionally run promos.
              Everything else is automatic.
            </p>
          </ScrollReveal>

          <div className="mt-20 space-y-0">
            {merchantSteps.map((step, i) => (
              <ScrollReveal key={step.title}>
                <div className="group grid items-start gap-8 border-t border-[#161616] py-12 transition-colors duration-500 hover:border-[#333] lg:grid-cols-[80px_1fr_1.5fr] lg:gap-12 lg:py-16">
                  <p className="font-mono text-[13px] tracking-[0.3em] text-[#333] transition-colors duration-500 group-hover:text-[#666]">
                    {step.number}
                  </p>
                  <h3 className="text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="text-[15px] font-light leading-[1.8] text-[#666]">
                    {step.body}
                  </p>
                </div>
              </ScrollReveal>
            ))}
            {/* Final border */}
            <div className="border-t border-[#161616]" />
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY THIS HELPS — Benefit stats with progress bars
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              THE IMPACT
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Why this helps shop owners
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-[#666]">
              Loyalty isn't just discounts — it's behavior shaping.
            </p>
          </ScrollReveal>

          <div ref={benefitsRef} className="mt-16 grid gap-6 md:grid-cols-3">
            {benefits.map((b, i) => (
              <ScrollReveal key={b.label} delay={i === 0 ? 1 : i === 1 ? 2 : 3}>
                <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-colors duration-500 hover:border-[#333]">
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                    {b.label.toUpperCase()}
                  </p>
                  <div className="mt-4 text-4xl font-extralight tracking-tight text-white">
                    {b.value}
                  </div>
                  <div className="mt-5">
                    <ProgressBar started={benefitsVisible} />
                  </div>
                  <p className="mt-5 text-[14px] font-light leading-[1.8] text-[#666]">
                    {b.note}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Tip */}
          <ScrollReveal>
            <div className="mt-10 rounded-2xl border border-[#1a1a1a] p-8">
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                PRO TIP
              </p>
              <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#666]">
                Keep the reward simple (free item or % off) and set a goal that
                matches your purchase cycle — coffee shops 5–10 visits, salons
                2–5, etc.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          GOOD TO KNOW — Clean FAQ-style section
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              DETAILS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Good to know
            </h2>
          </ScrollReveal>

          <div className="mt-16 space-y-0">
            {goodToKnow.map((item, i) => (
              <ScrollReveal key={i}>
                <div className="border-t border-[#161616] py-8 lg:py-10">
                  <div className="grid items-start gap-4 lg:grid-cols-[40px_1fr]">
                    <p className="font-mono text-[13px] tracking-[0.2em] text-[#333]">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="text-[15px] font-light leading-[1.8] text-[#888]">
                      {item}
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
            Ready to begin?
          </h2>
          <p className="mt-6 text-base font-light leading-relaxed text-[#666]">
            Set up your SMS rewards program in under five minutes.
            <br className="hidden sm:block" />
            No credit card required.
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
              href="/how-it-works#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-[12px] font-light tracking-[0.15em] text-white/30 transition-colors duration-500 hover:text-white"
            >
              Back to top
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================================
          FOOTER (matches landing page)
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
