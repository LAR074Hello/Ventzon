"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function PricingPage() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop");

  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: "monthly" | "yearly") {
    if (!shop) {
      setError("Missing shop");
      return;
    }

    setLoading(plan);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-xs tracking-[0.35em] text-neutral-400">
          VENTZON REWARDS
        </div>

        <h1 className="mt-3 text-4xl font-semibold">
          Choose your plan
        </h1>

        <p className="mt-3 text-neutral-300">
          Start your free trial. Cancel anytime.
        </p>

        {!shop ? (
          <div className="mt-8 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm">
            Missing <code>?shop=</code> in URL
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {/* Monthly */}
              <button
                onClick={() => startCheckout("monthly")}
                disabled={loading !== null}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-left hover:bg-neutral-900 disabled:opacity-50"
              >
                <div className="text-lg font-medium">Monthly</div>
                <div className="mt-1 text-neutral-400">$49.99 / month</div>
                <div className="mt-4 text-sm">
                  {loading === "monthly" ? "Redirecting…" : "Start free trial →"}
                </div>
              </button>

              {/* Yearly */}
              <button
                onClick={() => startCheckout("yearly")}
                disabled={loading !== null}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-left hover:bg-neutral-900 disabled:opacity-50"
              >
                <div className="text-lg font-medium">Yearly</div>
                <div className="mt-1 text-neutral-400">$479.99 / year</div>
                <div className="mt-4 text-sm">
                  {loading === "yearly" ? "Redirecting…" : "Start free trial →"}
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-6 text-sm text-red-400">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}