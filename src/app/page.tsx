import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Ventzon",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "iOS, Web",
      "url": "https://www.ventzon.com",
      "description": "Digital loyalty rewards program for local businesses. Replace paper punch cards with QR code check-ins, real-time analytics, and push notifications.",
      "offers": {
        "@type": "Offer",
        "price": "25.00",
        "priceCurrency": "USD",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": "25.00",
          "priceCurrency": "USD",
          "unitText": "MONTH"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "42"
      }
    },
    {
      "@type": "Organization",
      "name": "Ventzon",
      "url": "https://www.ventzon.com",
      "logo": "https://www.ventzon.com/ventzoncompanylogo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@ventzon.com",
        "contactType": "customer support"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much does Ventzon cost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "$25/month or $240/year. Plus $0.85 per reward redeemed. No hardware required, cancel anytime."
          }
        },
        {
          "@type": "Question",
          "name": "Do customers need to download an app?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Customers can check in by scanning a QR code and entering their phone number or email — no app download required. The Ventzon app is available for customers who want push notifications and to track their rewards."
          }
        },
        {
          "@type": "Question",
          "name": "What kind of businesses use Ventzon?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Restaurants, coffee shops, cafes, salons, barbershops, retail stores, and any local business that wants to reward repeat customers."
          }
        },
        {
          "@type": "Question",
          "name": "How do I set up Ventzon for my business?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sign up at ventzon.com, create your shop, choose a stamp card or a points program, set your reward goal, and print your QR code. The whole process takes about 5 minutes."
          }
        },
        {
          "@type": "Question",
          "name": "Does Ventzon do stamp cards or points?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Both. You can run a classic stamp card (a reward after N visits) or a points program where each visit earns points toward a larger reward goal — with your own earn rate. Either way, customers check themselves in by scanning a QR code and entering their phone or email. There's no cashier step and no dollar amount to enter."
          }
        }
      ]
    }
  ]
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-8 text-center">
          <h1 className="animate-fade-in anim-delay-200 text-5xl font-extralight tracking-[0.35em] text-white opacity-0 sm:text-6xl lg:text-7xl">
            VENTZON
          </h1>

          <p className="animate-fade-in anim-delay-600 mt-5 text-[13px] font-light tracking-[0.3em] text-white/70 opacity-0">
            Know Your Customers
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
              href="/demo"
              className="text-[12px] font-light tracking-[0.15em] text-white/40 transition-colors duration-500 hover:text-white"
            >
              See a live demo
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
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 sm:grid-cols-3">
          {[
            { title: "Customer Intelligence", desc: "Understand who your customers are, when they come back, and who's about to stop." },
            { title: "Delivered as Loyalty", desc: "Customers scan to earn rewards. You get rich behavioral data — without them thinking twice." },
            { title: "Built for Local", desc: "No enterprise contract. No data team required. Just answers." },
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
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              HOW IT WORKS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              A loyalty program on the surface.<br className="hidden sm:block" />A data engine underneath.
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
                  Sign up, name your shop, and pick your reward — a classic
                  stamp card or a points program. Print the QR card and place it
                  near your register. Takes under five minutes — and from that
                  moment, every visit becomes a data point.
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
                  They enter their phone or email to earn their next stamp.
                  To them, it&rsquo;s a punch card. To you, it&rsquo;s a growing
                  picture of exactly who walks through your door.
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
                  After enough visits they unlock their reward. Push
                  notifications bring them back. And your dashboard tells
                  you who your loyal customers are, who&rsquo;s drifting, and
                  what&rsquo;s actually working.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 3b — CUSTOMER EXPERIENCE (Join page mock)
          ============================================================ */}
      <section className="px-4 sm:px-8 py-20 sm:py-28">
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
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              WHY VENTZON
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Built to learn.<br className="hidden sm:block" />Designed to look simple.
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
                title: "Stamps or points",
                desc: "Run a classic punch card, or a points program with your own earn rate and reward goal. Both are self check-in — no cashier, no dollar entry.",
              },
              {
                title: "Track everything",
                desc: "Busiest days, peak hours, new vs. returning, customer lifetime, redemption rate, and who's at risk of churning — all in one dashboard.",
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
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left — Text */}
            <ScrollReveal>
              <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
                CUSTOMER INTELLIGENCE
              </p>
              <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
                The loyalty card is the door.<br />The analytics is the point.
              </h2>
              <p className="mt-6 text-[15px] font-light leading-[1.8] text-[#666]">
                Every check-in builds a clearer picture of your customer base. Who comes back, who&rsquo;s fading, how this month compares to last. Ventzon turns foot traffic into intelligence &mdash; automatically, in the background, every day.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Period-over-period comparison — ↑18% vs last month",
                  "Customer lifecycle: new → returning → loyal",
                  "At-risk, lapsed, and churned customer breakdown",
                  "Avg customer lifetime and redemption rate",
                  "Busiest days and peak hours of the day",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[13px] font-light text-[#888]">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-[#444]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#333] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
              >
                See your dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </ScrollReveal>

            {/* Right — Visual mock of the analytics dashboard */}
            <ScrollReveal delay={2}>
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 sm:p-7 space-y-5">

                {/* Period tabs */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">ANALYTICS</p>
                  <div className="flex gap-1.5">
                    {["7d", "30d", "60d"].map((p) => (
                      <span key={p} className={`rounded-full px-2.5 py-1 text-[10px] font-light ${p === "30d" ? "bg-[#ededed] text-black" : "text-[#444]"}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stat cards row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "CHECK-INS", value: "1,247", change: "↑18%", up: true },
                    { label: "RETENTION", value: "68%", change: null, up: true },
                    { label: "REDEMPTION", value: "12.5%", change: null, up: true },
                  ].map(({ label, value, change, up }) => (
                    <div key={label} className="rounded-xl border border-[#1a1a1a] px-3 py-3">
                      <p className="text-[9px] font-light tracking-[0.15em] text-[#444]">{label}</p>
                      <p className="mt-1.5 text-xl font-extralight text-white">
                        {value}
                        {change && <span className="ml-1 text-[10px] text-emerald-500">{change}</span>}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Customer lifecycle */}
                <div className="rounded-xl border border-[#1a1a1a] px-4 py-4">
                  <p className="mb-3 text-[9px] font-light tracking-[0.15em] text-[#444]">CUSTOMER LIFECYCLE</p>
                  <div className="space-y-2">
                    {[
                      { label: "Loyal", count: 31, pct: 55, color: "#ededed" },
                      { label: "Returning", count: 11, pct: 20, color: "#888" },
                      { label: "New", count: 14, pct: 25, color: "#555" },
                    ].map(({ label, count, pct, color }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-14 text-[9px] font-light" style={{ color }}>{label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-[9px] font-light text-[#444]">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer health */}
                <div className="rounded-xl border border-[#1a1a1a] px-4 py-4">
                  <p className="mb-3 text-[9px] font-light tracking-[0.15em] text-[#444]">CUSTOMER HEALTH</p>
                  <div className="space-y-2">
                    {[
                      { label: "Active", value: "32", color: "#ededed" },
                      { label: "At risk", value: "9", color: "#eab308" },
                      { label: "Lapsed", value: "7", color: "#f97316" },
                      { label: "Churned", value: "4", color: "#ef4444" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[9px] font-light" style={{ color }}>{label}</span>
                        <span className="text-[9px] font-light" style={{ color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Busiest days mini bar chart */}
                <div className="rounded-xl border border-[#1a1a1a] px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-light tracking-[0.15em] text-[#444]">BUSIEST DAYS</p>
                    <span className="rounded-full border border-[#222] px-2 py-0.5 text-[9px] font-light text-[#666]">Peak: Fri</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    {[
                      { d: "M", h: 45 }, { d: "T", h: 60 }, { d: "W", h: 55 },
                      { d: "T", h: 70 }, { d: "F", h: 100 }, { d: "S", h: 85 }, { d: "S", h: 35 },
                    ].map(({ d, h }, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className={`w-full rounded-sm ${h === 100 ? "bg-[#ededed]" : "bg-[#2a2a2a]"}`} style={{ height: `${h}%` }} />
                        <span className="text-[8px] font-light text-[#444]">{d}</span>
                      </div>
                    ))}
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
      <section className="px-4 sm:px-8 py-20 sm:py-28">
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
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              PRICING
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Simple pricing.
            </h2>
            <p className="mt-5 text-[15px] font-light text-[#666]">
              $25/month to run your loyalty program — plus $0.85 for every customer who earns their reward.
            </p>
          </ScrollReveal>

          <div className="mt-14 mx-auto max-w-lg">
            <ScrollReveal>
              <div className="rounded-lg border border-[#2a2a2a] p-8 transition-colors duration-500 hover:border-[#444]">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-light tracking-[0.2em] text-[#666]">
                    VENTZON PRO
                  </p>
                  <span className="rounded-full bg-[#ededed] px-3 py-1 text-[10px] font-normal tracking-[0.2em] text-black">
                    SAVE $60 YEARLY
                  </span>
                </div>

                <div className="mt-6 flex items-end gap-6">
                  <div>
                    <div className="text-4xl font-extralight tracking-tight text-[#ededed]">
                      $25
                      <span className="text-lg font-light text-[#555]">/mo</span>
                    </div>
                    <p className="mt-1 text-[12px] font-light text-[#555]">or $240/yr</p>
                  </div>
                  <div className="mb-1 h-8 w-[1px] bg-[#1a1a1a]" />
                  <div>
                    <div className="text-2xl font-extralight tracking-tight text-[#888]">
                      + $0.85
                    </div>
                    <p className="mt-1 text-[12px] font-light text-[#555]">per reward redeemed</p>
                  </div>
                </div>

                <ul className="mt-8 grid grid-cols-2 gap-3 text-[13px] font-light text-[#888]">
                  {[
                    "QR code + join page",
                    "Unlimited check-ins",
                    "Push notification rewards",
                    "Analytics dashboard",
                    "Customer list & CSV export",
                    "Email campaigns",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ededed]" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pricing"
                  className="mt-10 block rounded-full border border-[#ededed] py-3.5 text-center text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
                >
                  Get started
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 6b — APP STORE DOWNLOAD
          ============================================================ */}
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
            CUSTOMER APP
          </p>
          <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
            Download the Ventzon app.
          </h2>
          <p className="mt-5 text-[15px] font-light leading-relaxed text-[#666]">
            Track stamps, redeem rewards, and discover local businesses —
            all in one place. Free for customers.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["Loyalty cards", "Explore map", "Push notifications", "Instant rewards"].map((f) => (
              <span key={f} className="rounded-full border border-[#1f1f1f] px-4 py-1.5 text-[12px] font-light text-[#555]">
                {f}
              </span>
            ))}
          </div>

          {/* App Store badge */}
          <div className="mt-10 flex justify-center">
            <a
              href="https://apps.apple.com/app/id6763768638"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3.5 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] px-6 py-4 transition-all duration-300 hover:border-[#444] hover:bg-[#111]"
            >
              {/* Apple logo SVG */}
              <svg className="h-7 w-7 fill-[#ededed]" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-166.8-117.8C114.5 726 48.1 612.7 48.1 505c0-176 114.8-268.8 227.9-268.8 60.1 0 110.1 39.5 147.7 39.5 36 0 92.2-41.8 160.8-41.8 26.1 0 108.2 2.6 168.4 76.4zm-120.4-198.2c28.3-35.3 49-84.2 49-133.1 0-6.5-.6-13-1.3-19.4-46.1 1.9-101 31.1-133.8 71.2-27.1 32-51.3 80.9-51.3 130.5 0 7.1.6 14.3 1.3 16.5 2.6.5 6.5.9 10.4.9 41.5 0 93.8-28.3 125.7-66.6z" />
              </svg>
              <div className="text-left">
                <p className="text-[10px] font-light tracking-[0.15em] text-[#666]">DOWNLOAD ON THE</p>
                <p className="text-[18px] font-light tracking-[-0.01em] text-[#ededed]">App Store</p>
              </div>
            </a>
          </div>

          <p className="mt-4 text-[11px] font-light text-[#444]">
            Available on iPhone &middot; iOS 16+
          </p>
        </ScrollReveal>
      </section>

      {/* ============================================================
          SECTION 7 — FINAL CTA
          ============================================================ */}
      <section className="px-4 sm:px-8 py-28 sm:py-36">
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
