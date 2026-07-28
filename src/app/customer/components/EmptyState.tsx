"use client";

import type { LucideIcon } from "lucide-react";

/**
 * EmptyState — the shared empty surface.
 *
 * At launch, empty is the DEFAULT state, not an edge case: the OSM import
 * populates thousands of real places and none of them have a post yet. The
 * first thing a new user sees is therefore an empty screen, which makes this
 * the highest-traffic component in the app on day one.
 *
 * The rule is RECRUIT, DON'T APOLOGISE. "Nothing here yet" tells the user the
 * product is broken or abandoned. "No one's posted here yet — be the first"
 * tells them there is a job open and they are qualified for it. Same fact,
 * opposite invitation.
 *
 * Every empty state gets an action. An empty screen with no way forward is a
 * dead end, and a dead end on first run is the whole first impression.
 */
export default function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  body,
  primary,
  secondary,
  compact = false,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  body?: React.ReactNode;
  primary?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  /** Inline variant for a card slot (a grid, a sheet) rather than a full screen. */
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-card text-center ${
        compact ? "px-5 py-9" : "px-8 py-14"
      }`}
      style={compact ? { boxShadow: "inset 0 0 0 1px var(--border-subtle)" } : undefined}
    >
      {Icon && (
        <div
          className={`elevation-1 flex items-center justify-center rounded-sheet ${
            compact ? "h-12 w-12" : "h-16 w-16"
          }`}
        >
          <Icon className={compact ? "h-5 w-5 text-muted" : "h-7 w-7 text-muted"} strokeWidth={1.5} />
        </div>
      )}

      {eyebrow && (
        <p className="text-2xs font-semibold uppercase tracking-caps text-muted mt-5">{eyebrow}</p>
      )}

      <p
        className={`font-display font-semibold tracking-tight text-primary ${
          compact ? "text-base mt-4" : "text-xl mt-4"
        }`}
      >
        {title}
      </p>

      {body && (
        <p
          className={`leading-relaxed text-secondary font-normal ${
            compact ? "text-sm mt-1.5" : "text-base mt-2.5 max-w-[34ch]"
          }`}
        >
          {body}
        </p>
      )}

      {(primary || secondary) && (
        <div className="mt-7 flex flex-col items-center gap-3">
          {primary && (
            <button
              onClick={primary.onClick}
              className="text-xs font-semibold uppercase tracking-caps text-inverse rounded-full bg-primary px-7 py-3.5 transition-all duration-300 active:opacity-80"
            >
              {primary.label}
            </button>
          )}
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="text-xs font-semibold uppercase tracking-caps text-secondary px-6 py-2 transition-colors duration-300 hover:text-primary"
            >
              {secondary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
