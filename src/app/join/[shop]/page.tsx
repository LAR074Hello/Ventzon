"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type ShopSettings = {
  shop_slug: string;
  shop_name: string | null;
  deal_title: string | null;
  deal_details: string | null;
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
  const [pin, setPin] = useState("");
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

    if (pin && !/^\d{6}$/.test(pin)) {
      setErr("PIN must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/join/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, phone, ...(pin ? { pin } : {}) }),
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
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-300">Loading…</div>
      </main>
    );
  }

  if (err && !settings) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
          <div className="text-lg font-semibold">Couldn’t load this shop</div>
          <div className="mt-2 text-sm text-red-400">{err}</div>
        </div>
      </main>
    );
  }

  const shopName = settings?.shop_name || shopSlug;
  const dealTitle = settings?.deal_title || "A special reward";
  const dealDetails = settings?.deal_details || "";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="text-xs text-neutral-400">Ventzon Rewards</div>
        <h1 className="mt-2 text-2xl font-semibold">{shopName}</h1>

        <div className="mt-4 rounded-xl border border-neutral-800 bg-black p-4">
          <div className="text-sm text-neutral-400">Your reward</div>
          <div className="mt-1 text-lg font-semibold">{dealTitle}</div>
          {dealDetails ? (
            <div className="mt-2 text-sm text-neutral-300">{dealDetails}</div>
          ) : null}
        </div>

        {result ? (
          <div className="mt-5 rounded-xl border border-green-900 bg-green-950/40 p-4">
            <div className="font-semibold">{result.message}</div>

            <div className="mt-2 text-sm text-neutral-200">
              Visits: <span className="font-mono">{result.visits}/{result.goal}</span>
              {" "}• Remaining: <span className="font-mono">{result.remaining}</span>
            </div>

            {result.status === "reward" ? (
              <div className="mt-2 text-sm font-semibold text-green-200">
                ✅ REDEEM NOW — show this text to the cashier
              </div>
            ) : (
              <div className="mt-2 text-xs text-neutral-300">
                (Limit: 1 check-in text per day. Your progress resets after you redeem.)
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <label className="block">
              <div className="text-sm text-neutral-300">Phone number</div>
              <input
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(e.target.value)}
                placeholder="(410) 555-1234"
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white outline-none focus:border-neutral-600"
              />
            </label>

            <label className="block">
              <div className="text-sm text-neutral-300">6-digit PIN <span className="text-neutral-500">(optional)</span></div>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white outline-none focus:border-neutral-600"
              />
              <div className="mt-1 text-xs text-neutral-500">
                Set a PIN to secure your check-ins. Not required for QR check-ins.
              </div>
            </label>

            {err ? <div className="text-sm text-red-400">{err}</div> : null}

            <button
              disabled={submitting}
              className="w-full rounded-xl bg-white text-black py-3 font-semibold disabled:opacity-60"
            >
              {submitting ? "Checking in…" : "Check in"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}