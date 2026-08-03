"use client";

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
  "var(--green-100)",
  "var(--surface-sunken)",
  "var(--paper-100)",
  "var(--accent-muted)",
  "var(--surface-overlay)",
];

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

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-supplied URLs from Supabase storage, not a known loader
      <img
        src={url}
        alt={name ?? ""}
        style={{ width: px, height: px }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const tint = TINTS[hash(seed) % TINTS.length];

  return (
    <span
      aria-hidden
      style={{
        width: px,
        height: px,
        background: tint,
        // Scales with the disc so a 24px avatar and a 72px one look related.
        fontSize: `${Math.max(9, Math.round(size * 0.38))}px`,
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none text-primary ${className}`}
    >
      {initialsFor(name)}
    </span>
  );
}
