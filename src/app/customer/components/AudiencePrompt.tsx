"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { safeJson } from "@/lib/safe-json";
import {
  AGE_RANGES, INTERESTS, GOING_OUT_FOR, FOOD_PREFS, PRICE_PREFS,
  EMPTY_AUDIENCE, type AudienceProfile,
} from "@/lib/audience";

/* Optional, skippable "personalize your feed" setup. Three short steps,
   each with Skip; "Not now" closes it for good. The same sheet opens from
   Settings to edit or clear answers. Shops only ever see totals. */

function Chip({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[40px] rounded-full border px-4 py-2 text-sm transition-colors ${
        on ? "border-primary bg-primary text-inverse" : "border-subtle text-secondary active:bg-surface-raised"
      }`}
    >
      {label}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7">
      <p className="text-xs font-semibold uppercase tracking-caps text-muted">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function AudiencePrompt({
  mode,
  onClose,
}: {
  mode: "setup" | "edit";
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<AudienceProfile>(EMPTY_AUDIENCE);
  const [hoods, setHoods] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customer/audience-profile", { cache: "no-store" })
      .then((r) => safeJson(r))
      .then((j) => {
        if (j?.profile) setP(j.profile);
        if (Array.isArray(j?.neighborhoods)) setHoods(j.neighborhoods);
      })
      .catch(() => {});
  }, []);

  const toggle = (key: "interests" | "going_out_for" | "food_prefs", v: string) =>
    setP((cur) => ({
      ...cur,
      [key]: cur[key].includes(v) ? cur[key].filter((x) => x !== v) : [...cur[key], v],
    }));
  const pick = (key: "age_range" | "price_pref" | "home_area", v: string) =>
    setP((cur) => ({ ...cur, [key]: cur[key] === v ? null : v }));

  async function save(done: boolean) {
    setSaving(true);
    try {
      await fetch("/api/customer/audience-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, done }),
      });
    } catch {
      /* non-blocking: personalization is optional */
    } finally {
      setSaving(false);
      onClose();
    }
  }

  async function notNow() {
    try {
      await fetch("/api/customer/audience-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: true }),
      });
    } catch {}
    onClose();
  }

  const steps = [
    {
      title: "Make the feed yours",
      sub: "Optional. Pick what fits and we'll show you more of it. Places only ever see totals, never your answers.",
      body: (
        <>
          <Group title="Your age">
            {AGE_RANGES.map((v) => (
              <Chip key={v} label={v} on={p.age_range === v} onClick={() => pick("age_range", v)} />
            ))}
          </Group>
          {hoods.length > 0 && (
            <Group title="Your neighborhood">
              {hoods.map((v) => (
                <Chip key={v} label={v} on={p.home_area === v} onClick={() => pick("home_area", v)} />
              ))}
            </Group>
          )}
        </>
      ),
    },
    {
      title: "What are you into?",
      sub: "Pick as many as you like.",
      body: (
        <>
          <Group title="Interests">
            {INTERESTS.map((v) => (
              <Chip key={v} label={v} on={p.interests.includes(v)} onClick={() => toggle("interests", v)} />
            ))}
          </Group>
          <Group title="You usually go out for">
            {GOING_OUT_FOR.map((v) => (
              <Chip key={v} label={v} on={p.going_out_for.includes(v)} onClick={() => toggle("going_out_for", v)} />
            ))}
          </Group>
        </>
      ),
    },
    {
      title: "Food and budget",
      sub: "Helps us skip places that aren't for you.",
      body: (
        <>
          <Group title="Food and drink">
            {FOOD_PREFS.map((v) => (
              <Chip key={v} label={v} on={p.food_prefs.includes(v)} onClick={() => toggle("food_prefs", v)} />
            ))}
          </Group>
          <Group title="Price comfort">
            {PRICE_PREFS.map((v) => (
              <Chip key={v} label={v} on={p.price_pref === v} onClick={() => pick("price_pref", v)} />
            ))}
          </Group>
        </>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const cur = steps[step];

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-surface"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Personalize your feed"
    >
      <div className="flex items-center justify-between px-5 pt-3">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 6, backgroundColor: i === step ? "var(--text-primary)" : "var(--border-subtle)" }}
            />
          ))}
        </div>
        {mode === "setup" ? (
          <button onClick={notNow} className="-mr-2 px-2 py-2 text-sm font-medium text-muted">
            Not now
          </button>
        ) : (
          <button onClick={onClose} aria-label="Close" className="-mr-2 p-2 text-muted">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div key={step} className="flex-1 overflow-y-auto px-5 pb-6 pt-6 animate-slide-in">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-primary">{cur.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary">{cur.sub}</p>
        {cur.body}
      </div>

      <div className="flex gap-3 border-t border-subtle px-5 py-4">
        {mode === "setup" && !isLast && (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="rounded-card px-5 py-4 text-base font-medium text-muted"
          >
            Skip
          </button>
        )}
        <button
          onClick={() => (isLast || mode === "edit" ? save(true) : setStep((s) => s + 1))}
          disabled={saving}
          className="flex-1 rounded-card bg-primary py-4 text-base font-medium text-inverse transition-colors active:opacity-80 disabled:opacity-50"
        >
          {saving ? "Saving…" : isLast || mode === "edit" ? "Done" : "Continue"}
        </button>
        {mode === "edit" && !isLast && (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="rounded-card border border-subtle px-5 py-4 text-base font-medium text-secondary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

/** Shows the setup once, after the intro slides, for eligible adults. */
export function useAudiencePrompt(enabled: boolean) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch("/api/customer/audience-profile", { cache: "no-store" })
      .then((r) => (r.ok ? safeJson(r) : null))
      .then((j) => {
        if (!cancelled && j?.eligible && j?.show_prompt) setShow(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enabled]);
  return { show, close: () => setShow(false) };
}
