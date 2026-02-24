import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import AnimatedStats from "@/components/AnimatedStats";
import ScrollReveal from "@/components/ScrollReveal";

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
          SECTION 2 — STATS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-4xl">
          <AnimatedStats />
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
                    src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=900&q=80&auto=format&fit=crop"
                    alt="Retail store checkout counter"
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
                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=900&q=80&auto=format&fit=crop"
                    alt="Customer using their phone to check in"
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
                  They enter their phone number. One check-in per day keeps it
                  fair and simple.
                </p>
              </ScrollReveal>
            </div>

            {/* ── Step 3 ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
              <ScrollReveal>
                <div className="overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop"
                    alt="Small business owner smiling"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-1000 hover:scale-[1.03]"
                  />
                </div>
              </ScrollReveal>
              <ScrollReveal delay={2}>
                <p className="font-mono text-[12px] tracking-[0.3em] text-[#555]">
                  03
                </p>
                <h3 className="mt-5 text-2xl font-extralight tracking-[-0.01em] sm:text-3xl">
                  They earn rewards via SMS
                </h3>
                <p className="mt-5 text-base font-light leading-[1.8] text-[#888]">
                  After enough visits they get a text with their reward. You set
                  the goal, you set the offer. It&rsquo;s that simple.
                </p>
              </ScrollReveal>
            </div>
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
                title: "No app download",
                desc: "Works with any phone camera and SMS. Zero friction for your customers.",
              },
              {
                title: "Ready in five minutes",
                desc: "Sign up, name your shop, set your reward, print the QR. You\u2019re live.",
              },
              {
                title: "SMS \u2014 the direct channel",
                desc: "Messages go straight to your customers. No algorithm, no noise.",
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
                title: "Simple, flat pricing",
                desc: "$49.99 per month. No hidden fees, no per-message charges.",
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
                  "My regulars love the SMS rewards. They feel like VIPs without downloading yet another app.",
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
              One plan. Everything included.
            </h2>
            <p className="mt-5 text-[15px] font-light text-[#666]">
              No hidden fees. No per-message charges. Cancel anytime.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {/* Monthly */}
            <ScrollReveal delay={1}>
              <div className="rounded-lg border border-[#1a1a1a] p-8 transition-colors duration-500 hover:border-[#333]">
                <p className="text-[12px] font-light tracking-[0.2em] text-[#666]">
                  MONTHLY
                </p>
                <div className="mt-4 text-4xl font-extralight tracking-tight text-[#ededed]">
                  $49.99
                  <span className="text-lg font-light text-[#555]">/mo</span>
                </div>
                <ul className="mt-8 space-y-4 text-[14px] font-light text-[#888]">
                  {[
                    "QR code + join page",
                    "Unlimited customer check-ins",
                    "Custom rewards & SMS",
                    "Real-time dashboard",
                    "Cancel anytime",
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
                  Get started
                </Link>
              </div>
            </ScrollReveal>

            {/* Yearly */}
            <ScrollReveal delay={2}>
              <div className="relative rounded-lg border border-[#2a2a2a] p-8 transition-colors duration-500 hover:border-[#444]">
                <div className="absolute -top-3 left-8 rounded-full bg-[#ededed] px-4 py-1 text-[10px] font-normal tracking-[0.2em] text-black">
                  SAVE $120
                </div>
                <p className="text-[12px] font-light tracking-[0.2em] text-[#666]">
                  YEARLY
                </p>
                <div className="mt-4 text-4xl font-extralight tracking-tight text-[#ededed]">
                  $479.99
                  <span className="text-lg font-light text-[#555]">/yr</span>
                </div>
                <ul className="mt-8 space-y-4 text-[14px] font-light text-[#888]">
                  {[
                    "Everything in Monthly",
                    "Two months free",
                    "Priority support",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#444]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
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
          SECTION 7 — FINAL CTA
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
