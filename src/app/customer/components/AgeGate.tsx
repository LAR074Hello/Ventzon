"use client";

import { safeJson } from "@/lib/safe-json";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { clearPendingReferralCode, flushPendingReferral } from "@/lib/referral-client";

type GateStatus = "checking" | "verified" | "blocked" | "missing";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Days in a month, year-aware (handles Feb 29). */
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based here
}

/**
 * Full-screen age gate for the consumer app. Shown for ANY signed-in session
 * (email, Apple, or Google) whose customer_profiles has no date of birth and
 * no recorded under-13 refusal — so it catches every signup path, not just the
 * email form. Renders nothing for signed-out users and for verified users.
 *
 * Fail-open: if the status endpoint errors (e.g. the migration hasn't been
 * applied yet) the gate stays out of the way rather than locking the app.
 */
export default function AgeGate() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<GateStatus>("checking");

  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const today = new Date();
    for (let y = today.getFullYear(); y >= today.getFullYear() - 120; y--) years.push(y);
    return years;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch("/api/customer/age-gate");
        if (!res.ok) return; // fail-open
        const json = (await safeJson(res)) as { status?: string };
        if (alive && (json.status === "verified" || json.status === "blocked" || json.status === "missing")) {
          setStatus(json.status);
        }
      } catch {
        // fail-open — never let the gate break the app
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  if (status === "checking" || status === "verified") return null;

  const days = month && year ? daysInMonth(Number(year), Number(month)) : 31;

  async function submit() {
    setErr(null);
    const m = Number(month);
    const d = Number(day);
    const y = Number(year);
    if (!m || !d || !y) {
      setErr("Pick your month, day, and year of birth.");
      return;
    }
    // Real-date check: a Feb-30 constructed date rolls over — reject it.
    const probe = new Date(y, m - 1, d);
    if (probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== d) {
      setErr("That date doesn't exist.");
      return;
    }
    if (probe > new Date()) {
      setErr("That date hasn't happened yet.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/customer/age-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dob: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` }),
      });
      const json = (await safeJson(res)) as { status?: string; error?: string };
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong.");
      setStatus(json.status === "blocked" ? "blocked" : "verified");
      // A completed age gate IS the referral onboarding gate — flush any
      // pending referral now. A blocked account is never attributed.
      if (json.status === "blocked") clearPendingReferralCode();
      else flushPendingReferral();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {}
    router.replace("/customer/auth");
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-surface"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {status === "blocked" ? (
        <>
          <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8 text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-primary">
              Ventzon is for people 13 and older
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-secondary">
              We&rsquo;re not able to create an account for you yet. You&rsquo;re welcome to
              come back when you&rsquo;re 13 — we&rsquo;ll be here.
            </p>
          </div>
          <div className="px-6 pb-10 space-y-3">
            <button
              onClick={signOut}
              className="w-full rounded-card border border-subtle py-4 text-base font-medium text-primary transition-colors active:bg-surface-sunken"
            >
              Sign out
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col justify-center px-8 pb-8">
            <p className="text-xs font-semibold uppercase tracking-caps text-muted">
              About you
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary">
              What&rsquo;s your date of birth?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              Ventzon is for people 13 and older. We ask your date of birth once
              to confirm you&rsquo;re old enough to join.
            </p>

            <div className="mt-8 flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="min-w-0 flex-1 rounded-card bg-surface-sunken px-3 py-3.5 text-base text-primary outline-none"
                style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
              >
                <option value="">Month</option>
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="min-w-0 flex-1 rounded-card bg-surface-sunken px-3 py-3.5 text-base text-primary outline-none"
                style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
              >
                <option value="">Day</option>
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="min-w-0 flex-1 rounded-card bg-surface-sunken px-3 py-3.5 text-base text-primary outline-none"
                style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
              >
                <option value="">Year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {err && (
              <p className="mt-4 text-sm font-medium text-danger">{err}</p>
            )}
          </div>

          <div className="px-6 pb-10 space-y-3">
            <button
              onClick={submit}
              disabled={busy}
              className="w-full rounded-card bg-primary py-4 text-base font-medium text-inverse transition-colors active:opacity-80 disabled:opacity-40"
            >
              {busy ? "Checking…" : "Continue"}
            </button>
            <p className="px-2 text-center text-xs text-muted">
              By continuing you agree to our{" "}
              <a href="https://www.ventzon.com/terms" className="underline underline-offset-2">Terms</a>{" "}
              and{" "}
              <a href="https://www.ventzon.com/privacy" className="underline underline-offset-2">Privacy Policy</a>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

