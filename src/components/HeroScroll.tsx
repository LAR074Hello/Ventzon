"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, MotionConfig } from "motion/react";

/**
 * The landing hero — a full-screen pinned background video with a dark
 * overlay, handing off to the "Unleash Unbridled Loyalty" statement section.
 *
 * The video section is sticky, so it stays pinned while the dark statement
 * section slides over it (Apple's pinned-video reveal). Scroll progress is
 * measured on the wrapper over the first viewport of scroll — the exact
 * window in which the statement covers the video — and drives a subtle
 * scale-up and fade on the video plus a drift on the hero copy.
 */
export default function HeroScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "start end"],
  });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.15]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={wrapRef} className="relative">
        {/* ── PINNED HERO — full-screen video ── */}
        <section className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <motion.video
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-poster.jpg"
            style={{ scale: videoScale, opacity: videoOpacity }}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </motion.video>

          {/* Dark overlay — keeps the white copy readable on every frame */}
          <div className="absolute inset-0 bg-night-950/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-night-950/60 via-transparent to-night-950" />

          <motion.div
            style={{ opacity: contentOpacity, y: contentY }}
            className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center"
          >
            <p className="text-[12px] font-medium uppercase tracking-[0.25em] text-white/85">
              Local discovery, with proof
            </p>
            <h1 className="mt-8 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-white">
              Find real places.
              <br />
              See who&rsquo;s actually there.
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-[1.7] text-white/90">
              Ventzon is a local social app. Browse real spots near you, check in
              when you go, and share what they&rsquo;re actually like &mdash; with
              proof you were there.
            </p>
            <div className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
              <Link
                href="/customer/explore"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-9 py-4 text-[15px] font-medium text-black shadow-warm transition-all duration-300 hover:-translate-y-0.5 hover:bg-cream"
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
            <p className="mt-10 text-sm text-white/70">Free for customers &middot; no download</p>
          </motion.div>
        </section>

        {/* ── STATEMENT — slides over the pinned video ── */}
        <section className="relative z-10 flex min-h-[85svh] items-center justify-center overflow-hidden bg-night-950 px-6 py-28">
          <motion.div
            style={{ opacity: glowOpacity }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(90,30,36,0.22),transparent)]"
          />
          <div className="relative text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-900 ring-1 ring-maroon-800">
              <span className="font-display text-xl font-semibold text-white">V</span>
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-10 max-w-4xl font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white"
            >
              Unleash Unbridled Loyalty
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-8 max-w-xl text-lg font-light leading-[1.7] text-fog-300"
            >
              Real places. Verified visits. Posts you can trust.
            </motion.p>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}
