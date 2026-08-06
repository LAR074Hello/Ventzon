import Link from "next/link";
import { ArrowRight, MapPin, Heart, MessageCircle } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import DeviceFrame from "@/components/DeviceFrame";
import Coverage from "@/components/Coverage";
import SiteFooter from "@/components/SiteFooter";

/* ═══════════════════════════════════════════════════════════════════
   In-frame UI mockups — rendered from the page's own tokens rather than
   static images, so the "screenshots" always match the real product's
   palette. City-agnostic invented place names on purpose.
   ═══════════════════════════════════════════════════════════════════ */

function ExploreMock() {
  return (
    <div className="flex h-full flex-col p-4">
      <p className="text-[13px] font-semibold tracking-[0.02em] text-ink-warm">Near you</p>
      {[
        { name: "Maple & Pine", sub: "Coffee · 0.4 mi", tag: "Deal" },
        { name: "Second Shelf Books", sub: "Bookshop · 0.6 mi", tag: "" },
        { name: "Golden Hour Diner", sub: "Food · 0.8 mi", tag: "" },
      ].map((p, i) => (
        <div
          key={p.name}
          className={`mt-3 flex items-center gap-3 rounded-2xl bg-cream-sunken p-3 ${i === 0 ? "shadow-warm" : ""}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon-soft text-[13px] font-semibold text-maroon">
            {p.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink-warm">{p.name}</p>
            <p className="text-[11px] text-taupe">{p.sub}</p>
          </div>
          {p.tag && (
            <span className="rounded-full bg-maroon px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
              {p.tag}
            </span>
          )}
        </div>
      ))}
      <div className="mt-4 rounded-2xl bg-maroon-soft p-3 text-center">
        <p className="text-[11px] font-medium text-maroon">Tap a place to see what it&rsquo;s like</p>
      </div>
    </div>
  );
}

function MapMock() {
  return (
    <div className="relative h-full w-full bg-[#ece5d6]">
      {/* Abstract map — soft landmasses, no real city */}
      <div className="absolute left-4 top-12 h-24 w-28 rounded-full bg-[#ddd4c0] blur-md" />
      <div className="absolute right-6 top-24 h-20 w-24 rounded-full bg-[#ddd4c0] blur-md" />
      <div className="absolute bottom-24 left-10 h-16 w-20 rounded-full bg-[#ddd4c0] blur-md" />
      {/* Roads */}
      <div className="absolute left-0 top-1/2 h-[3px] w-full -rotate-6 bg-white/60" />
      <div className="absolute left-1/2 top-0 h-full w-[3px] rotate-12 bg-white/60" />
      {/* Pins */}
      <div className="absolute left-14 top-16 h-3 w-3 rounded-full bg-maroon shadow-warm" />
      <div className="absolute right-10 top-28 h-3 w-3 rounded-full bg-maroon shadow-warm" />
      <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-maroon ring-4 ring-white/70" />
      {/* Bottom sheet */}
      <div className="absolute inset-x-2 bottom-2 rounded-2xl bg-cream-card p-3 shadow-warm">
        <p className="text-[13px] font-semibold text-ink-warm">Near you now</p>
        <p className="mt-0.5 text-[11px] text-taupe">8 places within a mile</p>
      </div>
    </div>
  );
}

function PostMock() {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-maroon-soft text-[12px] font-semibold text-maroon">A</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-ink-warm">Alex · Maple &amp; Pine</p>
          <p className="text-[10px] text-taupe">2h ago</p>
        </div>
        <span className="rounded-full bg-maroon px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white">
          Verified visit
        </span>
      </div>
      <div className="mt-3 flex-1 rounded-2xl bg-gradient-to-br from-[#e5dcc8] to-[#cbbfa4]" />
      <p className="mt-3 text-[12px] leading-relaxed text-ink-warm">
        Best sourdough in the neighborhood — go early, it sells out.
      </p>
      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-taupe">
        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> 24</span>
        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> 6</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Maple &amp; Pine</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ProductBlock — the GlossGenius alternating rhythm: numbered eyebrow +
   big headline on one side, editorial photo with a device frame
   overlapping its bottom corner on the other.
   ═══════════════════════════════════════════════════════════════════ */
function ProductBlock({
  number,
  title,
  body,
  photo,
  photoAlt,
  flip = false,
  children,
}: {
  number: string;
  title: React.ReactNode;
  body: string;
  photo: string;
  photoAlt: string;
  flip?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <ScrollReveal className={flip ? "lg:order-2" : ""}>
          <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-taupe-faint">{number}</p>
          <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink-warm">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-[1.7] text-taupe">{body}</p>
        </ScrollReveal>
        <ScrollReveal delay={2} className={flip ? "lg:order-1" : ""}>
          <div className="relative mx-auto max-w-md">
            <img
              src={photo}
              alt={photoAlt}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[2.6rem] object-cover"
            />
            <div className={`absolute -bottom-14 ${flip ? "right-2" : "left-2"}`}>
              <DeviceFrame className={flip ? "-rotate-3" : "rotate-3"}>{children}</DeviceFrame>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Merchant benefits — soft rounded cards, no hard borders, warm shadows.
   The four arguments for a shop, made in plain words.
   ═══════════════════════════════════════════════════════════════════ */
const SHOP_BENEFITS = [
  {
    title: "On the map from day one",
    body: "Your shop is listed the moment you create it — on the map, in search, and in the feed. No hardware, no counter space, no setup fee.",
  },
  {
    title: "Verified visits, not guesses",
    body: "A check-in means a real person walked in. A post carrying a verified visit is the strongest recommendation a local can make — and it names your shop.",
  },
  {
    title: "A customer list that builds itself",
    body: "Every check-in becomes a name, an email, a visit count. You own the list; it grows while you run your business.",
  },
  {
    title: "Rewards at one flat price",
    body: "Set a visit goal and a reward in minutes. $25/month flat — no per-redemption fees, no surprises.",
  },
];


export default function HomePage() {
  return (
    <main className="bg-cream text-ink-warm">
      {/* ══ HERO — the video, kept. Warm cream scrim instead of black. ══ */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-poster.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Warm scrim: dark enough for text at the top, melts to cream at the seam */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#221e1a]/55 via-[#221e1a]/30 to-[#faf6ef]" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="animate-fade-in anim-delay-200 text-[12px] font-medium uppercase tracking-[0.25em] text-white/85 opacity-0">
            Local discovery, with proof
          </p>
          <h1 className="animate-fade-in anim-delay-400 mt-8 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white opacity-0">
            Find real places.
            <br />
            See who&rsquo;s actually there.
          </h1>
          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-lg leading-[1.7] text-white/90 opacity-0">
            Ventzon is a local social app. Browse real spots near you, check in
            when you go, and share what they&rsquo;re actually like &mdash; with
            proof you were there.
          </p>
          <div className="animate-fade-in-up anim-delay-800 mt-12 flex flex-col items-center gap-5 opacity-0 sm:flex-row sm:justify-center">
            <Link
              href="/customer/explore"
              className="inline-flex items-center gap-2.5 rounded-full bg-cream px-9 py-4 text-[15px] font-medium text-ink-warm shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Open the app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app"
              className="text-[15px] font-medium text-white/85 underline decoration-white/40 underline-offset-8 transition-colors duration-300 hover:text-white"
            >
              For shops
            </Link>
          </div>
          <p className="animate-fade-in anim-delay-1000 mt-10 text-sm text-white/70 opacity-0">
            Free for customers &middot; no download
          </p>
        </div>
      </section>

      {/* ══ SIGNAL STRIP — the promise, in one quiet line ══ */}
      <section className="px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-medium leading-[1.4] tracking-[-0.01em] text-taupe">
            Real places. Verified visits. Posts you can trust.
          </p>
        </ScrollReveal>
      </section>

      {/* ══ PRODUCT — 01 / 02 / 03, alternating ══ */}
      <ProductBlock
        number="01"
        title="Find places worth going to"
        body="Browse thousands of real local spots — coffee shops, parks, bookshops, the corner bar. No ads, no algorithm, no listings you’ve never heard of."
        photo="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80"
        photoAlt="A warm cafe interior with people"
      >
        <ExploreMock />
      </ProductBlock>

      <ProductBlock
        number="02"
        title="Check in. Prove you were there."
        body="Check in once you’re there and your post carries a verified visit badge — proof you were really there, not a review from someone who never showed up."
        photo="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80"
        photoAlt="A barista at a coffee counter"
        flip
      >
        <MapMock />
      </ProductBlock>

      <ProductBlock
        number="03"
        title="The feed fills with what’s actually good"
        body="Friends and locals post about the places they go. Over time the feed fills with what’s worth the trip — and where a shop runs a reward, you earn it just for visiting."
        photo="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&q=80"
        photoAlt="Two people at a cafe table"
      >
        <PostMock />
      </ProductBlock>


      {/* ══ FOR SHOPS — the merchant argument, design-led, no invented stats ══ */}
      <section className="px-6 py-24 sm:py-36">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-taupe-faint">For shops</p>
            <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-medium leading-[1.1] tracking-[-0.02em] text-ink-warm">
              Your shop, discovered by people who actually show up.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.7] text-taupe">
              Ventzon is where a local place gets found, visited, and talked
              about — by the people in its own neighborhood.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {SHOP_BENEFITS.map((b, i) => (
              <ScrollReveal key={b.title} delay={(i % 2) === 1 ? 2 : 1}>
                <div className="h-full rounded-[2rem] bg-cream-card p-8 shadow-warm transition-all duration-300 hover:-translate-y-1">
                  <h3 className="font-display text-xl font-semibold tracking-[-0.01em] text-ink-warm">{b.title}</h3>
                  <p className="mt-3 text-[15px] leading-[1.7] text-taupe">{b.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Early-shop line — honest, works in any city */}
          <ScrollReveal delay={2} className="mx-auto mt-16 max-w-2xl rounded-[2rem] bg-maroon-soft p-8 text-center">
            <p className="text-[15px] leading-[1.7] text-maroon">
              <span className="font-semibold">Metro by metro.</span> The first
              shops in your neighborhood shape how discovery works there &mdash;
              and they&rsquo;re the first thing locals see when they open the map.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mt-12 text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2.5 rounded-full bg-maroon px-9 py-4 text-[15px] font-medium text-white shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:bg-maroon-hover"
            >
              See how it works for your shop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ══ COVERAGE — data-driven, city-agnostic ══ */}
      <section className="px-6 pb-24 sm:pb-32">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-taupe-faint">Where we are</p>
          <h2 className="mt-5 font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.02em] text-ink-warm">
            Real places, neighborhood by neighborhood
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-[1.7] text-taupe">
            The map fills in as we launch. These counts come straight from the
            places we import &mdash; so the day a new metro lands, it appears here.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={2}>
          <Coverage />
        </ScrollReveal>
      </section>

      {/* ══ FINAL CTA — editorial photo band ══ */}
      <section className="px-6 pb-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem]">
          <img
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2000&q=80"
            alt="A neighborhood street at golden hour"
            loading="lazy"
            className="h-[480px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#221e1a]/70 via-[#221e1a]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-center sm:p-14">
            <ScrollReveal>
              <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-white">
                See what&rsquo;s near you.
              </h2>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/customer/explore"
                  className="inline-flex items-center gap-2.5 rounded-full bg-cream px-9 py-4 text-[15px] font-medium text-ink-warm shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                >
                  Open the app
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/app"
                  className="text-[15px] font-medium text-white/90 underline decoration-white/40 underline-offset-8 transition-colors duration-300 hover:text-white"
                >
                  For shops
                </Link>
              </div>
              <p className="mt-8 text-sm text-white/70">Free for customers &middot; no download</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

