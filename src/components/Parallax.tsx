"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

/**
 * Subtle Apple-style image movement: the image sits in an overflow-hidden
 * frame, scaled slightly, and drifts a few percent as it passes through the
 * viewport. Movement only — no fade, no pop — and it never uncovers the
 * frame's edges (the inner layer is taller than the frame).
 *
 * Measured from window scroll rather than an element anchor: the same
 * reason HeroScroll does — element-anchored progress proved unreliable here.
 */
export default function Parallax({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ top: 0, height: 0 });

  useEffect(() => {
    const measure = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) pos.current = { top: r.top + window.scrollY, height: r.height };
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, []);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (sy) => {
    const { top, height } = pos.current;
    if (!height) return "0%";
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (sy + vh - top) / (vh + height)));
    return `${(-7 + p * 14).toFixed(2)}%`;
  });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="h-[118%] w-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}
