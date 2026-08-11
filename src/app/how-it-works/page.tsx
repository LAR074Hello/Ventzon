// src/app/how-it-works/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import DeviceFrame from "@/components/DeviceFrame";
import Divider from "@/components/Divider";
import FadeImage from "@/components/FadeImage";
import Parallax from "@/components/Parallax";
import SiteFooter from "@/components/SiteFooter";

/* Editorial photos — licensed, self-hosted in /public/site-images.
   Portrait files are cropped 4:5 for the Parallax cards; the *-wide
   files are cropped for the full-width photo bands, so neither gets
   upscaled. Real app screenshots are the app-*.png files below and
   render inside DeviceFrame (seeded dev server, 390x844). */
const PHOTOS = {
  hero: "/site-images/photo-terrace.jpg",
  street: "/site-images/photo-shopfront.jpg",
  barista: "/site-images/photo-checkin.jpg",
  dish: "/site-images/photo-taverna.jpg",
  table: "/site-images/photo-shelves.jpg",
  dusk: "/site-images/photo-checkin-wide.jpg",
  counter: "/site-images/photo-boutique.jpg",
  goldenHour: "/site-images/photo-counter-wide.jpg",
};

const SCREENS = {
  explore: "/site-images/app-explore.png",
  checkin: "/site-images/app-checkin.png",
  post: "/site-images/app-post.png",
  feed: "/site-images/app-feed.png",
  join: "/site-images/app-join.png",
};

const customerSteps = [
  {
    number: "01",
    title: "Find a place near you",
    body: "Browse thousands of real local spots on the Ventzon map — coffee shops, parks, bookshops, the corner bar. No ads, no algorithm, no listings you've never heard of.",
    photo: PHOTOS.street,
    photoAlt: "The interior of an independent shop",
    screen: SCREENS.explore,
    screenAlt: "The Ventzon explore map showing places nearby",
  },
  {
    number: "02",
    title: "Go there. Check in.",
    body: "Checking in takes seconds. Your visits add up — and where a shop runs a reward, you earn it just for showing up.",
    photo: PHOTOS.barista,
    photoAlt: "Scanning a QR code at a shop counter",
    screen: SCREENS.checkin,
    screenAlt: "The check-in confirmation in the Ventzon app",
  },
  {
    number: "03",
    title: "Share a verified visit",
    body: "Post a photo or a note about the place and it carries a verified visit badge — proof you were really there, not a review from someone who wasn't.",
    photo: PHOTOS.dish,
    photoAlt: "A seaside taverna with tables by the water",
    screen: SCREENS.post,
    screenAlt: "A Ventzon post carrying the verified visit badge",
  },
  {
    number: "04",
    title: "The feed gets better",
    body: "Friends and locals post about the places they go. Over time, the feed fills with what's actually worth the trip.",
    photo: PHOTOS.table,
    photoAlt: "Shelves of records and books in a warm interior",
    screen: SCREENS.feed,
    screenAlt: "The Ventzon home feed",
  },
];

const merchantSteps = [
  {
    number: "01",
    title: "Claim your shop",
    body: "Create your shop and it appears on the Ventzon map and in local discovery. No hardware, no counter space, no setup fee.",
  },
  {
    number: "02",
    title: "Know who actually showed up",
    body: "A check-in proves someone walked in. You see who's coming back and who's drifting — without friction at the counter.",
  },
  {
    number: "03",
    title: "Rewards at one flat price",
    body: "When you're ready, set a visit goal and a reward. Customers earn it by showing up — $25/month flat, no per-redemption fees.",
  },
];

/* One customer step: number + title + body on one side, editorial photo
   with a device frame (real screenshot) overlapping the other. */
