import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

const shops = [
  {
    name: "Sunrise Bakery",
    deal: "Free coffee after 8 visits",
    from: "from #1a0a00",
    to: "to #0a0800",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=64&h=64&fit=crop&auto=format",
  },
  {
    name: "Fresh Cuts",
    deal: "Free cut after 10 visits",
    from: "from #00111a",
    to: "to #000a0a",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=64&h=64&fit=crop&auto=format",
  },
  {
    name: "The Daily Grind",
    deal: "Free drink after 6 visits",
    from: "from #0a001a",
    to: "to #07000f",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=64&h=64&fit=crop&auto=format",
  },
  {
    name: "Corner Deli",
    deal: "Free sandwich after 12 visits",
    from: "from #001a0a",
    to: "to #000d06",
    img: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=64&h=64&fit=crop&auto=format",
  },
];

export default function CustomerAppPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="flex min-h-screen items-center justify-center px-8 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
            THE CUSTOMER APP
          </p>
          <h1 className="mt-6 text-4xl font-extralight tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            What your customers experience.
          </h1>
          <p className="mt-6 text-[15px] font-light leading-[1.8] text-[#666]">
            From scan to reward — a seamless loyalty experience your customers will actually use.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://apps.apple.com/app/id6763768638"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-[#ededed] bg-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-black transition-all duration-500 hover:bg-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download on the App Store
            </a>
            <Link
              href="/signup"
              className="text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-500 hover:text-[#ededed]"
            >
              Set up your shop
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          THREE SCREENS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              THE EXPERIENCE
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Three taps. Instant loyalty.
            </h2>
          </ScrollReveal>

          <div className="mt-16 flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-center">
            {/* Phone 1 — Join */}
            <ScrollReveal delay={1} className="flex flex-col items-center gap-4">
              <div className="w-56 rounded-[2.5rem] border-2 border-[#2a2a2a] bg-[#050505] overflow-hidden" style={{ aspectRatio: "9/19" }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <span className="text-[9px] font-light text-[#555]">9:41</span>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col items-center px-4 pt-4 pb-4">
                  {/* Shop avatar */}
                  <img
                    src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=96&h=96&fit=crop&auto=format"
                    alt="Sunrise Bakery"
                    className="h-12 w-12 rounded-full object-cover border border-[#2a2a2a]"
                  />
                  <p className="mt-2 text-[9px] font-light tracking-[0.25em] text-[#ededed]">
                    SUNRISE BAKERY
                  </p>
                  {/* Deal */}
                  <div className="mt-3 w-full rounded-lg border border-[#1a1a1a] px-3 py-2 text-center">
                    <p className="text-[9px] font-light text-[#888]">
                      Free coffee after 8 visits
                    </p>
                  </div>
                  {/* Toggle */}
                  <div className="mt-4 w-full">
                    <div className="mb-2 flex items-center justify-center gap-0.5 rounded-full border border-[#1a1a1a] p-0.5">
                      <div className="flex-1 rounded-full bg-[#ededed] py-1.5 text-center text-[8px] font-light tracking-[0.1em] text-black">
                        PHONE
                      </div>
                      <div className="flex-1 rounded-full py-1.5 text-center text-[8px] font-light tracking-[0.1em] text-[#555]">
                        EMAIL
                      </div>
                    </div>
                    <p className="mb-1 text-[8px] font-light tracking-[0.15em] text-[#555]">
                      PHONE NUMBER
                    </p>
                    <div className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2.5 text-center">
                      <span className="text-[11px] font-light text-[#ededed]">
                        (555) 123-4567
                      </span>
                    </div>
                  </div>
                  {/* Button */}
                  <div className="mt-4 w-full rounded-full border border-[#ededed] py-2.5 text-center text-[8px] font-light tracking-[0.15em] text-[#ededed]">
                    CHECK IN
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
                JOIN
              </p>
            </ScrollReveal>

            {/* Phone 2 — Progress */}
            <ScrollReveal delay={2} className="flex flex-col items-center gap-4">
              <div className="w-56 rounded-[2.5rem] border-2 border-[#2a2a2a] bg-[#050505] overflow-hidden" style={{ aspectRatio: "9/19" }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <span className="text-[9px] font-light text-[#555]">9:41</span>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col items-center px-4 pt-6 pb-4">
                  <p className="text-[16px] font-extralight text-[#ededed]">
                    Checked in!
                  </p>
                  {/* Progress dots */}
                  <div className="mt-6 grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex h-6 w-6 items-center justify-center rounded-full ${
                          i < 6
                            ? "bg-[#ededed]"
                            : "border border-[#333] bg-transparent"
                        }`}
                      >
                        {i < 6 && (
                          <Check className="h-3 w-3 text-black" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] font-light tracking-[0.1em] text-[#888]">
                    6 of 8 visits · 2 to go
                  </p>
                  <p className="mt-2 text-[9px] font-light text-[#555]">
                    1 check-in per day
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
                YOUR PROGRESS
              </p>
            </ScrollReveal>

            {/* Phone 3 — Reward */}
            <ScrollReveal delay={3} className="flex flex-col items-center gap-4">
              <div className="w-56 rounded-[2.5rem] border-2 border-emerald-900/60 bg-[#050505] overflow-hidden" style={{ aspectRatio: "9/19", boxShadow: "0 0 40px rgba(16,185,129,0.08)" }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <span className="text-[9px] font-light text-[#555]">9:41</span>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col items-center px-4 pt-6 pb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="mt-4 text-[16px] font-extralight text-emerald-300">
                    Reward earned!
                  </p>
                  <div className="mt-4 w-full rounded-xl border border-emerald-900/40 bg-emerald-950/30 px-3 py-4 text-center">
                    <p className="text-[11px] font-light text-emerald-300/80">
                      Free coffee after 8 visits
                    </p>
                  </div>
                  <p className="mt-4 text-[9px] font-light tracking-[0.15em] text-emerald-400/50">
                    SHOW THIS AT THE REGISTER
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
                REWARD EARNED
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          EXPLORE
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              EXPLORE
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Your shop, discovered.
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-[15px] font-light leading-[1.8] text-[#666]">
              Customers browsing Ventzon can find your shop, see your deal, and join your loyalty program — all before they even walk in.
            </p>
          </ScrollReveal>

          {/* Explore page mock — horizontal scroll of shop cards */}
          <ScrollReveal delay={2} className="mt-14">
            <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-6 sm:p-8">
              <p className="mb-6 text-[10px] font-light tracking-[0.3em] text-[#444]">
                NEARBY SHOPS
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {shops.map((shop) => (
                  <div
                    key={shop.name}
                    className={`flex-shrink-0 w-44 rounded-xl border border-[#1a1a1a] bg-gradient-to-br ${shop.from} ${shop.to} p-4 transition-colors duration-500 hover:border-[#333]`}
                  >
                    <img
                      src={shop.img}
                      alt={shop.name}
                      className="h-8 w-8 rounded-full object-cover border border-[#2a2a2a]"
                    />
                    <p className="mt-3 text-[11px] font-light tracking-[0.15em] text-[#ededed]">
                      {shop.name}
                    </p>
                    <p className="mt-2 text-[10px] font-light leading-relaxed text-[#666]">
                      {shop.deal}
                    </p>
                    <div className="mt-4 rounded-full border border-[#2a2a2a] py-1.5 text-center text-[9px] font-light tracking-[0.1em] text-[#888]">
                      JOIN
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mt-10 text-center">
            <Link
              href="/customer/explore"
              className="inline-flex items-center gap-3 text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-500 hover:text-[#ededed]"
            >
              Browse local shops
              <ArrowRight className="h-3 w-3" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ============================================================
          PUSH NOTIFICATIONS
          ============================================================ */}
      <section className="px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left — Text */}
            <ScrollReveal>
              <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
                NOTIFICATIONS
              </p>
              <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
                They never forget you.
              </h2>
              <p className="mt-6 text-[15px] font-light leading-[1.8] text-[#666]">
                When customers are close to their reward or earn one, they get a push notification. No email newsletter, no social algorithm — direct to their lock screen.
              </p>
            </ScrollReveal>

            {/* Right — iOS notification mock */}
            <ScrollReveal delay={2}>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-white/[0.04] p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    {/* App icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-black ring-1 ring-[#333]">
                      <span className="text-[10px] font-light tracking-[0.2em] text-[#ededed]">V</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium tracking-[0.05em] text-[#ededed]">
                          Ventzon
                        </p>
                        <p className="text-[10px] font-light text-[#555]">
                          now
                        </p>
                      </div>
                      <p className="mt-1 text-[13px] font-light leading-[1.6] text-[#999]">
                        🏆 Reward earned! Show this at the register at Sunrise Bakery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="px-8 py-28 sm:py-36">
        <div className="luxury-divider mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extralight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Give your customers this.
          </h2>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
            >
              Set up your shop
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-500 hover:text-[#ededed]"
            >
              How it works
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <SiteFooter />
    </main>
  );
}
