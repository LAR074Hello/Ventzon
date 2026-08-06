"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, MotionConfig } from "motion/react";

/**
 * The landing hero — a full-screen pinned background video that opens with
 * nothing but the film, then reveals the interface as the user scrolls.
 *
 * Nothing is on screen at rest. Within the first few percent of scroll the
 * header (SiteHeader) and the centered copy fade in; the video stays pinned
 * while it scales up and darkens, and the night-950 statement section —
 * carrying the same two lines — slides over it (Apple's pinned-video
 * handoff). Scroll progress is measured on the wrapper over the first
 * viewport of scroll.
 */
export default function HeroScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Progress = how far the first viewport of scroll has happened. Measured
  // from the window directly rather than an element: the pinned (sticky)
  // hero makes element-anchored progress unreliable, and window scroll is
  // exact for the "reveal over the first 5-10%" behavior.
  const vhRef = useRef(800);
  useEffect(() => {
    const update = () => {
      vhRef.current = window.innerHeight;
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) => Math.max(0, Math.min(1, y / vhRef.current)));

  // Video: subtle scale-up; fades as the statement section covers it.
  const videoScale = useTransform(progress, [0, 1], [1, 1.12]);
  const videoOpacity = useTransform(progress, [0.4, 0.95], [1, 0.1]);

  // Readability veil: invisible at rest, strengthens as the copy appears.
  const veilOpacity = useTransform(progress, [0.06, 0.4], [0, 0.5]);

  // Centered copy: fades in just after the header reveals, stays through the
  // transition, then crossfades as the statement takes over.
  const headlineOpacity = useTransform(progress, [0.06, 0.2, 0.78, 0.94], [0, 1, 1, 0]);
  const headlineY = useTransform(progress, [0.06, 0.2], [24, 0]);
  const subOpacity = useTransform(progress, [0.12, 0.26, 0.8, 0.95], [0, 1, 1, 0]);
  const subY = useTransform(progress, [0.12, 0.26], [20, 0]);

  return (
    <MotionConfig reducedMotion="user">
      <div ref={wrapRef} className="relative">
        {/* ── PINNED HERO — nothing but the film at rest ── */}
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

          {/* Readability veil — invisible at rest, grows with the copy */}
          <motion.div style={{ opacity: veilOpacity }} className="absolute inset-0 bg-night-950" />
          {/* Seam — melts the video into the statement section below */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-950 to-transparent" />

          {/* Centered copy — fades in on scroll, stays through the transition */}
          <div className="relative z-10 px-6 text-center">
            <motion.h1
              style={{ opacity: headlineOpacity, y: headlineY }}
              className="font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white"
            >
              Unleash Unbridled Loyalty
            </motion.h1>
            <motion.p
              style={{ opacity: subOpacity, y: subY }}
              className="mx-auto mt-6 max-w-xl text-lg font-light leading-[1.7] text-white/85"
            >
              Find real places. See who&rsquo;s actually there.
            </motion.p>
          </div>
        </section>

        {/* ── STATEMENT — same centered copy, slides over the pinned video ── */}
        <section className="relative z-10 flex min-h-[85svh] items-center justify-center overflow-hidden bg-night-950 px-6 py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(90,30,36,0.16),transparent)]" />
          <div className="relative text-center">
            <motion.h2
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white"
            >
              Unleash Unbridled Loyalty
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-6 max-w-xl text-lg font-light leading-[1.7] text-fog-300"
            >
              Find real places. See who&rsquo;s actually there.
            </motion.p>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}
