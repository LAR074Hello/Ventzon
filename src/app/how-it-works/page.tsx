// src/app/how-it-works/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";
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
    title: "Enter your phone number",
    body: "Your phone number ties visits to that shop. No account creation, no passwords — just your number.",
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
    value: "\u2191",
    note: "A visible goal nudges customers to come back sooner to finish the punch card.",
  },
  {
    label: "Basket size",
    value: "\u2191",
    note: "Customers who feel close to earning often add an item or choose your shop over another.",
  },
  {
    label: "Direct channel",
    value: "SMS",
    note: "Promos go straight to the customer \u2014 not an algorithm. Opt-in only, always.",
  },
];

const goodToKnow = [
  "A customer is linked to a shop by phone number \u2014 the same phone can join multiple shops.",
  "No account creation needed \u2014 customers just use their phone number to check in.",
  "One check-in per day per shop prevents spam and keeps it fair.",
];

/* ------------------------------------------------------------------ */
/*  Animated progress bar for benefit stats                            */
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
            Scan a QR, enter your phone number, check in once per day,
            and redeem when you hit the shop&rsquo;s goal. Simple for customers,
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
          THE THREE STEPS — Cinematic image-driven storytelling
          ============================================================ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-8">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              THREE STEPS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Print. Scan. Reward.
            </h2>
          </ScrollReveal>
        </div>

        {/* ── Step 1 — Print your QR code ── */}
        <div className="mt-20 space-y-32 lg:space-y-40">
          <div className="mx-auto max-w-6xl px-8">
            <ScrollReveal>
              <div className="overflow-hidden rounded-2xl">
                {/* SWAP IMAGE: replace src with your own photo URL or drop file into /public/howitworks/step1.jpg */}
                <img
                  src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1400&q=80&auto=format&fit=crop"
                  alt="Coffee shop counter with register and menu boards"
                  className="aspect-[21/9] w-full object-cover transition-transform duration-1000 hover:scale-[1.02]"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="mt-10 grid items-end gap-6 lg:grid-cols-[auto_1fr_1fr]">
                <p className="font-mono text-[48px] font-extralight leading-none tracking-tight text-[#1a1a1a] sm:text-[64px]">
                  01
                </p>
                <div>
                  <h3 className="text-2xl font-extralight tracking-[-0.01em] text-white sm:text-3xl">
                    Print your QR code
                  </h3>
                  <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#666]">
                    Sign up, name your shop, and set your reward. We generate a
                    unique QR code &mdash; print it and place it by the register.
                    The entire setup takes under five minutes.
                  </p>
                </div>
                <div className="hidden lg:block" />
              </div>
            </ScrollReveal>
          </div>

          {/* ── Step 2 — Customer checks in ── */}
          <div className="mx-auto max-w-6xl px-8">
            <ScrollReveal>
              <div className="overflow-hidden rounded-2xl">
                {/* SWAP IMAGE: replace src with your own photo URL or drop file into /public/howitworks/step2.jpg */}
                <img
                  src="https://images.unsplash.com/photo-1556742077-0a6b6a4a4ac4?w=1400&q=80&auto=format&fit=crop"
                  alt="Person using their smartphone in a retail store"
                  className="aspect-[21/9] w-full object-cover transition-transform duration-1000 hover:scale-[1.02]"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="mt-10 grid items-end gap-6 lg:grid-cols-[auto_1fr_1fr]">
                <p className="font-mono text-[48px] font-extralight leading-none tracking-tight text-[#1a1a1a] sm:text-[64px]">
                  02
                </p>
                <div>
                  <h3 className="text-2xl font-extralight tracking-[-0.01em] text-white sm:text-3xl">
                    Customers check in
                  </h3>
                  <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#666]">
                    Customers scan the QR with their phone camera, enter their
                    number, and they&rsquo;re checked in. One tap per day &mdash;
                    no app download, no account to create.
                  </p>
                </div>
                <div className="hidden lg:block" />
              </div>
            </ScrollReveal>
          </div>

          {/* ── Step 3 — They earn rewards ── */}
          <div className="mx-auto max-w-6xl px-8">
            <ScrollReveal>
              <div className="overflow-hidden rounded-2xl">
                {/* SWAP IMAGE: replace src with your own photo URL or drop file into /public/howitworks/step3.jpg */}
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&q=80&auto=format&fit=crop"
                  alt="Happy small business owner smiling at camera"
                  className="aspect-[21/9] w-full object-cover transition-transform duration-1000 hover:scale-[1.02]"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal>
              <div className="mt-10 grid items-end gap-6 lg:grid-cols-[auto_1fr_1fr]">
                <p className="font-mono text-[48px] font-extralight leading-none tracking-tight text-[#1a1a1a] sm:text-[64px]">
                  03
                </p>
                <div>
                  <h3 className="text-2xl font-extralight tracking-[-0.01em] text-white sm:text-3xl">
                    They earn rewards
                  </h3>
                  <p className="mt-4 text-[15px] font-light leading-[1.8] text-[#666]">
                    When a customer hits the visit goal you set, they receive an
                    SMS with their reward. They show it at checkout and redeem
                    instantly. The counter resets and the cycle continues.
                  </p>
                </div>
                <div className="hidden lg:block" />
              </div>
            </ScrollReveal>
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
                  Customers use their phone camera and SMS. That&rsquo;s it. No
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
                  entire experience takes seconds &mdash; not minutes.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR CUSTOMERS — Detailed steps
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
            {customerSteps.map((step) => (
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
            <div className="border-t border-[#161616]" />
          </div>
        </div>
      </section>

      {/* ============================================================
          CUSTOMER EXPERIENCE — Join page visual mock
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              THE CHECK-IN PAGE
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              What your customers see.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-[#666]">
              A clean, fast page that works on any phone.
              No app to download, no account to create.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {/* ── State 1: Check-in form ── */}
            <ScrollReveal delay={1}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="mb-5 text-[10px] font-light tracking-[0.3em] text-[#444]">
                  STEP 1 &mdash; CHECK IN
                </p>

                <div className="flex flex-col items-center">
                  {/* Shop avatar */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="text-lg font-extralight text-[#555]">S</span>
                  </div>
                  <p className="mt-3 text-[11px] font-light tracking-[0.3em] text-[#ededed]">
                    SUNRISE BAKERY
                  </p>

                  {/* Deal */}
                  <div className="mt-4 w-full rounded-lg border border-[#1a1a1a] px-4 py-2.5 text-center">
                    <p className="text-[12px] font-light text-[#888]">
                      Free pastry after 8 visits
                    </p>
                  </div>

                  {/* Phone input */}
                  <div className="mt-6 w-full">
                    <p className="mb-1.5 text-[9px] font-light tracking-[0.2em] text-[#555]">
                      PHONE NUMBER
                    </p>
                    <div className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-3 text-center">
                      <span className="text-[15px] font-light tracking-[0.05em] text-[#ededed]">
                        (555) 123-4567
                      </span>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="mt-4 w-full rounded-full border border-[#ededed] py-3 text-center text-[10px] font-light tracking-[0.2em] text-[#ededed]">
                    CHECK IN
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* ── State 2: Progress ── */}
            <ScrollReveal delay={2}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="mb-5 text-[10px] font-light tracking-[0.3em] text-[#444]">
                  STEP 2 &mdash; PROGRESS
                </p>

                <div className="flex flex-col items-center">
                  {/* Visit counter */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="font-mono text-[18px] font-light text-[#ededed]">6</span>
                  </div>

                  <p className="mt-4 text-[14px] font-extralight text-[#ededed]">
                    Checked in! 2 more to go.
                  </p>

                  {/* Progress dots */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          i < 6 ? "bg-[#ededed]" : "border border-[#333] bg-transparent"
                        }`}
                      >
                        {i < 6 && (
                          <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] font-light tracking-[0.1em] text-[#555]">
                    6/8 visits &middot; 2 to go
                  </p>

                  <p className="mt-2 text-[10px] font-light text-[#444]">
                    1 check-in per day
                  </p>

                  {/* Done button */}
                  <div className="mt-6 w-full rounded-full border border-[#ededed] py-3 text-center text-[10px] font-light tracking-[0.2em] text-[#ededed]">
                    DONE
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* ── State 3: Reward earned ── */}
            <ScrollReveal delay={3}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="mb-5 text-[10px] font-light tracking-[0.3em] text-[#444]">
                  STEP 3 &mdash; REWARD
                </p>

                <div className="flex flex-col items-center">
                  {/* Reward icon */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                    <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  <p className="mt-4 text-[14px] font-extralight text-[#ededed]">
                    You earned your reward!
                  </p>

                  {/* Full progress dots */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ededed]"
                      >
                        <svg className="h-2.5 w-2.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] font-light tracking-[0.1em] text-[#555]">
                    8/8 visits
                  </p>

                  {/* Redeem banner */}
                  <div className="mt-5 w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-center">
                    <p className="text-[10px] font-light tracking-[0.15em] text-emerald-300/80">
                      SHOW THIS TO THE CASHIER
                    </p>
                  </div>

                  {/* Done button */}
                  <div className="mt-5 w-full rounded-full border border-[#ededed] py-3 text-center text-[10px] font-light tracking-[0.2em] text-[#ededed]">
                    DONE
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOR MERCHANTS — Detailed steps
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
            {merchantSteps.map((step) => (
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
            <div className="border-t border-[#161616]" />
          </div>
        </div>
      </section>

      {/* ============================================================
          YOUR DASHBOARD — Visual mock of the merchant dashboard
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              YOUR DASHBOARD
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Everything at a glance.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[15px] font-light text-[#666]">
              Track signups, check-ins, and rewards in real time.
              Customize your SMS messages. All from one dashboard.
            </p>
          </ScrollReveal>

          {/* ── Stats cards mock ── */}
          <ScrollReveal>
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">TOTAL SIGNUPS</p>
                <div className="mt-3 text-4xl font-extralight tracking-tight text-white">1,247</div>
                <p className="mt-2 text-[12px] font-light text-[#444]">All time</p>
              </div>
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">TODAY</p>
                <div className="mt-3 text-4xl font-extralight tracking-tight text-white">23</div>
                <p className="mt-2 text-[12px] font-light text-[#444]">New York time</p>
              </div>
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">REWARD GOAL</p>
                <div className="mt-3 text-4xl font-extralight tracking-tight text-white">8</div>
                <p className="mt-2 text-[12px] font-light text-[#444]">Visits to earn reward</p>
              </div>
            </div>
          </ScrollReveal>

          {/* ── Analytics charts mock ── */}
          <ScrollReveal>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Check-ins line chart */}
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">CUSTOMER CHECK-INS</p>
                  <div className="flex gap-1.5">
                    {["7d", "30d", "60d"].map((p) => (
                      <span
                        key={p}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-light ${
                          p === "30d" ? "bg-[#ededed] text-black" : "text-[#444]"
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 h-[180px]">
                  <svg viewBox="0 0 400 140" className="h-full w-full" preserveAspectRatio="none">
                    {[0, 35, 70, 105, 140].map((y) => (
                      <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1a1a1a" strokeWidth="1" />
                    ))}
                    <path
                      d="M0,120 C20,115 40,110 60,100 C80,90 100,95 120,85 C140,75 160,80 180,65 C200,50 220,55 240,45 C260,35 280,40 300,30 C320,22 340,25 360,18 C380,12 400,15 400,15 L400,140 L0,140 Z"
                      fill="url(#mockGrad1)"
                      opacity="0.12"
                    />
                    <path
                      d="M0,120 C20,115 40,110 60,100 C80,90 100,95 120,85 C140,75 160,80 180,65 C200,50 220,55 240,45 C260,35 280,40 300,30 C320,22 340,25 360,18 C380,12 400,15 400,15"
                      fill="none"
                      stroke="#ededed"
                      strokeWidth="1.5"
                    />
                    <circle cx="300" cy="30" r="3" fill="#ededed" stroke="#000" strokeWidth="2" />
                    <defs>
                      <linearGradient id="mockGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ededed" />
                        <stop offset="100%" stopColor="#ededed" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* X axis labels */}
                    <text x="0" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 1</text>
                    <text x="95" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 8</text>
                    <text x="195" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 15</text>
                    <text x="295" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 22</text>
                    <text x="375" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 30</text>
                  </svg>
                </div>
              </div>

              {/* Rewards bar chart */}
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">REWARDS REDEEMED</p>
                <div className="mt-4 h-[180px]">
                  <svg viewBox="0 0 400 140" className="h-full w-full" preserveAspectRatio="none">
                    {[0, 35, 70, 105, 140].map((y) => (
                      <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#1a1a1a" strokeWidth="1" />
                    ))}
                    {/* Bar chart bars */}
                    {[
                      { x: 10, h: 25 }, { x: 40, h: 40 }, { x: 70, h: 30 }, { x: 100, h: 55 },
                      { x: 130, h: 45 }, { x: 160, h: 70 }, { x: 190, h: 50 }, { x: 220, h: 65 },
                      { x: 250, h: 80 }, { x: 280, h: 60 }, { x: 310, h: 90 }, { x: 340, h: 75 },
                      { x: 370, h: 85 },
                    ].map((bar, i) => (
                      <rect
                        key={i}
                        x={bar.x}
                        y={140 - bar.h}
                        width="18"
                        height={bar.h}
                        rx="3"
                        fill="#ededed"
                        opacity={0.6 + (i / 20)}
                      />
                    ))}
                    {/* X axis labels */}
                    <text x="0" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 1</text>
                    <text x="95" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 8</text>
                    <text x="195" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 15</text>
                    <text x="295" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 22</text>
                    <text x="375" y="155" fill="#555" fontSize="9" fontWeight="300">Jan 30</text>
                  </svg>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* ── SMS preview mock ── */}
          <ScrollReveal>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">WELCOME TEXT</p>
                <div className="mt-4 rounded-xl border border-[#111] bg-[#0a0a0a] px-4 py-3">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">PREVIEW</p>
                  <p className="mt-2 whitespace-pre-wrap font-mono text-[12px] font-light text-[#888]">
                    Welcome to Sunrise Bakery Rewards! Reply STOP to opt out. Your deal: Free pastry after 8 visits
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">REWARD EARNED TEXT</p>
                <div className="mt-4 rounded-xl border border-[#111] bg-[#0a0a0a] px-4 py-3">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">PREVIEW</p>
                  <p className="mt-2 whitespace-pre-wrap font-mono text-[12px] font-light text-[#888]">
                    You earned your reward at Sunrise Bakery! Show this text to redeem: Free pastry after 8 visits
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
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
              Loyalty isn&rsquo;t just discounts &mdash; it&rsquo;s behavior shaping.
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
                matches your purchase cycle &mdash; coffee shops 5&ndash;10 visits, salons
                2&ndash;5, etc.
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
      <SiteFooter />
    </main>
  );
}
