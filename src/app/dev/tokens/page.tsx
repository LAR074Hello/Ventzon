import type { Metadata } from "next";
import Postmark from "@/components/Postmark";

export const metadata: Metadata = {
  title: "Token reference — Ventzon",
  robots: { index: false, follow: false },
};

/* ═══════════════════════════════════════════════════════════════════
   /dev/tokens — the Slice 1.1 verification surface.

   Every semantic role in both themes side by side, the full type
   scale, and the Postmark on light and dark media. Both theme panels
   are nested [data-theme] containers, which is also the proof that the
   token layer is attribute-scoped rather than html-only.
   ═══════════════════════════════════════════════════════════════════ */

type Theme = "light" | "dark";

const ROLES: Record<
  string,
  { light: string; dark: string; desc: string; group: string }
> = {
  surface: { light: "#F6F7F4", dark: "#101211", desc: "page background", group: "Surface" },
  "surface-raised": { light: "#FFFFFF", dark: "#191C1A", desc: "cards, sheets", group: "Surface" },
  "surface-sunken": { light: "#EDEFEA", dark: "#0A0C0B", desc: "wells, inputs", group: "Surface" },
  "surface-overlay": { light: "#FFFFFF", dark: "#1E2220", desc: "modals, popovers", group: "Surface" },

  "text-primary": { light: "#16181C", dark: "#EDEFEA", desc: "body, headlines", group: "Text" },
  "text-secondary": { light: "#3A3F45", dark: "#B4BAB5", desc: "supporting copy", group: "Text" },
  "text-muted": { light: "#5F656C", dark: "#8B928C", desc: "metadata — still AA", group: "Text" },
  "text-inverse": { light: "#F6F7F4", dark: "#101211", desc: "on inverted fills", group: "Text" },

  "border-subtle": { light: "#E0E3DC", dark: "#262A27", desc: "decorative hairlines", group: "Border" },
  "border-strong": { light: "#7C838A", dark: "#666E68", desc: "control outlines — 3:1", group: "Border" },
  "border-media": { light: "transparent", dark: "rgb(255 255 255 / 0.10)", desc: "inverts: off in light", group: "Border" },

  accent: { light: "#12513F", dark: "#3FA88A", desc: "civic green", group: "Accent" },
  "accent-hover": { light: "#1A6B53", dark: "#56BE9F", desc: "hover / pressed", group: "Accent" },
  "accent-muted": { light: "#DCEBE4", dark: "#1B2E28", desc: "chips, tinted fills", group: "Accent" },
  "on-accent": { light: "#FFFFFF", dark: "#06120E", desc: "label on accent", group: "Accent" },

  danger: { light: "#C63122", dark: "#FF6B5C", desc: "errors, destructive", group: "Danger" },
  "on-danger": { light: "#FFFFFF", dark: "#2A0A06", desc: "label on danger", group: "Danger" },

  stamp: { light: "#33368F", dark: "#7C7FE8", desc: "verified visit only", group: "Stamp" },

  "focus-ring": { light: "#1A6B53", dark: "#56BE9F", desc: "keyboard focus", group: "Focus" },
};

const GROUPS = ["Surface", "Text", "Border", "Accent", "Danger", "Stamp", "Focus"];

const TYPE_SCALE: { name: string; px: number; lh: number; track: string; use: string }[] = [
  { name: "text-2xs", px: 11, lh: 16, track: "0", use: "legal, dense tabular metadata" },
  { name: "text-xs", px: 12, lh: 18, track: "0", use: "timestamps, captions, mono data" },
  { name: "text-sm", px: 14, lh: 21, track: "0", use: "secondary UI, labels" },
  { name: "text-base", px: 16, lh: 24, track: "0", use: "BODY DEFAULT" },
  { name: "text-md", px: 17, lh: 26, track: "0", use: "primary row text" },
  { name: "text-lg", px: 20, lh: 28, track: "-0.005em", use: "card titles" },
  { name: "text-xl", px: 24, lh: 32, track: "-0.01em", use: "section titles" },
  { name: "text-2xl", px: 30, lh: 36, track: "-0.015em", use: "place names" },
  { name: "text-3xl", px: 38, lh: 44, track: "-0.02em", use: "page titles" },
  { name: "text-4xl", px: 48, lh: 52, track: "-0.025em", use: "hero" },
  { name: "text-5xl", px: 60, lh: 62, track: "-0.03em", use: "hero, display only" },
];

/* A stand-in for photography. Deliberately edged in tones close to the
   dark page colour, which is precisely when --border-media earns its
   keep. No asset dependency, so this page never renders broken. */
