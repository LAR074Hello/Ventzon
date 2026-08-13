"use client";

import { useState, useLayoutEffect, useRef } from "react";

/**
 * A person's avatar — never an empty circle.
 *
 * Eight identical placeholder circles is nearly as anonymous as eight accounts
 * all called "Creator": a feed where everyone looks the same fails the same
 * test, which is whether eight friends can tell each other apart.
 *
 * So the fallback is DETERMINISTIC, not decorative: the same person always gets
 * the same initials on the same tint, on every surface, forever. That is what
 * makes it function as identity rather than as a placeholder.
 *
 * ON COLOUR, and the precedent it has to respect: per-shop hashed accent
 * colours were tried and rejected (design-notes) because eight random hues made
 * every screen a different colour story. That rejection is about PLACES wearing
 * arbitrary brand colour, and it still stands. This is different in kind — a
 * 32px disc behind two letters — but the lesson carries, so the palette is six
 * restrained tints drawn from the existing primitives rather than a rainbow.
 * The text stays ink in both themes; the tint only has to separate people.
 */

const TINTS = [
  "var(--paper-200)",
  "var(--maroon-100)",
  "var(--surface-sunken)",
  "var(--paper-100)",
  "var(--accent-muted)",
  "var(--surface-overlay)",
];

/**
 * Contrast guard for the initials disc.
 *
 * The palette mixes light pastels (paper-100/200, maroon-100) with
 * theme-adaptive surfaces. In light theme every entry is >=13:1 against
 * --text-primary (ink). In dark theme --text-primary is fog, and the three
 * pastels resolve to cream — paper-100 measured at 1.04:1, cream on cream
 * (the blank "disc" under "Ilse Bergman"). A name must never land on an
 * unreadable pair, so the chosen tint is verified at runtime against the
 * resolved --text-primary: if it fails WCAG AA (4.5:1), the guard swaps to a
 * legible palette entry — still deterministic per seed, still distinct
 * people. The legible set in dark theme (night-900 15.6:1, maroon-900 13.3:1,
 * night-600 12.8:1) is what keeps the disc readable.
 */
const MIN_INITIALS_CONTRAST = 4.5;

function toRgb(s: string): [number, number, number] | null {
  const t = s.trim();
  // Custom properties compute to hex (#efe9e3) in modern engines; computed
  // styles may also surface rgb()/rgba(). Handle both.
  if (t.startsWith("#")) {
    const hex = t.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const m = full.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }
  const m = t.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** WCAG 2.1 relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Resolve a custom-property name against the live document. */
function resolveVar(name: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    getComputedStyle(document.body).getPropertyValue(name).trim()
  );
}

/** FNV-1a. Small, stable, and identical on server and client. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

/**
 * Up to two letters. "Mara Ellison" → MA, "mara" → MA, "" → ·
 * Initials from a two-word name beat a single letter for telling people apart,
 * which is the entire job.
 */
export function initialsFor(name: string | null | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return "·";
  const words = n.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

export default function Avatar({
  name,
  /** Stable identity for the tint — email or profile id, NOT the display name,
   *  so renaming yourself does not change the colour people recognise you by. */
  seed,
  url,
  size = 32,
  className = "",
}: {
  name: string | null | undefined;
  seed: string;
  url?: string | null;
  size?: number;
  className?: string;
}) {
  const px = `${size}px`;
  // A set-but-broken avatar_url (deleted storage object, 404, network) used to
  // render a blank disc with no fallback. On image error, swap to the same
  // deterministic initials disc a missing avatar gets — never an empty circle.
  const [failed, setFailed] = useState(false);

  // Guarded tint: the layout effect applies the legible background directly to
  // the disc before paint (no state, no re-render), and re-applies when the
  // theme flips. A name can never render an unreadable pair.
  const discRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = discRef.current;
    if (!el) return;
    const apply = () => {
      const initials = toRgb(resolveVar("--text-primary"));
      if (!initials) {
        el.style.background = TINTS[hash(seed) % TINTS.length];
        return;
      }
      const rated = TINTS.map((t) => {
        const c = toRgb(resolveVar(t.slice(4, -1)));
        return { tint: t, ratio: c ? contrast(c, initials) : 0 };
      });
      const picked = rated[hash(seed) % rated.length];
      const legible = rated.filter((r) => r.ratio >= MIN_INITIALS_CONTRAST);
      let chosen = picked.tint;
      if (picked.ratio < MIN_INITIALS_CONTRAST) {
        // Refuse the unreadable pair. Rotate through the legible set with a
        // second hash so people who share a palette slot still differ.
        chosen = legible.length
          ? legible[hash(`${seed}:fallback`) % legible.length].tint
          : rated.slice().sort((a, b) => b.ratio - a.ratio)[0].tint;
      }
      el.style.background = chosen;
    };
    apply();
    const doc = document.documentElement;
    const mo = new MutationObserver(apply);
    mo.observe(doc, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [seed, failed]);

  if (url && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied URLs from Supabase storage, not a known loader
      <img
        src={url}
        alt={name ?? ""}
        onError={() => setFailed(true)}
        style={{ width: px, height: px }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      ref={discRef}
      aria-hidden
      style={{
        width: px,
        height: px,
        // Background is deliberately NOT in this style object: the guard sets
        // it via the ref, and React must not own it or a later re-render would
        // reset it to a transient value. The guard runs pre-paint, so the disc
        // never appears without its legible tint.
        color: "var(--text-primary)",
        // Scales with the disc so a 24px avatar and a 72px one look related.
        fontSize: `${Math.max(9, Math.round(size * 0.38))}px`,
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${className}`}
    >
      {initialsFor(name)}
    </span>
  );
}
