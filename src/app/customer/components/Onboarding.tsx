"use client";

import { useState, useEffect } from "react";
import { MapPin, BadgeCheck, Users } from "lucide-react";

const SLIDES = [
  {
    icon: MapPin,
    title: "Every place near you",
    sub: "Thousands of real spots in your neighbourhood — the coffee place on the corner, the bar you keep meaning to try.",
    accent: "var(--text-muted)",
  },
  {
    icon: BadgeCheck,
    title: "Proof you were there",
    // The differentiator went unmentioned in onboarding entirely — a new user
    // heard "post photos of places", which describes a dozen other apps. The
    // verified visit is the one claim nothing else can make, so it is said
    // plainly, on its own slide, before the ask.
    sub: "Check in and your post carries a verified visit. Not a review from someone who never went — proof.",
    accent: "var(--text-muted)",
  },
  {
    icon: Users,
    title: "Post one photo to start",
    sub: "Pick a place near you and share it. Your friends see it first — and the feed fills up from there.",
    accent: "var(--accent)",
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
      className="fixed inset-0 z-[100] flex flex-col bg-surface"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Skip */}
      {!isLast && (
        <div className="flex justify-end px-6 pt-4">
          <button
            onClick={onFinish}
            className="-mr-2 px-2 py-2 text-sm font-medium text-muted"
          >
            Skip
          </button>
        </div>
      )}

      {/* Content */}
      <div key={idx} className="flex flex-1 flex-col items-center justify-center px-8 pb-8 text-center animate-slide-in">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-sheet mb-8"
          style={{ backgroundColor: accent + "18", border: `1px solid ${accent}30` }}
        >
          <Icon className="h-10 w-10" style={{ color: accent }} strokeWidth={1} />
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-primary">
          {title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-secondary">{sub}</p>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-10 space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 6, backgroundColor: i === idx ? "var(--text-primary)" : "var(--border-subtle)" }}
            />
          ))}
        </div>

        {/* text-black was black-on-near-black once the base theme went light —
            the label was effectively invisible. text-inverse tracks the fill
            in both themes. */}
        <button
          onClick={next}
          className="w-full rounded-card bg-primary py-4 text-base font-medium text-inverse transition-colors active:opacity-80"
        >
          {isLast ? "Get started" : "Continue"}
        </button>
      </div>
    </div>
  );
}
