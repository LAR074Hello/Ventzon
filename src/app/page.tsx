import Link from "next/link";
import {
  QrCode,
  Smartphone,
  MessageSquare,
  Zap,
  Shield,
  TrendingUp,
  CreditCard,
  Check,
  ArrowRight,
  Star,
} from "lucide-react";
import AnimatedStats from "@/components/AnimatedStats";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* ============================================================
          SECTION 1 — HERO
          ============================================================ */}
      <section className="relative overflow-hidden px-6 py-28 sm:py-36">
        {/* Animated background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-glow-pulse absolute left-1/2 top-[-160px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="animate-glow-pulse absolute right-[-200px] top-[100px] h-[400px] w-[400px] rounded-full bg-emerald-500/8 blur-3xl [animation-delay:2s]" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Copy */}
            <div>
              <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/60 px-4 py-1.5 text-xs tracking-wide text-neutral-300">
                <MessageSquare className="h-3.5 w-3.5" />
                SMS-based loyalty rewards
              </div>

              <h1 className="animate-fade-in-up anim-delay-100 mt-8 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Turn every visit into a lasting relationship.
              </h1>

              <p className="animate-fade-in-up anim-delay-200 mt-6 max-w-xl text-lg leading-relaxed text-neutral-300">
                The simplest loyalty program for local businesses. Customers
                scan your QR code, check in with their phone number, and earn
                rewards via SMS. No app download. Ready in 5 minutes.
              </p>

              <div className="animate-fade-in-up anim-delay-300 mt-10 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="rounded-xl border border-neutral-700 px-6 py-3 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-900"
                >
                  See how it works
                </Link>
              </div>
            </div>

            {/* Right — Floating phone mockup */}
            <div className="animate-fade-in-up anim-delay-400 flex justify-center lg:justify-end">
              <div className="animate-float">
                <div className="rounded-[2.5rem] border border-neutral-700 bg-neutral-900 p-3 shadow-2xl shadow-neutral-950/80">
                  <div className="w-[260px] rounded-[2rem] bg-white px-6 py-8 text-center">
                    {/* Notch */}
                    <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-stone-200" />
                    {/* Logo circle */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200">
                      <span className="text-lg font-semibold text-stone-400">B</span>
                    </div>
                    {/* Store name */}
                    <div className="mt-3 text-sm font-medium tracking-widest text-stone-800">
                      BREW HOUSE
                    </div>
                    {/* Phone input */}
                    <div className="mt-8 border border-stone-300 px-4 py-3.5 text-left text-xs text-stone-400">
                      (555) 123-4567
                    </div>
                    {/* Check in button */}
                    <div className="mt-4 bg-stone-900 py-3.5 text-xs font-medium tracking-widest text-white">
                      CHECK IN
                    </div>
                    {/* Fine print */}
                    <div className="mt-5 text-[8px] leading-relaxed text-stone-400">
                      By checking in you agree to receive
                      <br />
                      SMS messages. Reply STOP to opt out.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — STATS / SOCIAL PROOF BAR
          ============================================================ */}
      <section className="border-t border-neutral-800 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <AnimatedStats />
        </div>
      </section>

      {/* ============================================================
          SECTION 3 — PRODUCT DEMO — "See it in action"
          ============================================================ */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              THE PRODUCT
            </div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              See it in action
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
              From a printed QR card at your register to a real-time dashboard
              on your phone — here&rsquo;s what you and your customers get.
            </p>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {/* Mockup A: The QR Loyalty Card */}
            <div className="animate-fade-in-up anim-delay-100">
              <div className="mx-auto flex aspect-[2/3] w-full max-w-[240px] flex-col items-center justify-between rounded-xl border border-neutral-800 bg-stone-50 px-6 py-8 shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-light tracking-[0.2em] text-stone-800">
                    BREW HOUSE
                  </div>
                </div>
                <div className="flex h-28 w-28 items-center justify-center rounded border border-stone-200 bg-white">
                  <QrCode className="h-20 w-20 text-stone-300" />
                </div>
                <div className="text-[8px] tracking-[0.15em] text-stone-500">
                  POWERED BY VENTZON REWARDS
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-neutral-400">
                Print-ready loyalty card
              </div>
            </div>

            {/* Mockup B: Customer check-in (phone frame) */}
            <div className="animate-fade-in-up anim-delay-300">
              <div className="mx-auto max-w-[240px]">
                <div className="rounded-[2rem] border border-neutral-700 bg-neutral-900 p-2.5 shadow-xl">
                  <div className="rounded-[1.5rem] bg-white p-5 text-center">
                    <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-stone-200" />
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200">
                      <span className="text-base font-semibold text-stone-400">B</span>
                    </div>
                    <div className="mt-2 text-xs font-medium tracking-widest text-stone-800">
                      BREW HOUSE
                    </div>
                    <div className="mt-5 border border-stone-300 px-3 py-2.5 text-left text-[10px] text-stone-400">
                      (555) 123-4567
                    </div>
                    <div className="mt-3 bg-stone-900 py-2.5 text-[10px] font-medium tracking-widest text-white">
                      CHECK IN
                    </div>
                    <div className="mt-3 text-[7px] leading-relaxed text-stone-400">
                      By checking in you agree to receive SMS messages.
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-neutral-400">
                Customer check-in page
              </div>
            </div>

            {/* Mockup C: Merchant Dashboard */}
            <div className="animate-fade-in-up anim-delay-500">
              <div className="mx-auto max-w-[280px] rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-xl">
                <div className="text-[9px] tracking-[0.35em] text-neutral-500">
                  VENTZON REWARDS
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-100">
                  Merchant Dashboard
                </div>
                {/* Stat cards */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-[9px] text-neutral-500">Total signups</div>
                    <div className="mt-1 text-xl font-semibold text-white">247</div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    <div className="text-[9px] text-neutral-500">Today</div>
                    <div className="mt-1 text-xl font-semibold text-white">12</div>
                  </div>
                </div>
                {/* QR section */}
                <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="text-[9px] text-neutral-500">Join link (QR)</div>
                  <div className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded bg-white">
                    <QrCode className="h-12 w-12 text-stone-300" />
                  </div>
                  <div className="mt-2 rounded bg-neutral-950 px-2 py-1 text-center font-mono text-[8px] text-neutral-400">
                    ventzon.com/join/brew-house
                  </div>
                </div>
                {/* Recent signups */}
                <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  <div className="text-[9px] text-neutral-500">Latest signups</div>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { phone: "***-***-4521", time: "2m ago" },
                      { phone: "***-***-8834", time: "15m ago" },
                      { phone: "***-***-2201", time: "1h ago" },
                    ].map((r) => (
                      <div key={r.phone} className="flex justify-between text-[9px]">
                        <span className="font-mono text-neutral-300">{r.phone}</span>
                        <span className="text-neutral-500">{r.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-neutral-400">
                Real-time merchant dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — HOW IT WORKS (premium photo-driven)
          ============================================================ */}
      <section className="border-t border-neutral-800 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              HOW IT WORKS
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Three steps. Five minutes. Done.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-400">
              No complicated setup, no app downloads, no learning curve.
              Here&rsquo;s how Ventzon works for you and your customers.
            </p>
          </ScrollReveal>

          {/* Steps */}
          <div className="mt-20 space-y-28 lg:space-y-36">
            {/* ── Step 1 ── */}
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <ScrollReveal>
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80&auto=format&fit=crop"
                    alt="Retail store checkout counter with QR code display"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <div className="font-mono text-sm tracking-widest text-neutral-500">
                  01
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Print your QR code
                </h3>
                <p className="mt-4 text-base leading-relaxed text-neutral-400">
                  Sign up, name your shop, set your reward. Print the loyalty
                  card and place it near your register. Takes under 5&nbsp;minutes.
                </p>
              </ScrollReveal>
            </div>

            {/* ── Step 2 ── */}
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <ScrollReveal className="order-1 lg:order-2">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80&auto=format&fit=crop"
                    alt="Customer using their phone to check in"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2} className="order-2 lg:order-1">
                <div className="font-mono text-sm tracking-widest text-neutral-500">
                  02
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Customers check in
                </h3>
                <p className="mt-4 text-base leading-relaxed text-neutral-400">
                  They enter their phone number. One check-in per day keeps it
                  fair and simple.
                </p>
              </ScrollReveal>
            </div>

            {/* ── Step 3 ── */}
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <ScrollReveal>
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop"
                    alt="Small business owner smiling behind the counter"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <div className="font-mono text-sm tracking-widest text-neutral-500">
                  03
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                  They earn rewards via SMS
                </h3>
                <p className="mt-4 text-base leading-relaxed text-neutral-400">
                  After enough visits they get a text with their reward. You set
                  the goal, you set the offer. It&rsquo;s that simple.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5 — FEATURES (Why Ventzon)
          ============================================================ */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              WHY VENTZON
            </div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Everything you need. Nothing you don&rsquo;t.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: "No app download",
                desc: "Works with any phone camera and SMS. Zero friction — customers scan and check in in seconds.",
                delay: "anim-delay-100",
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Ready in 5 minutes",
                desc: "Sign up, name your shop, set your reward, print the QR. Your loyalty program is live.",
                delay: "anim-delay-200",
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: "SMS — the direct channel",
                desc: "Messages go straight to your customers. No algorithm, no middleman, no noise.",
                delay: "anim-delay-300",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "One check-in per day",
                desc: "Built-in fraud protection. Each customer can only check in once every 24 hours per shop.",
                delay: "anim-delay-400",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Track everything",
                desc: "Real-time dashboard shows signups, check-ins, and reward redemptions as they happen.",
                delay: "anim-delay-500",
              },
              {
                icon: <CreditCard className="h-6 w-6" />,
                title: "Simple, flat pricing",
                desc: "$49.99/month. No hidden fees, no per-message charges. Cancel anytime.",
                delay: "anim-delay-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`animate-fade-in-up ${feature.delay} group rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-700 bg-white/5 text-neutral-400 transition-colors group-hover:text-white">
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-base font-medium">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6 — TESTIMONIALS
          ============================================================ */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              WHAT MERCHANTS SAY
            </div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Trusted by local businesses everywhere
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                initials: "MR",
                gradient: "from-amber-600 to-orange-500",
                quote:
                  "We went from handing out paper punch cards to getting 200+ signups in our first month. Customers actually come back more often now.",
                name: "Maria Rodriguez",
                biz: "The Daily Grind",
                type: "Coffee Shop",
                delay: "anim-delay-100",
              },
              {
                initials: "JT",
                gradient: "from-emerald-600 to-teal-500",
                quote:
                  "The setup took me literally 4 minutes. I printed the QR, stuck it by the register, and had my first check-in within the hour.",
                name: "James Thompson",
                biz: "Fresh Cuts Barbershop",
                type: "Barber",
                delay: "anim-delay-300",
              },
              {
                initials: "SK",
                gradient: "from-violet-600 to-purple-500",
                quote:
                  "My regulars love the SMS rewards. They feel like VIPs without having to download yet another app on their phone.",
                name: "Sarah Kim",
                biz: "Sunrise Bakery",
                type: "Bakery",
                delay: "anim-delay-500",
              },
            ].map((t) => (
              <div
                key={t.name}
                className={`animate-fade-in-up ${t.delay} rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6`}
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                {/* Quote */}
                <p className="mt-4 text-sm leading-relaxed text-neutral-300">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-xs font-semibold text-white`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-neutral-500">
                      {t.biz} &middot; {t.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7 — PRICING
          ============================================================ */}
      <section className="border-t border-neutral-800 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              PRICING
            </div>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              One plan. Everything included.
            </h2>
            <p className="mt-3 text-neutral-400">
              No hidden fees. No per-message charges. Cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
              <div className="text-lg font-medium">Monthly</div>
              <div className="mt-2 text-4xl font-semibold">
                $49.99
                <span className="text-lg font-normal text-neutral-400">
                  /mo
                </span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                {[
                  "QR code + join page",
                  "Unlimited customer check-ins",
                  "Custom rewards & SMS templates",
                  "Real-time merchant dashboard",
                  "Cancel anytime",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl border border-neutral-700 py-3 text-center text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-900"
              >
                Get started
              </Link>
            </div>

            {/* Yearly — highlighted */}
            <div className="relative rounded-2xl border border-emerald-700/40 bg-neutral-950/40 p-6 shadow-lg shadow-emerald-500/5">
              <div className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-white">
                MOST POPULAR
              </div>
              <div className="text-lg font-medium">Yearly</div>
              <div className="mt-2 text-4xl font-semibold">
                $479.99
                <span className="text-lg font-normal text-neutral-400">
                  /yr
                </span>
              </div>
              <div className="mt-1 text-sm text-emerald-400">
                Save $120/year
              </div>
              <ul className="mt-6 space-y-3 text-sm text-neutral-300">
                {[
                  "Everything in Monthly",
                  "2 months free",
                  "Priority support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-xl bg-white py-3 text-center text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 8 — FINAL CTA
          ============================================================ */}
      <section className="relative overflow-hidden border-t border-neutral-800 px-6 py-24">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-glow-pulse absolute left-1/3 top-0 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="animate-glow-pulse absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-emerald-500/8 blur-3xl [animation-delay:2s]" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Ready to turn first-timers into regulars?
          </h2>
          <p className="mt-4 text-neutral-300">
            Set up your SMS rewards program in under 5 minutes. No credit card
            required.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
          >
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============================================================
          SECTION 9 — FOOTER
          ============================================================ */}
      <footer className="border-t border-neutral-800 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-xs tracking-[0.25em] text-neutral-500">
            VENTZON
          </div>
          <div className="flex gap-6 text-sm text-neutral-500">
            <Link href="/how-it-works" className="hover:text-neutral-300">
              How it works
            </Link>
            <Link href="/pricing" className="hover:text-neutral-300">
              Pricing
            </Link>
            <Link href="/privacy-policy" className="hover:text-neutral-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-neutral-300">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
