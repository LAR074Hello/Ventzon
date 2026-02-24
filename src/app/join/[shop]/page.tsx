"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";

/* ── Types ── */
type ShopSettings = {
  shop_slug: string;
  shop_name: string | null;
  deal_title: string | null;
  deal_details: string | null;
  logo_url: string | null;
};

type CheckinResponse = {
  ok: boolean;
  status: "progress" | "reward";
  visits: number;
  goal: number;
  remaining: number;
  reset: boolean;
  message: string;
};

/* ── Helpers ── */
function normalizePhone(raw: string) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return "";
}

function formatPhoneDisplay(value: string) {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

/* ── Page ── */
export default function CustomerJoinPage() {
  const params = useParams<{ shop: string }>();
  const shopSlug = useMemo(
    () => String(params?.shop || "").trim().toLowerCase(),
    [params]
  );

  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [phoneRaw, setPhoneRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckinResponse | null>(null);

  /* ── Load shop settings ── */
  useEffect(() => {
    if (!shopSlug) return;

    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(
          `/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`
        );
        const json = await res.json();
        if (!res.ok)
          throw new Error(json?.error || "Failed to load shop settings");
        if (!cancelled) setSettings(json.settings);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [shopSlug]);

  /* ── Check in ── */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      setErr("Enter a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/join/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, phone }),
      });

      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error || "Check-in failed");

      setResult(json as CheckinResponse);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </main>
    );
  }

  /* ── Error state (no settings loaded) ── */
  if (err && !settings) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-[18px] font-extralight text-[#ededed]">
            Couldn&rsquo;t load this shop
          </p>
          <p className="mt-3 text-[13px] font-light text-red-400/70">
            {err}
          </p>
        </div>
      </main>
    );
  }

  const shopName = settings?.shop_name || shopSlug;

  /* ── Progress dots ── */
  function ProgressDots({
    visits,
    goal,
  }: {
    visits: number;
    goal: number;
  }) {
    return (
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: goal }).map((_, i) => (
          <div
            key={i}
            className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500 ${
              i < visits
                ? "bg-[#ededed]"
                : "border border-[#333] bg-transparent"
            }`}
          >
            {i < visits && <Check className="h-3 w-3 text-black" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-black">
      <div className="flex flex-1 flex-col items-center px-6 pt-20 pb-8">
        {/* Logo / Fallback initial */}
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt={shopName}
            className="h-20 w-20 rounded-full border border-[#1a1a1a] object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-2xl font-extralight text-[#555]">
              {shopName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Shop name */}
        <h1 className="mt-5 text-[13px] font-light tracking-[0.3em] text-[#ededed]">
          {shopName.toUpperCase()}
        </h1>

        {/* Deal info */}
        {settings?.deal_title && !result && (
          <div className="mt-6 rounded-lg border border-[#1a1a1a] px-5 py-3.5 text-center">
            <p className="text-[13px] font-light text-[#888]">
              {settings.deal_title}
            </p>
            {settings.deal_details && (
              <p className="mt-1 text-[12px] font-light text-[#555]">
                {settings.deal_details}
              </p>
            )}
          </div>
        )}

        {/* ── Result state ── */}
        {result ? (
          <div className="mt-10 w-full max-w-sm animate-fade-in opacity-0">
            <div className="rounded-xl border border-[#1a1a1a] p-8 text-center">
              {/* Status icon */}
              {result.status === "reward" ? (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
                  <span className="font-mono text-[18px] font-light text-[#ededed]">
                    {result.visits}
                  </span>
                </div>
              )}

              {/* Message */}
              <p className="mt-5 text-[16px] font-extralight text-[#ededed]">
                {result.message}
              </p>

              {/* Progress visualization */}
              {result.goal <= 20 && (
                <div className="mt-6">
                  <ProgressDots
                    visits={result.visits}
                    goal={result.goal}
                  />
                </div>
              )}

              {/* Stats */}
              <p className="mt-5 text-[12px] font-light tracking-[0.1em] text-[#555]">
                {result.visits}/{result.goal} visits
                {result.remaining > 0 && (
                  <span>
                    {" "}&middot;{" "}
                    {result.remaining} to go
                  </span>
                )}
              </p>

              {/* Reward banner */}
              {result.status === "reward" && (
                <div className="mt-6 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3.5">
                  <p className="text-[12px] font-light tracking-[0.15em] text-emerald-300/80">
                    SHOW THIS TO THE CASHIER TO REDEEM
                  </p>
                </div>
              )}

              {/* Info */}
              {result.status !== "reward" && (
                <p className="mt-4 text-[11px] font-light text-[#444]">
                  1 check-in per day &middot; Progress resets after redeem
                </p>
              )}

              {/* Done button */}
              <button
                onClick={() => {
                  setResult(null);
                  setPhoneRaw("");
                }}
                className="mt-8 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Check-in form ── */
          <form
            onSubmit={onSubmit}
            className="mt-10 w-full max-w-sm animate-fade-in opacity-0 anim-delay-200"
          >
            <div>
              <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                value={phoneRaw}
                onChange={(e) =>
                  setPhoneRaw(formatPhoneDisplay(e.target.value))
                }
                placeholder="(555) 123-4567"
                maxLength={14}
                className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-center text-[18px] font-light tracking-[0.05em] text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
                disabled={submitting}
              />
            </div>

            {/* Error */}
            {err && (
              <div className="mt-4 rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3 text-center text-[13px] font-light text-red-300/80">
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !phoneRaw.trim()}
              className="mt-6 w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-30"
            >
              {submitting ? "CHECKING IN\u2026" : "CHECK IN"}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 pb-8 pt-4">
        <p className="text-center text-[11px] font-light leading-relaxed text-[#444]">
          By checking in you agree to receive SMS messages.
          <br />
          Reply STOP to opt out.
        </p>
      </div>
    </main>
  );
}
