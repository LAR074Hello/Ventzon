import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

const shops = [
  {
    name: "Sunrise Bakery",
    deal: "Free coffee after 8 visits",
    from: "from #f3e8d6",
    to: "to #e9dcc2",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=64&h=64&fit=crop&auto=format",
  },
  {
    name: "Fresh Cuts",
    deal: "Free cut after 10 visits",
    from: "from #e4ecf0",
    to: "to #d3dde3",
    img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=64&h=64&fit=crop&auto=format",
  },
  {
    name: "The Daily Grind",
    deal: "Free drink after 6 visits",
    from: "from #ebe3f0",
    to: "to #dbd0e4",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=64&h=64&fit=crop&auto=format",
  },
  {
    name: "Corner Deli",
    deal: "Free sandwich after 12 visits",
    from: "from #e2efe5",
    to: "to #cfe0d2",
    img: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=64&h=64&fit=crop&auto=format",
  },
];

export default function CustomerAppPage() {
  return (
    <main className="min-h-screen bg-cream text-ink-warm">
      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="flex min-h-screen items-center justify-center px-8 py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-light tracking-[0.5em] text-taupe">
            THE CUSTOMER APP
          </p>
          <h1 className="mt-6 text-4xl font-extralight tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Find places. Prove you were there.
          </h1>
          <p className="mt-6 text-[15px] font-light leading-[1.8] text-taupe">
            Browse real spots near you, post about the ones you&rsquo;ve actually
            visited, and check in to prove you were really there. Free for
            customers &mdash; no download required.
          </p>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/customer/explore"
              className="inline-flex items-center gap-3 rounded-full border border-ink-warm/20 bg-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-black transition-all duration-500 hover:bg-white"
            >
              Open the app
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/signup"
              className="text-[12px] font-light tracking-[0.15em] text-taupe transition-colors duration-500 hover:text-ink-warm"
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
            <p className="text-[11px] font-light tracking-[0.5em] text-taupe">
              EXAMPLE SCREENS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Find it. Visit it. Share it.
            </h2>
          </ScrollReveal>

          <div className="mt-16 flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-center">
            {/* Phone 1 — Join */}
            <ScrollReveal delay={1} className="flex flex-col items-center gap-4">
              <div className="w-56 rounded-[2.5rem] border-2 border-black/10 bg-cream-card overflow-hidden" style={{ aspectRatio: "9/19" }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <span className="text-[9px] font-light text-taupe">9:41</span>
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
                    className="h-12 w-12 rounded-full object-cover border border-black/10"
                  />
                  <p className="mt-2 text-[9px] font-light tracking-[0.25em] text-ink-warm">
                    SUNRISE BAKERY
                  </p>
                  {/* Deal */}
                  <div className="mt-3 w-full rounded-lg border border-black/10 px-3 py-2 text-center">
                    <p className="text-[9px] font-light text-taupe">
                      Free coffee after 8 visits
                    </p>
                  </div>
                  {/* Toggle */}
                  <div className="mt-4 w-full">
                    <div className="mb-2 flex items-center justify-center gap-0.5 rounded-full border border-black/10 p-0.5">
                      <div className="flex-1 rounded-full bg-[#ededed] py-1.5 text-center text-[8px] font-light tracking-[0.1em] text-black">
                        PHONE
                      </div>
                      <div className="flex-1 rounded-full py-1.5 text-center text-[8px] font-light tracking-[0.1em] text-taupe">
                        EMAIL
                      </div>
                    </div>
                    <p className="mb-1 text-[8px] font-light tracking-[0.15em] text-taupe">
                      PHONE NUMBER
                    </p>
                    <div className="w-full rounded-lg border border-black/10 bg-cream-card px-3 py-2.5 text-center">
                      <span className="text-[11px] font-light text-ink-warm">
                        (555) 123-4567
                      </span>
                    </div>
                  </div>
                  {/* Button */}
                  <div className="mt-4 w-full rounded-full border border-ink-warm/20 py-2.5 text-center text-[8px] font-light tracking-[0.15em] text-ink-warm">
                    CHECK IN
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-light tracking-[0.2em] text-taupe">
                JOIN
              </p>
            </ScrollReveal>

            {/* Phone 2 — Progress */}
            <ScrollReveal delay={2} className="flex flex-col items-center gap-4">
              <div className="w-56 rounded-[2.5rem] border-2 border-black/10 bg-cream-card overflow-hidden" style={{ aspectRatio: "9/19" }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <span className="text-[9px] font-light text-taupe">9:41</span>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col items-center px-4 pt-6 pb-4">
                  <p className="text-[16px] font-extralight text-ink-warm">
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
                            : "border border-black/10 bg-transparent"
                        }`}
                      >
                        {i < 6 && (
                          <Check className="h-3 w-3 text-black" />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] font-light tracking-[0.1em] text-taupe">
                    6 of 8 visits · 2 to go
                  </p>
                  <p className="mt-2 text-[9px] font-light text-taupe">
                    1 check-in per day
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-light tracking-[0.2em] text-taupe">
                YOUR PROGRESS
              </p>
            </ScrollReveal>

            {/* Phone 3 — Share */}
            <ScrollReveal delay={3} className="flex flex-col items-center gap-4">
              <div className="w-56 rounded-[2.5rem] border-2 border-black/10 bg-cream-card overflow-hidden" style={{ aspectRatio: "9/19" }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-1">
                  <span className="text-[9px] font-light text-taupe">9:41</span>
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                    <div className="h-1 w-1 rounded-full bg-[#555]" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex flex-col px-4 pt-4 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cream-sunken">
                      <span className="text-[9px] font-light text-taupe">S</span>
                    </div>
                    <p className="text-[9px] font-light tracking-[0.15em] text-ink-warm">
                      SUNRISE BAKERY
                    </p>
                    <span className="ml-auto rounded-full bg-[#ededed] px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.15em] text-black">
                      Verified visit
                    </span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=260&fit=crop&auto=format"
                    alt=""
                    className="mt-3 h-36 w-full rounded-lg object-cover"
                  />
                  <p className="mt-3 text-[9px] font-light leading-relaxed text-taupe">
                    Best sourdough in the neighborhood. Go early — it sells out.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[8px] font-light text-taupe">
                    <span>12 likes</span>
                    <span>·</span>
                    <span>3 comments</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-light tracking-[0.2em] text-taupe">
                SHARED POST
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
            <p className="text-[11px] font-light tracking-[0.5em] text-taupe">
              EXPLORE
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              See what&rsquo;s actually good near you.
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-[15px] font-light leading-[1.8] text-taupe">
              Places around you, from people who&rsquo;ve actually been there. No ads, no algorithm.
            </p>
          </ScrollReveal>

          {/* Explore page mock — horizontal scroll of place cards */}
          <ScrollReveal delay={2} className="mt-14">
            <div className="rounded-2xl border border-black/10 bg-cream-card p-6 sm:p-8">
              <p className="mb-6 text-[10px] font-light tracking-[0.3em] text-ink-warm">
                NEARBY PLACES
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {shops.map((shop) => (
                  <div
                    key={shop.name}
                    className={`flex-shrink-0 w-44 rounded-xl border border-black/10 bg-gradient-to-br ${shop.from} ${shop.to} p-4 transition-colors duration-500 hover:border-black/10`}
                  >
                    <img
                      src={shop.img}
                      alt={shop.name}
                      className="h-8 w-8 rounded-full object-cover border border-black/10"
                    />
                    <p className="mt-3 text-[11px] font-light tracking-[0.15em] text-ink-warm">
                      {shop.name}
                    </p>
                    <p className="mt-2 text-[10px] font-light leading-relaxed text-taupe">
                      Local favorite &middot; nearby
                    </p>
                    <div className="mt-4 rounded-full bg-[#ededed] py-1.5 text-center text-[9px] font-semibold tracking-[0.1em] text-black">
                      VERIFIED VISITS
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mt-10 text-center">
            <Link
              href="/customer/explore"
              className="inline-flex items-center gap-3 text-[12px] font-light tracking-[0.15em] text-taupe transition-colors duration-500 hover:text-ink-warm"
            >
              Browse local places
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
              <p className="text-[11px] font-light tracking-[0.5em] text-taupe">
                NOTIFICATIONS
              </p>
              <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
                You never miss what&rsquo;s good.
              </h2>
              <p className="mt-6 text-[15px] font-light leading-[1.8] text-taupe">
                When a friend posts from somewhere you&rsquo;ll love, you hear
                about it. No email newsletter, no social algorithm &mdash;
                direct to your lock screen.
              </p>
            </ScrollReveal>

            {/* Right — iOS notification mock */}
            <ScrollReveal delay={2}>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-cream-card p-4 shadow-warm">
                  <div className="flex items-start gap-3">
                    {/* App icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cream ring-1 ring-black/10">
                      <span className="text-[10px] font-light tracking-[0.2em] text-ink-warm">V</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium tracking-[0.05em] text-ink-warm">
                          Ventzon
                        </p>
                        <p className="text-[10px] font-light text-taupe">
                          now
                        </p>
                      </div>
                      <p className="mt-1 text-[13px] font-light leading-[1.6] text-taupe">
                        Alex posted from Sunrise Bakery &mdash; &ldquo;Best sourdough in town.&rdquo;
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
              className="inline-flex items-center gap-3 rounded-full border border-ink-warm/20 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-ink-warm transition-all duration-500 hover:bg-[#ededed] hover:text-black"
            >
              Set up your shop
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/how-it-works"
              className="text-[12px] font-light tracking-[0.15em] text-taupe transition-colors duration-500 hover:text-ink-warm"
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
