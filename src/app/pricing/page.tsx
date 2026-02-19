"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const shopFromQuery = (searchParams.get("shop") || "").trim();
  const [shopDraft, setShopDraft] = useState(shopFromQuery);

  useEffect(() => {
    // Keep the input in sync if the URL query changes
    setShopDraft(shopFromQuery);
  }, [shopFromQuery]);

  const shop = useMemo(() => shopDraft.trim(), [shopDraft]);
  const hasShop = shop.length > 0;

  function applyShopSlug() {
    const next = shopDraft.trim();
    if (!next) return;
    router.push(`/pricing?shop=${encodeURIComponent(next)}`);
  }

  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: "monthly" | "yearly") {
    if (!hasShop) {
      setError("Please create a shop first (or open pricing with ?shop=your-shop-slug).");
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
          <div className="text-sm font-medium">Shop slug</div>
          <div className="mt-2 flex gap-2">
            <input
              value={shopDraft}
              onChange={(e) => setShopDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyShopSlug();
              }}
              placeholder="e.g. govans-groceries"
              className="w-full rounded-xl border border-neutral-800 bg-black/30 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-700"
            />
            <button
              type="button"
              onClick={applyShopSlug}
              disabled={!shopDraft.trim()}
              className="shrink-0 rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm hover:bg-neutral-900 disabled:opacity-50"
            >
              Use
            </button>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            This connects your subscription to a shop. You can also open pricing with{' '}
            <code className="rounded bg-black/30 px-1 py-0.5">/pricing?shop=your-shop-slug</code>.
          </div>
          <div className="mt-3 text-sm text-neutral-400">
            {hasShop ? (
              <>
                Pricing for: <span className="font-mono text-neutral-200">{shop}</span>
              </>
            ) : (
              <>No shop selected</>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
          <div className="text-sm font-medium">New merchant?</div>
          <p className="mt-2 text-sm text-neutral-400">
            Create your shop first, then come back here to start a free trial.
          </p>
          <a
            href="/get-started"
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm hover:bg-neutral-900"
          >
            Create a shop →
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Monthly */}
        <button
          onClick={() => startCheckout("monthly")}
          disabled={!hasShop || loading !== null}
          className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-left hover:bg-neutral-900 disabled:opacity-50"
          title={!hasShop ? "Create a shop first" : ""}
        >
          <div className="text-lg font-medium">Monthly</div>
          <div className="mt-1 text-neutral-400">$49.99 / month</div>
          <div className="mt-4 text-sm">
            {loading === "monthly" ? "Redirecting…" : hasShop ? "Start free trial →" : "Select a shop to continue"}
          </div>
        </button>

        {/* Yearly */}
        <button
          onClick={() => startCheckout("yearly")}
          disabled={!hasShop || loading !== null}
          className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-left hover:bg-neutral-900 disabled:opacity-50"
          title={!hasShop ? "Create a shop first" : ""}
        >
          <div className="text-lg font-medium">Yearly</div>
          <div className="mt-1 text-neutral-400">$479.99 / year</div>
          <div className="mt-4 text-sm">
            {loading === "yearly" ? "Redirecting…" : hasShop ? "Start free trial →" : "Select a shop to continue"}
          </div>
        </button>
      </div>

      {error && (
        <div className="mt-6 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Suspense>
        <PricingContent />
      </Suspense>
    </main>
  );
}
