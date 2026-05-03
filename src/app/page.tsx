import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* ============================================================
          SECTION 1 — HERO (full-screen video)
          ============================================================
          VIDEO SETUP:
          1. Place your video at  /public/hero.mp4  (or hero.webm)
          2. Place a fallback poster image at  /public/hero-poster.jpg
          3. The video plays on all devices (poster shown while loading)
          ============================================================ */}
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        {/* Background video (all devices including mobile) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-poster.jpg"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-3xl px-8 text-center">
          <h1 className="animate-fade-in anim-delay-200 text-5xl font-extralight tracking-[0.35em] text-white opacity-0 sm:text-6xl lg:text-7xl">
            VENTZON
          </h1>

          <p className="animate-fade-in anim-delay-600 mt-5 text-[13px] font-light tracking-[0.3em] text-white/70 opacity-0">
            Unbridled Loyalty
          </p>

          <div className="animate-fade-in-up anim-delay-1000 mt-16 flex flex-col items-center gap-4 opacity-0 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
            >
              Begin
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="text-[12px] font-light tracking-[0.15em] text-white/40 transition-colors duration-500 hover:text-white"
            >
              Discover how it works
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in anim-delay-1200 absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0">
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-[#444] to-transparent" />
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — VALUE PROPS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3">
          {[
            { title: "Effortless Check-ins", desc: "Customers scan, enter their contact, and they're in. Zero friction at the register." },
            { title: "Real-time Insights", desc: "See who visits, how often, and what keeps them coming back." },
            { title: "Built for Local", desc: "Designed from the ground up for independent businesses." },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <h3 className="text-lg font-extralight tracking-[0.15em] text-[#ededed]">
                {item.title}
              </h3>
              <p className="mt-3 text-[13px] font-light leading-relaxed text-[#666]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          SECTION 3 — HOW IT WORKS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              HOW IT WORKS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Three steps. Five minutes.
            </h2>
          </ScrollReveal>

          {/* Steps */}
          <div className="mt-20 space-y-24 lg:space-y-32">
            {/* ── Step 1 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
              <ScrollReveal>
                <div className="overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=900&q=80&auto=format&fit=crop"
                    alt="Warm cafe counter with ambient lighting"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-1000 hover:scale-[1.03]"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <p className="font-mono text-[12px] tracking-[0.3em] text-[#555]">
                  01
                </p>
                <h3 className="mt-5 text-2xl font-extralight tracking-[-0.01em] sm:text-3xl">
                  Print your QR code
                </h3>
                <p className="mt-5 text-base font-light leading-[1.8] text-[#888]">
                  Sign up, name your shop, set your reward. Print the loyalty
                  card and place it near your register.
                  Takes&nbsp;under&nbsp;five&nbsp;minutes.
                </p>
              </ScrollReveal>
            </div>

            {/* ── Step 2 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
              <ScrollReveal className="order-1 lg:order-2">
                <div className="overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1556742111-a301076d9d18?w=900&q=80&auto=format&fit=crop"
                    alt="Customer scanning phone at checkout"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-1000 hover:scale-[1.03]"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2} className="order-2 lg:order-1">
                <p className="font-mono text-[12px] tracking-[0.3em] text-[#555]">
                  02
                </p>
                <h3 className="mt-5 text-2xl font-extralight tracking-[-0.01em] sm:text-3xl">
                  Customers check in
                </h3>
                <p className="mt-5 text-base font-light leading-[1.8] text-[#888]">
                  They enter their phone number or email. One check-in per day
                  keeps it honest and simple.
                </p>
              </ScrollReveal>
            </div>

            {/* ── Step 3 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
              <ScrollReveal>
                <div className="overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80&auto=format&fit=crop"
                    alt="Artisan bakery display with warm lighting"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-1000 hover:scale-[1.03]"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <p className="font-mono text-[12px] tracking-[0.3em] text-[#555]">
                  03
                </p>
                <h3 className="mt-5 text-2xl font-extralight tracking-[-0.01em] sm:text-3xl">
                  They earn rewards via the app
                </h3>
                <p className="mt-5 text-base font-light leading-[1.8] text-[#888]">
                  After enough visits they unlock their reward in the app.
                  Push notifications keep them engaged. You set the goal,
                  you set the offer. It&rsquo;s that simple.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3b — CUSTOMER EXPERIENCE (Join page mock)
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              CUSTOMER EXPERIENCE
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              What your customers see.
            </h2>
            <p className="mt-5 text-[15px] font-light text-[#666]">
              A simple check-in page that works on any phone. Phone or email &mdash; no app, no account.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {/* ── Check-in form mock ── */}
            <ScrollReveal delay={1}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 sm:p-8 transition-all duration-500 hover:border-[#333]">
                <p className="mb-6 text-[10px] font-light tracking-[0.3em] text-[#444]">
                  CHECK-IN
                </p>

                {/* Shop avatar + name */}
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="text-xl font-extralight text-[#555]">S</span>
                  </div>
                  <p className="mt-4 text-[12px] font-light tracking-[0.3em] text-[#ededed]">
                    SUNRISE BAKERY
                  </p>

                  {/* Deal card */}
                  <div className="mt-5 rounded-lg border border-[#1a1a1a] px-5 py-3 text-center">
                    <p className="text-[13px] font-light text-[#888]">
                      Free pastry after 8 visits
                    </p>
                    <p className="mt-1 text-[11px] font-light text-[#555]">
                      Any pastry up to $6
                    </p>
                  </div>

                  {/* Contact method toggle mock */}
                  <div className="mt-8 w-full">
                    <div className="mb-4 flex items-center justify-center gap-1 rounded-full border border-[#1a1a1a] p-1">
                      <div className="flex-1 rounded-full bg-[#ededed] py-2 text-center text-[10px] font-light tracking-[0.15em] text-black">
                        PHONE
                      </div>
                      <div className="flex-1 rounded-full py-2 text-center text-[10px] font-light tracking-[0.15em] text-[#555]">
                        EMAIL
                      </div>
                    </div>
                    <p className="mb-2 text-[10px] font-light tracking-[0.2em] text-[#555]">
                      PHONE NUMBER
                    </p>
                    <div className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 text-center">
                      <span className="text-[16px] font-light tracking-[0.05em] text-[#ededed]">
                        (555) 123-4567
                      </span>
                    </div>
                  </div>

                  {/* Check in button */}
                  <div className="mt-5 w-full rounded-full border border-[#ededed] py-3.5 text-center text-[11px] font-light tracking-[0.2em] text-[#ededed]">
                    CHECK IN
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* ── Progress / reward result mock ── */}
            <ScrollReveal delay={2}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 sm:p-8 transition-all duration-500 hover:border-[#333]">
                <p className="mb-6 text-[10px] font-light tracking-[0.3em] text-[#444]">
                  AFTER CHECK-IN
                </p>

                <div className="flex flex-col items-center">
                  {/* Visit counter circle */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
                    <span className="font-mono text-[18px] font-light text-[#ededed]">
                      6
                    </span>
                  </div>

                  {/* Message */}
                  <p className="mt-5 text-[15px] font-extralight text-[#ededed]">
                    Checked in! 2 more to go.
                  </p>

                  {/* Progress dots */}
                  <div className="mt-6 flex items-center gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          i < 6
                            ? "bg-[#ededed]"
                            : "border border-[#333] bg-transparent"
                        }`}
                      >
                        {i < 6 && (
                          <Check className="h-2.5 w-2.5 text-black" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <p className="mt-4 text-[11px] font-light tracking-[0.1em] text-[#555]">
                    6/8 visits &middot; 2 to go
                  </p>

                  {/* Info */}
                  <p className="mt-3 text-[10px] font-light text-[#444]">
                    1 check-in per day &middot; Progress resets after redeem
                  </p>

                  {/* Divider */}
                  <div className="luxury-divider mx-auto my-6 max-w-[60px]" />

                  {/* Reward state preview */}
                  <div className="w-full rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-4 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-[13px] font-extralight text-emerald-300/80">
                      You earned your reward!
                    </p>
                    <p className="mt-2 text-[10px] font-light tracking-[0.15em] text-emerald-400/50">
                      SHOW THIS TO THE CASHIER
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/customer/explore"
              className="inline-flex items-center gap-3 text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-500 hover:text-[#ededed]"
            >
              Browse local shops
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4 — FEATURES (Why Ventzon)
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              WHY VENTZON
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Everything you need.
              <br className="hidden sm:block" />
              Nothing you don&rsquo;t.
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "No paper cards",
                desc: "Works with any phone camera. Customers track rewards in the app. Zero friction.",
              },
              {
                title: "Ready in five minutes",
                desc: "Sign up, name your shop, set your reward, print the QR. You\u2019re live.",
              },
              {
                title: "Push notifications",
                desc: "Rewards and milestones are delivered instantly via push. No algorithm, no noise.",
              },
              {
                title: "One check-in per day",
                desc: "Built-in fraud protection. Each customer checks in once every 24 hours.",
              },
              {
                title: "Track everything",
                desc: "Real-time dashboard shows signups, check-ins, and redemptions.",
              },
              {
                title: "Simple pricing",
                desc: "One plan: $25/month + $0.85 per reward redeemed. Pay only when your loyalty program works.",
              },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i < 3 ? 1 : 2}>
                <div className="border-b border-[#161616] px-2 py-10 lg:px-6">
                  <h3 className="text-[15px] font-normal tracking-[0.05em] text-[#ededed]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-[14px] font-light leading-[1.8] text-[#666]">
                    {feature.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4b — ANALYTICS DASHBOARD FEATURE
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left — Text */}
            <ScrollReveal>
              <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
                ANALYTICS
              </p>
              <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
                Know your customers.
              </h2>
              <p className="mt-6 text-[15px] font-light leading-[1.8] text-[#666]">
                See who&rsquo;s coming back, track check-ins over time, and
                measure reward redemptions &mdash; all in one dashboard.
              </p>
              <Link
                href="/signup"
                className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#333] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
              >
                View dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </ScrollReveal>

            {/* Right — Visual mock of the analytics charts */}
            <ScrollReveal delay={2}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 sm:p-8">
                {/* Mini chart header */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
                    CUSTOMER CHECK-INS
                  </p>
                  <div className="flex gap-1.5">
                    {["7d", "30d", "60d"].map((p) => (
                      <span
                        key={p}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-light ${
                          p === "30d"
                            ? "bg-[#ededed] text-black"
                            : "text-[#444]"
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SVG chart illustration */}
                <div className="mt-6 h-[140px] w-full">
                  <svg
                    viewBox="0 0 400 120"
                    className="h-full w-full"
                    preserveAspectRatio="none"
                  >
                    {/* Grid lines */}
                    {[0, 30, 60, 90].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="400"
                        y2={y}
                        stroke="#1a1a1a"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Area fill */}
                    <path
                      d="M0,100 C30,90 60,85 90,70 C120,55 150,60 180,45 C210,30 240,35 270,25 C300,15 330,20 360,10 C380,5 400,8 400,8 L400,120 L0,120 Z"
                      fill="url(#chartGrad)"
                      opacity="0.15"
                    />
                    {/* Line */}
                    <path
                      d="M0,100 C30,90 60,85 90,70 C120,55 150,60 180,45 C210,30 240,35 270,25 C300,15 330,20 360,10 C380,5 400,8 400,8"
                      fill="none"
                      stroke="#ededed"
                      strokeWidth="1.5"
                    />
                    <defs>
                      <linearGradient
                        id="chartGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#ededed" />
                        <stop offset="100%" stopColor="#ededed" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Mini stats row */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#1a1a1a] pt-5">
                  <div>
                    <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">
                      CHECK-INS
                    </p>
                    <p className="mt-1 text-2xl font-extralight text-white">
                      1,247
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">
                      REWARDS
                    </p>
                    <p className="mt-1 text-2xl font-extralight text-white">
                      83
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 5 — TESTIMONIALS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              VOICES
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Trusted by local businesses
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-16 md:grid-cols-3 md:gap-12">
            {[
              {
                quote:
                  "We went from paper punch cards to 200+ signups in our first month. Customers actually come back more often now.",
                name: "Maria Rodriguez",
                biz: "The Daily Grind",
              },
              {
                quote:
                  "The setup took me four minutes. I printed the QR, stuck it by the register, and had my first check-in within the hour.",
                name: "James Thompson",
                biz: "Fresh Cuts Barbershop",
              },
              {
                quote:
                  "My regulars love the rewards. They scan, they earn, they come back. It practically runs itself.",
                name: "Sarah Kim",
                biz: "Sunrise Bakery",
              },
            ].map((t, i) => (
              <ScrollReveal key={t.name} delay={i === 0 ? 1 : i === 1 ? 2 : 3}>
                <blockquote>
                  <p className="text-[15px] font-light leading-[1.9] text-[#999]">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <footer className="mt-8">
                    <div className="text-[13px] font-normal tracking-[0.05em] text-[#ededed]">
                      {t.name}
                    </div>
                    <div className="mt-1 text-[12px] font-light tracking-[0.1em] text-[#555]">
                      {t.biz}
                    </div>
                  </footer>
                </blockquote>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6 — PRICING
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              PRICING
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Start free. Upgrade anytime.
            </h2>
            <p className="mt-5 text-[15px] font-light text-[#666]">
              No commitment on the Free plan. Pay only when customers redeem.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {/* Free */}
            <ScrollReveal delay={1}>
              <div className="rounded-lg border border-[#1a1a1a] p-8 transition-colors duration-500 hover:border-[#333]">
                <p className="text-[12px] font-light tracking-[0.2em] text-[#666]">
                  FREE
                </p>
                <div className="mt-4 text-4xl font-extralight tracking-tight text-[#ededed]">
                  $0
                  <span className="text-lg font-light text-[#555]">/mo</span>
                </div>
                <p className="mt-3 text-[13px] font-light text-[#555]">
                  $1.25 per reward redeemed
                </p>
                <ul className="mt-8 space-y-4 text-[14px] font-light text-[#888]">
                  {[
                    "QR code + join page",
                    "Unlimited check-ins",
                    "Push notification rewards",
                    "Basic dashboard",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#444]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="mt-10 block rounded-full border border-[#333] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
                >
                  Get started free
                </Link>
              </div>
            </ScrollReveal>

            {/* Pro */}
            <ScrollReveal delay={2}>
              <div className="relative rounded-lg border border-[#2a2a2a] p-8 transition-colors duration-500 hover:border-[#444]">
                <div className="absolute -top-3 left-8 rounded-full bg-[#ededed] px-4 py-1 text-[10px] font-normal tracking-[0.2em] text-black">
                  RECOMMENDED
                </div>
                <p className="text-[12px] font-light tracking-[0.2em] text-[#666]">
                  PRO
                </p>
                <div className="mt-4 text-4xl font-extralight tracking-tight text-[#ededed]">
                  $19.99
                  <span className="text-lg font-light text-[#555]">/mo</span>
                </div>
                <ul className="mt-8 space-y-4 text-[14px] font-light text-[#888]">
                  {[
                    "Everything in Free",
                    "Custom reward goals",
                    "Analytics dashboard",
                    "Email campaigns",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ededed]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="mt-10 block rounded-full border border-[#ededed] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
                >
                  View Pro plan
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 7 — FINAL CTA
          ============================================================ */}
      <section className="px-8 py-28 sm:py-36">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Ready to begin?
          </h2>
          <p className="mt-6 text-base font-light leading-relaxed text-[#666]">
            Set up your rewards program in under five minutes.
            <br className="hidden sm:block" />
            No credit card required.
          </p>
          <Link
            href="/signup"
            className="mt-14 inline-flex items-center gap-3 rounded-full border border-[#ededed] px-10 py-4 text-[13px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
          >
            Create your account
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </ScrollReveal>
      </section>

      {/* ============================================================
          SECTION 8 — FOOTER
          ============================================================ */}
      <SiteFooter />
    </main>
  );
}
