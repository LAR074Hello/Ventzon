import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import DeviceFrame from "@/components/DeviceFrame";
import Divider from "@/components/Divider";
import FadeImage from "@/components/FadeImage";
import Parallax from "@/components/Parallax";
import PricingSection from "@/components/PricingSection";
import SiteFooter from "@/components/SiteFooter";
import HeroScroll from "@/components/HeroScroll";

/* ═══════════════════════════════════════════════════════════════════
   Device frames on this page show real app screenshots from
   /site-images (captured from the seeded dev build), not mockups.
   ═══════════════════════════════════════════════════════════════════ */

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
    <section className="px-6 py-28 sm:py-40">
      <div className="mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2 lg:gap-28">
        <ScrollReveal className={flip ? "lg:order-2" : ""}>
          <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-fog-500">{number}</p>
          <h2 className="mt-5 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em] text-fog-100">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-[1.7] text-fog-300">{body}</p>
        </ScrollReveal>
        <ScrollReveal delay={2} className={flip ? "lg:order-1" : ""}>
          <div className="relative mx-auto max-w-md">
            <Parallax className="aspect-[4/5] w-full rounded-[2.6rem]">
              <FadeImage
                src={photo}
                alt={photoAlt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </Parallax>
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
    <main className="marketing bg-night-950 text-fog-100">
      {/* ══ HERO — pinned video, cinematic scroll into the statement ══ */}
      <HeroScroll />

      {/* ══ ACT 1 — for the people who go ══ */}
      <section className="px-6 pb-8 pt-28 sm:pt-40">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-fog-500">
            For the people who go
          </p>
          <h2 className="mt-6 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em]">
            A better way to find good places.
          </h2>
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
        <FadeImage
          src="/site-images/app-explore.png"
          alt="The Ventzon explore map showing places nearby"
          className="h-full w-full object-cover object-top"
        />
      </ProductBlock>

      <ProductBlock
        number="02"
        title="Check in. Prove you were there."
        body="Check in once you’re there and your post carries a verified visit badge — proof you were really there, not a review from someone who never showed up."
        photo="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80"
        photoAlt="A barista at a coffee counter"
        flip
      >
        <FadeImage
          src="/site-images/app-checkin.png"
          alt="The check-in confirmation in the Ventzon app"
          className="h-full w-full object-cover object-top"
        />
      </ProductBlock>

      <ProductBlock
        number="03"
        title="The feed fills with what’s actually good"
        body="Friends and locals post about the places they go. Over time the feed fills with what’s worth the trip — and where a shop runs a reward, you earn it just for visiting."
        photo="https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1200&q=80"
        photoAlt="Two people at a cafe table"
      >
        <FadeImage
          src="/site-images/app-feed.png"
          alt="The Ventzon home feed"
          className="h-full w-full object-cover object-top"
        />
      </ProductBlock>


      {/* Download CTA — end of Act 1 */}
      <section className="px-6 pb-28 pt-10 text-center sm:pb-40">
        <ScrollReveal>
          <Link
            href="/customer/explore"
            className="group btn-pill inline-flex items-center gap-2.5 rounded-full bg-white px-9 py-4 text-[15px] font-medium tracking-[0.15em] text-black shadow-warm hover:bg-cream"
          >
            Open the app
            <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
          </Link>
          <p className="mt-6 text-sm text-fog-500">Free for customers · no download required</p>
        </ScrollReveal>
      </section>

      {/* ══ PIVOT — from the person to the place ══ */}
      <section className="relative overflow-hidden px-6 py-36 sm:py-48">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(90,30,36,0.14),transparent)]" />
        <Divider className="relative mx-auto mb-16 max-w-xs" />
        <ScrollReveal className="relative mx-auto max-w-2xl text-center">
          <p className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-normal leading-[1.3] tracking-[0.01em] text-fog-100">
            And if you&rsquo;re the one behind the counter &mdash;
          </p>
          <p className="mt-6 text-[16px] font-light leading-[1.8] text-fog-300">
            Ventzon turns the people who already walk in into customers who come back.
          </p>
        </ScrollReveal>
      </section>

      {/* ══ ACT 2 — FOR SHOPS ══ */}
      <section className="px-6 py-32 sm:py-44">
        <Divider className="mx-auto mb-16 max-w-xs" />
        <div className="mx-auto max-w-7xl">
          <ScrollReveal className="mx-auto max-w-3xl text-center">
            <p className="text-[13px] font-medium uppercase tracking-[0.25em] text-fog-500">For shop owners</p>
            <h2 className="mt-5 font-display text-[clamp(1.75rem,3.5vw,3rem)] font-normal leading-[1.12] tracking-[0.01em] text-fog-100">
              Your shop, discovered by people who actually show up.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.7] text-fog-300">
              Ventzon is where a local place gets found, visited, and talked
              about — by the people in its own neighborhood.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {SHOP_BENEFITS.map((b, i) => (
              <ScrollReveal key={b.title} delay={(i % 2) === 1 ? 2 : 1}>
                <div className="h-full rounded-[2rem] bg-night-800 p-8 shadow-warm transition-all duration-700 ease-luxe hover:-translate-y-1 hover:shadow-warm-lg hover:ring-1 hover:ring-white/10">
                  <h3 className="font-display text-[22px] font-medium tracking-[0em] text-fog-100">{b.title}</h3>
                  <p className="mt-3 text-[15px] leading-[1.7] text-fog-300">{b.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Early-shop line — honest, works in any city */}
          <ScrollReveal delay={2} className="mx-auto mt-16 max-w-2xl rounded-[2rem] bg-maroon-900 p-8 text-center">
            <p className="text-[15px] leading-[1.7] text-maroon-300">
              <span className="font-semibold">Metro by metro.</span> The first
              shops in your neighborhood shape how discovery works there &mdash;
              and they&rsquo;re the first thing locals see when they open the map.
            </p>
          </ScrollReveal>

          <ScrollReveal className="mt-12 text-center">
            <Link
              href="/app"
              className="group btn-pill inline-flex items-center gap-2.5 rounded-full bg-maroon px-9 py-4 text-[15px] font-medium tracking-[0.15em] text-white shadow-warm hover:bg-maroon-hover"
            >
              See how it works for your shop
              <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ══ PRICING — the shop owner's decision ══ */}
      <PricingSection />

      {/* ══ FINAL CTA — editorial photo band ══ */}
      <section className="px-6 pb-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem]">
          <FadeImage
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=2000&q=80"
            alt="A neighborhood street at golden hour"
            loading="lazy"
            className="h-[480px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night-950/85 via-night-950/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-center sm:p-14">
            <ScrollReveal>
              <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-normal leading-[1.12] tracking-[0.01em] text-white">
                See what&rsquo;s near you.
              </h2>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/customer/explore"
                  className="group btn-pill inline-flex items-center gap-2.5 rounded-full bg-white px-9 py-4 text-[15px] font-medium tracking-[0.15em] text-black shadow-warm hover:bg-cream"
                >
                  Open the app
                  <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
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

