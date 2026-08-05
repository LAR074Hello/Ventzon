// src/app/how-it-works/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";

const customerSteps = [
  {
    number: "01",
    title: "Find a place near you",
    body: "Browse thousands of real local spots on the Ventzon map — coffee shops, parks, bookshops, the corner bar. No ads, no algorithm, no listings you've never heard of.",
  },
  {
    number: "02",
    title: "Go there. Check in.",
    body: "Checking in takes seconds. Your visits add up — and where a shop runs a reward, you earn it just for showing up.",
  },
  {
    number: "03",
    title: "Share a verified visit",
    body: "Post a photo or a note about the place and it carries a verified visit badge — proof you were really there, not a review from someone who wasn't.",
  },
  {
    number: "04",
    title: "The feed gets better",
    body: "Friends and locals post about the places they go. Over time, the feed fills with what's actually worth the trip.",
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
    title: "Rewards that only pay when they work",
    body: "When you're ready, set a visit goal and a reward. Customers earn it by showing up, and you pay only when one is actually redeemed.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* ── HERO ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.04),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="animate-fade-in anim-delay-200 text-[11px] font-light tracking-[0.5em] text-[#666] opacity-0">
            HOW IT WORKS
          </p>
          <h1 className="animate-fade-in anim-delay-400 mt-8 text-4xl font-extralight tracking-[-0.02em] text-white opacity-0 sm:text-5xl lg:text-6xl">
            Find it. Go there. Prove it.
          </h1>
          <p className="animate-fade-in-up anim-delay-600 mx-auto mt-8 max-w-xl text-base font-light leading-[1.8] text-[#888] opacity-0 sm:text-lg">
            Ventzon is a local social app. Discover real places, check in
            when you go, and share what they&rsquo;re actually like &mdash;
            with proof you were there.
          </p>
          <div className="animate-fade-in-up anim-delay-800 mt-14 flex flex-col items-center gap-4 opacity-0 sm:flex-row sm:justify-center">
            <Link
              href="/customer/explore"
              className="inline-flex items-center gap-3 rounded-full border border-white/40 px-8 py-3.5 text-[12px] font-light tracking-[0.15em] text-white transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
            >
              Open the app
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="animate-fade-in anim-delay-1200 absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0">
          <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-[#444] to-transparent" />
        </div>
      </section>

      {/* ── FOR CUSTOMERS ── */}
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              FOR CUSTOMERS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              A better way to find good places.
            </h2>
          </ScrollReveal>

          <div className="mt-16 space-y-0">
            {customerSteps.map((step) => (
              <ScrollReveal key={step.number}>
                <div className="border-t border-[#161616] py-8 lg:py-10">
                  <div className="grid items-start gap-4 lg:grid-cols-[40px_1fr]">
                    <p className="font-mono text-[13px] tracking-[0.2em] text-[#333]">
                      {step.number}
                    </p>
                    <div>
                      <h3 className="text-xl font-normal tracking-[0.02em] text-[#ededed]">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-[15px] font-light leading-[1.8] text-[#888]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
            <div className="border-t border-[#161616]" />
          </div>
        </div>
      </section>
      {/* ── FOR SHOPS ── */}
      <section className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="luxury-divider mx-auto mb-20 max-w-xs" />
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="text-center">
            <p className="text-[11px] font-light tracking-[0.5em] text-[#666]">
              FOR SHOPS
            </p>
            <h2 className="mt-6 text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
              Get discovered by locals who actually show up.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[15px] font-light leading-[1.8] text-[#666]">
              Your shop belongs on the map, with a real customer list behind it.
            </p>
          </ScrollReveal>

          <div className="mt-16 space-y-0">
            {merchantSteps.map((step) => (
              <ScrollReveal key={step.number}>
                <div className="border-t border-[#161616] py-8 lg:py-10">
                  <div className="grid items-start gap-4 lg:grid-cols-[40px_1fr]">
                    <p className="font-mono text-[13px] tracking-[0.2em] text-[#333]">
                      {step.number}
                    </p>
                    <div>
                      <h3 className="text-xl font-normal tracking-[0.02em] text-[#ededed]">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-[15px] font-light leading-[1.8] text-[#888]">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
            <div className="border-t border-[#161616]" />
          </div>

          <ScrollReveal className="mt-12 text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-500 hover:text-[#ededed]"
            >
              For shops &mdash; learn more
              <ArrowRight className="h-3 w-3" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-4 sm:px-8 py-28 sm:py-36">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extralight tracking-[-0.02em] sm:text-4xl">
            See what&rsquo;s near you.
          </h2>
          <p className="mt-6 text-base font-light leading-relaxed text-[#666]">
            Free for customers. No download required.
          </p>
          <Link
            href="/customer/explore"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-[#ededed] px-10 py-4 text-[13px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
          >
            Open the app
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </ScrollReveal>
      </section>

      <SiteFooter />
    </main>
  );
}