function FakeMedia({ className = "" }: { className?: string }) {
  return (
    <div
      className={`media-frame overflow-hidden rounded-tile ${className}`}
      style={{
        background:
          "linear-gradient(150deg, #2b3a34 0%, #55605a 38%, #8a8378 62%, #1a1d1b 100%)",
      }}
    />
  );
}

function Swatch({ role, theme }: { role: string; theme: Theme }) {
  const r = ROLES[role];
  const value = r[theme];
  const isTransparent = value === "transparent";
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 shrink-0 rounded-ctl"
        style={{
          backgroundColor: `var(--${role})`,
          boxShadow: "inset 0 0 0 1px var(--border-subtle)",
          backgroundImage: isTransparent
            ? "repeating-conic-gradient(var(--border-subtle) 0% 25%, transparent 0% 50%)"
            : undefined,
          backgroundSize: isTransparent ? "8px 8px" : undefined,
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs text-primary">--{role}</p>
        <p className="text-2xs text-muted">{r.desc}</p>
      </div>
      <p className="shrink-0 font-mono text-2xs text-muted">{value}</p>
    </div>
  );
}

/** A whole themed panel. Everything inside is built from utilities
    only — no inline colours — so this doubles as the wiring proof. */
function ThemePanel({ theme }: { theme: Theme }) {
  return (
    <section
      data-theme={theme}
      className="rounded-card bg-surface p-6"
      style={{ boxShadow: "0 0 0 1px var(--border-subtle)" }}
    >
      <header className="mb-6 flex items-baseline justify-between">
        <h3 className="font-display text-xl font-semibold tracking-tight text-primary">
          {theme === "light" ? "Light" : "Dark"}
        </h3>
        <p className="font-mono text-2xs uppercase tracking-caps text-muted">
          data-theme=&quot;{theme}&quot;
        </p>
      </header>

      <div className="flex flex-col gap-7">
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="mb-3 font-mono text-2xs uppercase tracking-caps text-muted">
              {g}
            </p>
            <div className="flex flex-col gap-3">
              {Object.keys(ROLES)
                .filter((k) => ROLES[k].group === g)
                .map((k) => (
                  <Swatch key={k} role={k} theme={theme} />
                ))}
            </div>
          </div>
        ))}

        {/* ── Wiring proof: real components, utilities only ── */}
        <div>
          <p className="mb-3 font-mono text-2xs uppercase tracking-caps text-muted">
            Components — utilities only, no dark: variants
          </p>
          <div className="flex flex-col gap-3">
            <div className="elevation-1 rounded-card p-4">
              <p className="font-display text-lg font-semibold tracking-tight text-primary">
                Cafe Mercado
              </p>
              <p className="mt-0.5 text-sm text-secondary">
                Coffee · Mission District
              </p>
              <p className="mt-2 font-mono text-xs text-muted">
                0.3 mi · 128 visits
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="rounded-ctl bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover">
                Check in
              </button>
              <button className="rounded-ctl px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface-sunken" style={{ boxShadow: "inset 0 0 0 1px var(--border-strong)" }}>
                Save
              </button>
              <span className="rounded-ctl bg-accent-muted px-3 py-2.5 text-sm font-medium text-accent">
                3 rewards
              </span>
            </div>

            <input
              readOnly
              value="Search places"
              className="w-full rounded-ctl bg-surface-sunken px-4 py-2.5 text-base text-primary"
              style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
            />

            <div
              className="rounded-ctl px-4 py-3 text-sm text-danger"
              style={{ boxShadow: "inset 0 0 0 1px var(--danger)" }}
            >
              That check-in code has expired.
            </div>

            <div className="relative">
              <FakeMedia className="aspect-[4/3] w-full" />
              <div className="absolute bottom-3 right-3">
                <Postmark place="Cafe Mercado" date="2026-07-24" size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="min-h-dvh bg-surface px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-14 max-w-2xl">
          <p className="font-mono text-2xs uppercase tracking-caps text-muted">
            Slice 1.1 · reference
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-primary">
            Token system
          </h1>
          <p className="mt-4 text-md text-secondary">
            Two tiers. Primitives are raw values referenced only by the theme
            definitions; components consume semantic roles through Tailwind
            utilities, which is why no <code className="font-mono text-sm">dark:</code>{" "}
            variant appears anywhere in this file. Every pair below passes
            WCAG AA in both themes.
          </p>
        </header>

        {/* ── Roles, both themes ── */}
        <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-primary">
          Semantic roles
        </h2>
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          <ThemePanel theme="light" />
          <ThemePanel theme="dark" />
        </div>

        {/* ── Elevation ── */}
        <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight text-primary">
          Elevation inverts
        </h2>
        <p className="mb-5 max-w-2xl text-base text-secondary">
          In light, depth is a hairline plus shadow carried in one{" "}
          <code className="font-mono text-sm">box-shadow</code>. In dark, shadows
          are invisible, so the shadow degrades to a hairline and the raised
          surface does the lifting. One class,{" "}
          <code className="font-mono text-sm">.elevation-1</code>, correct in
          both — a card never needs a conditional.
        </p>
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {(["light", "dark"] as Theme[]).map((t) => (
            <div key={t} data-theme={t} className="rounded-card bg-surface p-8">
              <div className="flex flex-col gap-5">
                <div className="elevation-1 rounded-card p-5">
                  <p className="font-mono text-xs text-muted">.elevation-1</p>
                  <p className="mt-1 text-base text-primary">Card</p>
                </div>
                <div className="elevation-2 rounded-card p-5">
                  <p className="font-mono text-xs text-muted">.elevation-2</p>
                  <p className="mt-1 text-base text-primary">Sheet / modal</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Media hairline ── */}
        <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight text-primary">
          Media hairline
        </h2>
        <p className="mb-5 max-w-2xl text-base text-secondary">
          <code className="font-mono text-sm">--border-media</code> is
          transparent in light and a 1px inset line in dark, so dark-edged
          photography cannot bleed into the page. Applied as an inset shadow,
          never a border, so it adds no layout shift.
        </p>
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {(["light", "dark"] as Theme[]).map((t) => (
            <div key={t} data-theme={t} className="rounded-card bg-surface p-8">
              <p className="mb-3 font-mono text-2xs uppercase tracking-caps text-muted">
                {t}
              </p>
              <FakeMedia className="aspect-[16/10] w-full" />
            </div>
          ))}
        </div>

        {/* ── Type scale ── */}
        <h2
          id="type-scale"
          className="mb-2 scroll-mt-8 font-display text-2xl font-semibold tracking-tight text-primary"
        >
          Type scale
        </h2>
        <p className="mb-5 max-w-2xl text-base text-secondary">
          One scale. Body is 16px. Tracking is baked into each step, so display
          sizes tighten automatically and UI sizes sit at zero.
        </p>
        <div className="mb-16 overflow-x-auto rounded-card bg-surface-raised p-2" style={{ boxShadow: "0 0 0 1px var(--border-subtle)" }}>
          <table className="w-full min-w-[46rem]">
            <thead>
              <tr>
                {["Utility", "Size", "Line", "Tracking", "Specimen", "Use"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-2xs uppercase tracking-caps font-normal text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPE_SCALE.map((s) => (
                <tr key={s.name} style={{ boxShadow: "inset 0 1px 0 var(--border-subtle)" }}>
                  <td className="px-4 py-4 align-middle font-mono text-xs text-primary">{s.name}</td>
                  <td className="px-4 py-4 align-middle font-mono text-xs text-muted">{s.px}px</td>
                  <td className="px-4 py-4 align-middle font-mono text-xs text-muted">{s.lh}px</td>
                  <td className="px-4 py-4 align-middle font-mono text-xs text-muted">{s.track}</td>
                  <td className="px-4 py-4 align-middle">
                    <span className={`${s.name} ${s.px >= 20 ? "font-display font-semibold" : ""} text-primary`}>
                      Ferry Building
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm text-muted">{s.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Type roles ── */}
        <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-primary">
          Three type roles
        </h2>
        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {[
            { cls: "font-display", name: "Archivo", role: "Display", note: "Headlines, place names, section titles. Variable, width axis available. Used with restraint.", specimen: "Mission District" },
            { cls: "font-body", name: "Public Sans", role: "Body / UI", note: "The workhorse. Everything that is read rather than scanned.", specimen: "A corner cafe that has been here since 1974." },
            { cls: "font-mono", name: "DM Mono", role: "Data / utility", note: "Timestamps, visit counts, distances, check-in receipts. The receipt voice.", specimen: "0.3 MI · 128 VISITS · 24 JUL" },
          ].map((f) => (
            <div key={f.name} className="elevation-1 rounded-card p-5">
              <p className="font-mono text-2xs uppercase tracking-caps text-muted">{f.role}</p>
              <p className="mt-2 font-display text-lg font-semibold tracking-tight text-primary">{f.name}</p>
              <p className={`mt-4 ${f.cls} text-md text-primary`}>{f.specimen}</p>
              <p className="mt-4 text-sm text-secondary">{f.note}</p>
            </div>
          ))}
        </div>

        {/* ── Tracking policy ── */}
        <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight text-primary">
          Tracking policy
        </h2>
        <p className="mb-5 max-w-2xl text-base text-secondary">
          Three values, and only three. The wide micro-caps that carried the
          old dark-neon identity are retired — they read as luxury signage and
          fight light editorial type.
        </p>
        <div className="mb-16 grid gap-4 md:grid-cols-2">
          <div className="elevation-1 rounded-card p-6">
            <p className="mb-4 font-mono text-2xs uppercase tracking-caps text-accent">Sanctioned</p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-mono text-2xs text-muted">tracking-tight · -0.02em</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-primary">Display headlines</p>
              </div>
              <div>
                <p className="font-mono text-2xs text-muted">tracking-normal · 0</p>
                <p className="mt-1 text-md tracking-normal text-primary">Body and UI. Never letterspaced.</p>
              </div>
              <div>
                <p className="font-mono text-2xs text-muted">tracking-caps · 0.06em</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-caps text-primary">Section eyebrow</p>
                <p className="mt-1 text-sm text-muted">Eyebrows only — not nav, not buttons, not badges.</p>
              </div>
            </div>
          </div>
          <div className="elevation-1 rounded-card p-6">
            <p className="mb-4 font-mono text-2xs uppercase tracking-caps text-danger">Retired</p>
            <div className="flex flex-col gap-4">
              {[
                { v: "0.15em", n: 130 },
                { v: "0.3em", n: 97 },
                { v: "0.2em", n: 78 },
                { v: "0.5em", n: 33 },
              ].map((t) => (
                <div key={t.v}>
                  <p className="font-mono text-2xs text-muted">
                    tracking-[{t.v}] · {t.n} uses to migrate
                  </p>
                  <p
                    className="mt-1 text-xs font-semibold uppercase text-muted"
                    style={{ letterSpacing: t.v }}
                  >
                    Section eyebrow
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Radii ── */}
        <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight text-primary">
          Radii
        </h2>
        <div className="mb-16 flex flex-wrap gap-4">
          {[
            { cls: "rounded-tile", label: "tile · 6px", use: "media in grids" },
            { cls: "rounded-ctl", label: "ctl · 12px", use: "inputs, chips" },
            { cls: "rounded-card", label: "card · 18px", use: "cards" },
            { cls: "rounded-sheet", label: "sheet · 28px", use: "sheets, heroes" },
          ].map((r) => (
            <div key={r.cls} className="flex flex-col gap-2">
              <div className={`${r.cls} elevation-1 h-24 w-40`} />
              <p className="font-mono text-2xs text-primary">{r.label}</p>
              <p className="text-2xs text-muted">{r.use}</p>
            </div>
          ))}
        </div>

        {/* ── Postmark ── */}
        <h2
          id="postmark"
          className="mb-2 scroll-mt-8 font-display text-2xl font-semibold tracking-tight text-primary"
        >
          Postmark
        </h2>
        <p className="mb-5 max-w-2xl text-base text-secondary">
          The signature element: a postal mark pressed onto media that carries
          a verified visit. It sits in its own indigo lane —{" "}
          <code className="font-mono text-sm">--stamp</code> — so proof can
          never be confused with an error, and it is deliberately not named
          &ldquo;stamp&rdquo;, which stays loyalty vocabulary.
        </p>
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          {(["light", "dark"] as Theme[]).map((t) => (
            <div key={t} data-theme={t} className="rounded-card bg-surface p-8">
              <p className="mb-5 font-mono text-2xs uppercase tracking-caps text-muted">
                On {t} media
              </p>
              <div className="relative mb-6">
                <FakeMedia className="aspect-[4/3] w-full" />
                <div className="absolute bottom-4 right-4">
                  <Postmark place="Ferry Building" date="2026-07-24" size="lg" />
                </div>
              </div>
              <div className="flex items-end gap-5">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <Postmark place="Cafe Mercado" date="2026-07-24" size={s} />
                    <span className="font-mono text-2xs text-muted">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="border-t pt-8 text-sm text-muted" style={{ borderColor: "var(--border-subtle)" }}>
          <p>
            Reference surface for Slice 1.1. Not indexed, not linked from the
            product.
          </p>
        </footer>
      </div>
    </main>
  );
}
