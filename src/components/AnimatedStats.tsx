"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  value: number;
  suffix: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 10000, suffix: "+", label: "Customer check-ins" },
  { value: 500, suffix: "+", label: "Local businesses" },
  { value: 98, suffix: "%", label: "Customer return rate" },
];

function useCountUp(target: number, started: boolean, duration = 2200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, started, duration]);

  return count;
}

function StatItem({ stat, started }: { stat: Stat; started: boolean }) {
  const count = useCountUp(stat.value, started);

  return (
    <div className="text-center">
      <div className="text-4xl font-extralight tracking-tight text-[#ededed] sm:text-5xl">
        {started ? count.toLocaleString() : "0"}
        <span className="text-[#555]">{stat.suffix}</span>
      </div>
      <div className="mt-3 text-[11px] font-light tracking-[0.2em] text-[#666]">
        {stat.label}
      </div>
    </div>
  );
}

export default function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-1 gap-12 sm:grid-cols-3">
      {STATS.map((stat) => (
        <StatItem key={stat.label} stat={stat} started={started} />
      ))}
    </div>
  );
}
