"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ArrowLeft, Check, RotateCcw, Lock } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────

type LookupResult = {
  found: boolean;
  customer?: {
    id: string;
    phone: string | null;
    email: string | null;
    visits: number;
    last_checkin_date: string | null;
    opted_out: boolean;
  };
  goal: number;
  remaining: number;
  pending_reward: boolean;
  deal_title: string;
};

// ── Helpers ────────────────────────────────────────────────────────────

function isPhone(v: string) {
  return /^\+?[\d\s()\-]{7,}$/.test(v);
}

function normalizeContact(v: string) {
  const trimmed = v.trim();
  if (isPhone(trimmed)) return { phone: trimmed.replace(/\D/g, ""), email: "" };
  return { phone: "", email: trimmed.toLowerCase() };
}

function ProgressDots({ visits, goal }: { visits: number; goal: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {Array.from({ length: goal }).map((_, i) => (
        <div
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
            i < visits
              ? "bg-[#ededed]"
              : "border border-[#333] bg-transparent"
          }`}
        >
          {i < visits && <Check className="h-3.5 w-3.5 text-black" />}
        </div>
      ))}
    </div>
  );
}

// ── PIN lock screen ────────────────────────────────────────────────────

function PinLockScreen({
  onUnlock,
  shake,
}: {
  onUnlock: (pin: string) => void;
  shake: boolean;
}) {
  const [entered, setEntered] = useState("");

  function press(digit: string) {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) {
      onUnlock(next);
      // Reset after a tick so shake animation can replay
      setTimeout(() => setEntered(""), 300);
    }
  }

  function del() {
    setEntered((p) => p.slice(0, -1));
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <Lock className="mb-6 h-7 w-7 text-[#444]" strokeWidth={1.5} />
      <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">REGISTER PIN</p>
      <p className="mt-2 text-[13px] font-light text-[#444]">Enter your 4-digit PIN</p>

      {/* Dots */}
      <div
        className={`mt-8 flex items-center gap-4 transition-transform ${
          shake ? "animate-shake" : ""
        }`}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-150 ${
              i < entered.length ? "bg-[#ededed]" : "border border-[#333] bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="mt-10 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, idx) => {
          if (key === "") return <div key={idx} />;
          return (
            <button
              key={idx}
              onClick={() => (key === "⌫" ? del() : press(key))}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] text-[20px] font-light text-[#ededed] transition-all duration-150 active:bg-[#1a1a1a] hover:border-[#333]"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Wrapper ────────────────────────────────────────────────────────────

export default function RegisterPageWrapper() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}

// ── Main ───────────────────────────────────────────────────────────────

function RegisterPage() {
  const params = useParams<{ shop?: string }>();
  const shopSlug = String(params?.shop ?? "").trim().toLowerCase();
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  // PIN state
  const [requiredPin, setRequiredPin] = useState<string | null>(null); // null = no pin required, string = required pin
  const [pinLoaded, setPinLoaded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pinShake, setPinShake] = useState(false);

  // Register state
  const [contact, setContact] = useState("");
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [stamping, setStamping] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  // Auth guard + PIN load
  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setAuthChecked(true);

      // Load register_pin from settings
      try {
        const res = await fetch(
          `/api/merchant/shop-settings?shop_slug=${encodeURIComponent(shopSlug)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const json = await res.json();
          const pin = (json.settings as any)?.register_pin ?? null;
          setRequiredPin(pin && String(pin).length === 4 ? String(pin) : null);
          if (!pin || String(pin).length !== 4) setUnlocked(true); // no PIN → open
        } else {
          setUnlocked(true); // can't load → open
        }
      } catch {
        setUnlocked(true);
      }
      setPinLoaded(true);
    })();
  }, [router, shopSlug]);

  function handlePinAttempt(pin: string) {
    if (pin === requiredPin) {
      setUnlocked(true);
    } else {
      setPinShake(true);
      setTimeout(() => setPinShake(false), 500);
    }
  }

  function lock() {
    setUnlocked(false);
    reset();
  }

  const lookup = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!contact.trim()) return;
      setLooking(true);
      setLookupError("");
      setResult(null);
      setActionMsg("");
      setActionError("");

      const { phone, email } = normalizeContact(contact);
      const qs = new URLSearchParams({ shop_slug: shopSlug });
      if (phone) qs.set("phone", phone);
      else qs.set("email", email);

      try {
        const res = await fetch(`/api/merchant/lookup?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Lookup failed");
        setResult(json as LookupResult);
      } catch (err: any) {
        setLookupError(err?.message ?? "Error");
      } finally {
        setLooking(false);
      }
    },
    [contact, shopSlug]
  );

  async function addStamp() {
    if (!result) return;
    setStamping(true);
    setActionMsg("");
    setActionError("");
    try {
      const res = await fetch("/api/merchant/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, contact: contact.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add stamp");

      if (json.status === "already_checked_in") {
        setActionMsg("Already checked in today.");
      } else {
        setActionMsg(
          json.status === "reward"
            ? "🎉 Reward earned!"
            : `✓ Stamp added — ${json.visits}/${json.goal}`
        );
        await lookup();
      }
    } catch (err: any) {
      setActionError(err?.message ?? "Error");
    } finally {
      setStamping(false);
    }
  }

  async function markRedeemed() {
    if (!result?.customer?.id) return;
    setRedeeming(true);
    setActionMsg("");
    setActionError("");
    try {
      const res = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, customer_id: result.customer.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to redeem");
      setActionMsg("✓ Reward marked as redeemed");
      await lookup();
    } catch (err: any) {
      setActionError(err?.message ?? "Error");
    } finally {
      setRedeeming(false);
    }
  }

  function reset() {
    setContact("");
    setResult(null);
    setActionMsg("");
    setActionError("");
    setLookupError("");
  }

  // ── Loading ──
  if (!authChecked || !pinLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
      </div>
    );
  }

  // ── PIN lock screen ──
  if (!unlocked) {
    return <PinLockScreen onUnlock={handlePinAttempt} shake={pinShake} />;
  }

  // ── Register UI ──
  return (
    <main className="flex min-h-screen flex-col bg-black text-[#ededed]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#1a1a1a] bg-black/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link
            href={`/merchant/${shopSlug}`}
            className="flex items-center gap-2 text-[12px] font-light tracking-[0.1em] text-[#555] transition-colors hover:text-[#ededed]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">REGISTER</p>
          <div className="flex items-center gap-3">
            {requiredPin && (
              <button
                onClick={lock}
                className="flex items-center gap-1.5 text-[12px] font-light text-[#555] transition-colors hover:text-[#ededed]"
              >
                <Lock className="h-3.5 w-3.5" />
                Lock
              </button>
            )}
            {result && !requiredPin && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-[12px] font-light text-[#555] transition-colors hover:text-[#ededed]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New
              </button>
            )}
            {result && requiredPin && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-[12px] font-light text-[#555] transition-colors hover:text-[#ededed]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New
              </button>
            )}
            {!result && !requiredPin && <div className="w-16" />}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-8 pb-12">

        {/* ── Search form ── */}
        {!result && (
          <>
            <p className="text-center text-[11px] font-light tracking-[0.3em] text-[#555]">
              LOOK UP CUSTOMER
            </p>
            <form onSubmit={lookup} className="mt-6">
              <input
                autoFocus
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Phone number or email"
                className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-4 text-center text-[18px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                disabled={looking}
              />
              {lookupError && (
                <p className="mt-3 text-center text-[13px] font-light text-red-400">{lookupError}</p>
              )}
              <button
                type="submit"
                disabled={looking || !contact.trim()}
                className="mt-5 w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black disabled:opacity-30"
              >
                {looking ? "Looking up…" : "LOOK UP"}
              </button>
            </form>

            <p className="mt-6 text-center text-[12px] font-light text-[#444]">
              Enter the customer&rsquo;s phone number or email to add stamps or redeem rewards.
            </p>
          </>
        )}

        {/* ── Result panel ── */}
        {result && (
          <div className="space-y-5">
            {/* Customer card */}
            <div className="rounded-2xl border border-[#1a1a1a] p-6 text-center">
              {result.found ? (
                <>
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                    {result.pending_reward ? "🏆 REWARD READY" : "CUSTOMER FOUND"}
                  </p>
                  <p className="mt-2 font-mono text-[15px] font-light text-[#888]">
                    {result.customer?.phone || result.customer?.email}
                  </p>

                  {/* Progress dots */}
                  <div className="mt-6">
                    <ProgressDots visits={result.customer?.visits ?? 0} goal={result.goal} />
                  </div>

                  <p className="mt-4 text-[14px] font-light text-[#ededed]">
                    {result.customer?.visits ?? 0}
                    <span className="text-[#555]">/{result.goal} stamps</span>
                  </p>

                  {result.pending_reward && (
                    <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-4 py-3">
                      <p className="text-[13px] font-light text-emerald-400">
                        {result.deal_title}
                      </p>
                    </div>
                  )}

                  {!result.pending_reward && result.remaining > 0 && (
                    <p className="mt-3 text-[12px] font-light text-[#555]">
                      {result.remaining} more stamp{result.remaining !== 1 ? "s" : ""} to earn reward
                    </p>
                  )}

                  {result.customer?.last_checkin_date && (
                    <p className="mt-2 text-[11px] font-light text-[#333]">
                      Last visit: {result.customer.last_checkin_date}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">NEW CUSTOMER</p>
                  <p className="mt-3 font-mono text-[15px] font-light text-[#888]">{contact.trim()}</p>
                  <p className="mt-2 text-[13px] font-light text-[#555]">
                    Adding a stamp will create their loyalty card.
                  </p>
                </>
              )}
            </div>

            {/* Action feedback */}
            {actionMsg && (
              <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-5 py-3.5 text-center">
                <p className="text-[13px] font-light text-emerald-400">{actionMsg}</p>
              </div>
            )}
            {actionError && (
              <div className="rounded-xl border border-red-900/30 bg-red-950/10 px-5 py-3.5 text-center">
                <p className="text-[13px] font-light text-red-400">{actionError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={addStamp}
                disabled={stamping || redeeming}
                className="w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
              >
                {stamping ? "ADDING STAMP…" : "➕ ADD STAMP"}
              </button>

              {result.found && result.pending_reward && (
                <button
                  onClick={markRedeemed}
                  disabled={stamping || redeeming}
                  className="w-full rounded-full border border-emerald-700/60 py-4 text-[12px] font-light tracking-[0.2em] text-emerald-400 transition-all duration-300 hover:bg-emerald-950/30 disabled:opacity-40"
                >
                  {redeeming ? "REDEEMING…" : "✓ MARK REWARD REDEEMED"}
                </button>
              )}
            </div>

            <button
              onClick={reset}
              className="mt-2 w-full text-[12px] font-light text-[#444] transition-colors hover:text-[#888]"
            >
              Look up a different customer →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
