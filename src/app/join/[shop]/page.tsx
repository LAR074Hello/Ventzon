"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

export default function JoinShopPage() {
  const params = useParams<{ shop?: string }>();

  const shopSlug = useMemo(() => {
    return String(params?.shop ?? "").trim().toLowerCase();
  }, [params?.shop]);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string>("");

  const cleanedDigits = useMemo(() => phone.replace(/[^\d]/g, ""), [phone]);
  const isValid = cleanedDigits.length >= 10;

  async function onJoin() {
    setError("");
    if (!shopSlug) return setError("Missing shop.");
    if (!isValid) return setError("Enter a valid phone number.");

    try {
      setLoading(true);
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanedDigits, shop_slug: shopSlug }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to join");
      setStatus("success");
    } catch (e: any) {
      setError(e?.message ?? "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  if (!shopSlug) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="text-xs tracking-[0.35em] text-neutral-400">
            VENTZON REWARDS
          </div>
          <h1 className="mt-3 text-3xl font-semibold">Missing shop</h1>
          <p className="mt-3 text-neutral-300">
            Open a link like <span className="font-mono">/join/govans-groceries</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6 py-14">
        <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          {status === "success" ? (
            <div className="py-10 text-center">
              <div className="text-2xl font-semibold">You’re in ✅</div>
              <p className="mt-2 text-neutral-300">Joined {shopSlug}</p>
            </div>
          ) : (
            <>
              <label className="block text-sm text-neutral-300">Phone number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 24))}
                inputMode="tel"
                placeholder="Enter your phone number"
                className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3"
              />
              <button
                onClick={onJoin}
                disabled={loading || !isValid}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-60"
              >
                {loading ? "Joining…" : "Join Rewards"}
              </button>
              {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}