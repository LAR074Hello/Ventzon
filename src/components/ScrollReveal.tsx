"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3;
  /** "rise" — the default gentle rise; "line" — a hairline drawing in. */
  variant?: "rise" | "line";
}

export default function ScrollReveal({
  children,
  className = "",
  delay,
  variant = "rise",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay ? `delay-${delay}` : "";
  const base = variant === "line" ? "scroll-line" : "scroll-fade-in";

  return (
    <div ref={ref} className={`${base} ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