function StepBlock({
  step,
  flip = false,
}: {
  step: (typeof customerSteps)[number];
  flip?: boolean;
}) {
  return (
    <div className="border-t border-white/10 py-16 lg:py-24">
      <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
        <div className={flip ? "lg:order-2" : ""}>
          <p className="font-mono text-[13px] tracking-[0.2em] text-fog-500">{step.number}</p>
          <h3 className="mt-4 text-2xl font-normal tracking-[0.01em] text-fog-100">{step.title}</h3>
          <p className="mt-4 max-w-md text-[15px] font-light leading-[1.8] text-fog-300">{step.body}</p>
        </div>
        <div className={flip ? "lg:order-1" : ""}>
          <div className="relative mx-auto max-w-sm">
            <Parallax className="aspect-[4/5] w-full rounded-[2.6rem]">
              <FadeImage
                src={step.photo}
                alt={step.photoAlt}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </Parallax>
            <div className={`absolute -bottom-12 ${flip ? "right-2" : "left-2"}`}>
              <DeviceFrame className={flip ? "-rotate-3" : "rotate-3"}>
                <FadeImage
                  src={step.screen}
                  alt={step.screenAlt}
                  className="h-full w-full object-cover object-top"
                />
              </DeviceFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="marketing min-h-screen bg-night-950 text-fog-100">
      {/* ── HERO — text left, editorial photo with a device frame right ── */}
      <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(90,30,36,0.06),transparent)]" />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="animate-fade-in anim-delay-200 text-[11px] font-light tracking-[0.5em] text-fog-300 opacity-0">
              HOW IT WORKS
            </p>
            <h1 className="animate-fade-in anim-delay-400 mt-8 font-display text-4xl font-light tracking-[0.01em] text-fog-100 opacity-0 sm:text-5xl lg:text-6xl">
              Find it. Go there. Prove it.
            </h1>
            <p className="animate-fade-in-up anim-delay-600 mt-8 max-w-xl text-base font-light leading-[1.8] text-fog-300 opacity-0 sm:text-lg">
              Ventzon is a local social app. Discover real places, check in
              when you go, and share what they&rsquo;re actually like &mdash;
              with proof you were there.
            </p>
            <div className="animate-fade-in-up anim-delay-800 mt-14 flex flex-col items-start gap-4 opacity-0 sm:flex-row sm:items-center">
              <Link
                href="/customer/explore"
                className="group btn-pill inline-flex items-center gap-3 rounded-full bg-maroon px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white hover:bg-maroon-hover"
              >
                Open the app
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <div className="relative mx-auto max-w-md">
            <Parallax className="aspect-[4/5] w-full rounded-[2.6rem]">
              <FadeImage
                src={PHOTOS.hero}
                alt="A terrace restaurant above the sea at dusk"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </Parallax>
            <div className="absolute -bottom-12 left-2 rotate-3">
              <DeviceFrame>
                <FadeImage
                  src={SCREENS.explore}
                  alt="The Ventzon explore map showing places nearby"
                  className="h-full w-full object-cover object-top"
                />
              </DeviceFrame>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR CUSTOMERS — alternating steps with photos + app frames ── */}
      <section className="px-4 pb-28 sm:px-8 sm:pb-40">
        <Divider className="mx-auto mb-12 max-w-xs" />
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-300">
              FOR CUSTOMERS
            </p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
              A better way to find good places.
            </h2>
          </ScrollReveal>

          <div className="mt-20">
            {customerSteps.map((step, i) => (
              <ScrollReveal key={step.number}>
                <StepBlock step={step} flip={i % 2 === 1} />
              </ScrollReveal>
            ))}
            <div className="border-t border-white/10" />
          </div>
        </div>
      </section>

      {/* ── DIVIDER BAND — full-bleed photo, quiet statement ── */}
      <section className="relative overflow-hidden">
        <FadeImage
          src={PHOTOS.dusk}
          alt="Scanning a QR code at a shop counter"
          loading="lazy"
          className="h-[380px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950/70 via-night-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-center">
          <p className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-light tracking-[-0.01em] text-white">
            Every visit is real. Every recommendation has proof.
          </p>
        </div>
      </section>
      {/* ── FOR SHOPS — steps beside a counter photo with the join frame ── */}
      <section className="px-4 py-28 sm:px-8 sm:py-36">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-fog-300">
              FOR SHOPS
            </p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-[0.01em] sm:text-4xl">
              Get discovered by locals who actually show up.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-fog-300">
              Your shop belongs on the map, with a real customer list behind it.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            <div className="space-y-0">
              {merchantSteps.map((step) => (
                <ScrollReveal key={step.number}>
                  <div className="border-t border-white/10 py-8 lg:py-10">
                    <div className="grid items-start gap-4 lg:grid-cols-[40px_1fr]">
                      <p className="font-mono text-[13px] tracking-[0.2em] text-fog-100">
                        {step.number}
                      </p>
                      <div>
                        <h3 className="text-xl font-normal tracking-[0.01em] text-fog-100">
                          {step.title}
                        </h3>
                        <p className="mt-3 text-[15px] font-light leading-[1.8] text-fog-300">
                          {step.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
              <div className="border-t border-white/10" />
              <ScrollReveal className="mt-12">
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2 text-[12px] font-light tracking-[0.15em] text-fog-300 transition-colors duration-500 ease-luxe hover:text-fog-100"
                >
                  For shops &mdash; learn more
                  <ArrowRight className="h-3 w-3 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                </Link>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={2} className="relative mx-auto max-w-sm">
              <Parallax className="aspect-[4/5] w-full rounded-[2.6rem]">
                <FadeImage
                  src={PHOTOS.counter}
                  alt="The interior of a small boutique"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </Parallax>
              <div className="absolute -bottom-12 left-2 rotate-3">
                <DeviceFrame>
                  <FadeImage
                    src={SCREENS.join}
                    alt="The join page a customer sees when they scan"
                    className="h-full w-full object-cover object-top"
                  />
                </DeviceFrame>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — photo band ── */}
      <section className="px-4 pb-8 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[3rem]">
          <FadeImage
            src={PHOTOS.goldenHour}
            alt="Two people behind a shop counter"
            loading="lazy"
            className="h-[460px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-warm/70 via-ink-warm/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-center sm:p-14">
            <ScrollReveal>
              <h2 className="font-display text-3xl font-light tracking-[0.01em] text-white sm:text-4xl">
                See what&rsquo;s near you.
              </h2>
              <p className="mt-5 text-base font-light text-white/85">
                Free for customers. No download required.
              </p>
              <div className="mt-9">
                <Link
                  href="/customer/explore"
                  className="group btn-pill inline-flex items-center gap-3 rounded-full bg-white px-10 py-4 text-[13px] font-light tracking-[0.15em] text-black hover:bg-night-950"
                >
                  Open the app
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

