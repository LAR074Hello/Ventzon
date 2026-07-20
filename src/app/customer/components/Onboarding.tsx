"use client";

import { useState, useEffect } from "react";
import { ScanLine, Gift, Compass } from "lucide-react";

const SLIDES = [
  {
    icon: Compass,
    title: "Discover local rewards",
    sub: "Find participating stores near you and start earning rewards every time you visit.",
    accent: "var(--muted)",
  },
  {
    icon: ScanLine,
    title: "Scan & check in",
    sub: "Tap Scan and point your camera at any Ventzon QR code in-store. It takes two seconds.",
    accent: "var(--muted)",
  },
  {
    icon: Gift,
    title: "Get rewarded",
    sub: "Collect stamps or points with every visit. Hit your goal, show your card at the register, and the reward's yours.",
    accent: "var(--gold)",
  },
];

const KEY = "ventzon_onboarded_v1";

export function useOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  function finish() {
    localStorage.setItem(KEY, "1");
    setShow(false);
  }

  return { show, finish };
}

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;

  function next() {
    if (isLast) { onFinish(); return; }
    setIdx((i) => i + 1);
  }

  const { icon: Icon, title, sub, accent } = SLIDES[idx];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Skip */}
      {!isLast && (
        <div className="flex justify-end px-6 pt-4">
          <button onClick={onFinish} className="text-[12px] font-light tracking-[0.15em] text-muted">SKIP</button>
        </div>
      )}

      {/* Content */}
      <div key={idx} className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-fade-in-up">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-sheet mb-10"
          style={{ backgroundColor: accent + "18", border: `1px solid ${accent}30` }}
        >
          <Icon className="h-10 w-10" style={{ color: accent }} strokeWidth={1} />
        </div>
        <h2 className="text-[26px] font-extralight tracking-[-0.02em] text-ink leading-tight">{title}</h2>
        <p className="mt-4 text-[14px] font-light leading-relaxed text-muted">{sub}</p>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-10 space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 6, backgroundColor: i === idx ? "var(--ink)" : "var(--line)" }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full rounded-card bg-ink py-4 text-[13px] font-light tracking-[0.2em] text-black active:opacity-80 transition-colors"
        >
          {isLast ? "GET STARTED" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
}
