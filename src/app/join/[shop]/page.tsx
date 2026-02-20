"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

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
        if (!res.ok) throw new Error(json?.error || "Failed to load shop settings");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-stone-400 text-sm tracking-wide">Loading...</p>
      </main>
    );
  }

  if (err && !settings) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <p className="text-lg font-medium text-stone-900">Couldn't load this shop</p>
          <p className="mt-2 text-sm text-red-500">{err}</p>
        </div>
      </main>
    );
  }

  const shopName = settings?.shop_name || shopSlug;

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center px-6 pt-16">
        {/* Logo / Fallback */}
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt={shopName}
            className="w-24 h-24 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center shadow-sm">
            <span className="text-2xl font-semibold text-stone-400">
              {shopName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Store Name */}
        <h1 className="mt-6 mb-16 tracking-wide text-stone-900 text-2xl">
          {shopName.toUpperCase()}
        </h1>

        {/* Result state */}
        {result ? (
          <div className="w-full max-w-sm">
            <div className="border border-stone-200 p-6 text-center">
              <p className="text-lg font-medium text-stone-900">{result.message}</p>

              <p className="mt-3 text-sm text-stone-500 tracking-wide">
                Visits: <span className="font-mono">{result.visits}/{result.goal}</span>
                {" "}&middot;{" "}
                Remaining: <span className="font-mono">{result.remaining}</span>
              </p>

              {result.status === "reward" ? (
                <p className="mt-4 text-sm font-semibold text-green-700">
                  REDEEM NOW — show this to the cashier
                </p>
              ) : (
                <p className="mt-4 text-xs text-stone-400 tracking-wide">
                  Limit: 1 check-in per day. Progress resets after you redeem.
                </p>
              )}

              <button
                onClick={() => {
                  setResult(null);
                  setPhoneRaw("");
                }}
                className="mt-6 w-full py-4 bg-stone-900 text-white tracking-widest hover:bg-stone-800 transition-colors"
              >
                DONE
              </button>
            </div>
          </div>
        ) : (
          /* Check-in form */
          <form onSubmit={onSubmit} className="w-full max-w-sm">
            <div className="mb-8">
              <label htmlFor="phone" className="sr-only">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(formatPhoneDisplay(e.target.value))}
                placeholder="Phone Number"
                maxLength={14}
                className="w-full px-5 py-4 border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600 transition-colors tracking-wide"
                disabled={submitting}
              />
            </div>

            {err && (
              <p className="mb-4 text-sm text-red-500 text-center">{err}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !phoneRaw.trim()}
              className="w-full py-5 bg-stone-900 text-white tracking-widest disabled:bg-stone-300 disabled:text-stone-500 hover:bg-stone-800 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {submitting ? "CHECKING IN..." : "CHECK IN"}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 pb-8 pt-4">
        <p className="text-xs text-stone-500 text-center leading-relaxed tracking-wide">
          By checking in you agree to receive SMS messages.
          <br />
          Reply STOP to opt out.
        </p>
      </div>
    </main>
  );
}
