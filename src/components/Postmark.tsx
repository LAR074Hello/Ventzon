/**
 * Postmark — the signature element.
 *
 * A postal-style stamped mark applied to media that carries a verified
 * visit. It should read as PROOF, not as a punchcard: the vocabulary of
 * a passport arrival stamp, pressed slightly off-square onto the photo.
 *
 * Naming: "stamp" is load-bearing loyalty vocabulary in this codebase
 * (RewardMode = "stamps" | "points", animate-stamp-pop, the dot rows).
 * This is deliberately NOT called VisitStamp. The plain-English UI copy
 * for what it represents stays "verified visit"; --stamp is its colour
 * token and lives in its own indigo lane, separate from accent green
 * and danger red so proof can never be mistaken for an error.
 *
 * Renders as a server component. The arc path id is derived from the
 * content rather than useId() so this stays off the client bundle;
 * identical props yield an identical id, which is harmless because the
 * geometry is identical too.
 */

const SIZES = {
  sm: 48, // grid thumbnails — detail reads as texture, as a real stamp does
  md: 68, // feed media
  lg: 92, // post detail, hero media
} as const;

export type PostmarkSize = keyof typeof SIZES;

/** djb2, trimmed — only needs to be stable and collision-tolerant. */
function stableId(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * Date-only strings ("2026-07-24") parse as UTC midnight, which lands on
 * the previous day in every negative-offset timezone — a visit stamped
 * "24 JUL" would read "23 JUL" in San Francisco. Parse those as local.
 */
function parseVisitDate(value: Date | string): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatStampDate(date: Date): string {
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  return `${String(date.getDate()).padStart(2, "0")} ${months[date.getMonth()]}`;
}

export default function Postmark({
  place,
  date,
  size = "md",
  animate = false,
  decorative = false,
  className = "",
}: {
  /** Place name arced across the top. Truncated to fit the ring. */
  place?: string;
  /** When the visit was verified. */
  date?: Date | string;
  size?: PostmarkSize;
  /** Play the press-down impression. Use on the moment it is earned. */
  animate?: boolean;
  /** True when adjacent visible text already conveys the same thing. */
  decorative?: boolean;
  className?: string;
}) {
  const px = SIZES[size];

  const valid = date ? parseVisitDate(date) : null;
  const dateLabel = valid ? formatStampDate(valid) : "";

  // The ring holds roughly 18 characters before it crowds.
  const raw = (place ?? "").trim().toUpperCase();
  const arcLabel = raw.length > 18 ? `${raw.slice(0, 17)}…` : raw || "VENTZON";

  const uid = stableId(`${arcLabel}|${dateLabel}|${size}`);
  const arcPathId = `pm-arc-${uid}`;

  const a11yLabel = [
    "Verified visit",
    raw && `at ${raw}`,
    valid && `on ${valid.toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      width={px}
      height={px}
      className={`${animate ? "animate-postmark-press " : ""}${className}`}
      style={{
        color: "var(--stamp)",
        // Pressed by hand, not printed by a machine.
        transform: animate ? undefined : "rotate(-8deg)",
        // Slight ink transparency so the photo shows through the mark.
        opacity: 0.92,
      }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : a11yLabel}
      aria-hidden={decorative || undefined}
      focusable="false"
    >
      <defs>
        {/* Upper half-circle, left→right, so arced text sits upright. */}
        <path id={arcPathId} d="M 12,50 A 38,38 0 0 1 88,50" fill="none" />
      </defs>

      {/* Double ring — the outer heavy, the inner hairline. */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1.25" />

      {/* Place, arced through the annulus. Letterspacing is idiomatic
          here and is the one sanctioned exception to the tracking
          policy — it is lettering on a seal, not UI type. */}
      <text
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="8.5"
        fontWeight="500"
        letterSpacing="1.1"
      >
        <textPath href={`#${arcPathId}`} startOffset="50%" textAnchor="middle">
          {arcLabel}
        </textPath>
      </text>

      {/* Date band — two rules with the date struck between them. */}
      <line x1="24" y1="45" x2="76" y2="45" stroke="currentColor" strokeWidth="1" />
      <text
        x="50"
        y="57.5"
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="12"
        fontWeight="500"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        {dateLabel}
      </text>
      <line x1="24" y1="62" x2="76" y2="62" stroke="currentColor" strokeWidth="1" />

      {/* The claim, in small print, where a postmark carries its office. */}
      <text
        x="50"
        y="73.5"
        fill="currentColor"
        fontFamily="var(--font-mono)"
        fontSize="6.5"
        fontWeight="400"
        textAnchor="middle"
        letterSpacing="0.7"
      >
        VERIFIED VISIT
      </text>
    </svg>
  );
}
