"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const shopFromQuery = (searchParams.get("shop") || "").trim();

  const [shop, setShop] = useState(shopFromQuery);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loadingShop, setLoadingShop] = useState(!shopFromQuery);
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState("");

  const hasShop = shop.length > 0;

  // Auto-detect the logged-in user's shop if no ?shop= param
  useEffect(() => {
    if (shopFromQuery) {
      setLoadingShop(false);
      return;
    }

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          setLoadingShop(false);
          return;
        }

        const { data: shops } = await supabase
          .from("shops")
          .select("slug, id")
          .eq("user_id", userData.user.id)
          .limit(1);

        if (shops && shops.length > 0) {
          setShop((shops[0] as any).slug);
        }
      } catch (e) {
        console.error("Failed to auto-detect shop", e);
      } finally {
        setLoadingShop(false);
      }
    })();
  }, [shopFromQuery, supabase]);

  // Load shop name for display
  useEffect(() => {
    if (!shop) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("shop_settings")
          .select("shop_name")
          .eq("shop_slug", shop)
          .maybeSingle();
        if (data && (data as any).shop_name) {
          setShopName((data as any).shop_name);
        }
      } catch {}
    })();
  }, [shop, supabase]);

  async function startCheckout(plan: "monthly" | "yearly") {
    if (!hasShop) {
      setError("No shop found. Please create a shop first.");
      return;
    }

    setLoading(plan);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan }),
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

      <h1 className="mt-3 text-4xl font-semibold">Choose your plan</h1>

      <p className="mt-3 text-neutral-300">
        Start your free trial. Cancel anytime.
      </p>

      {/* Shop info */}
      {loadingShop ? (
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4 text-sm text-neutral-400">
          Finding your shop…
        </div>
      ) : hasShop ? (
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400">Shop:</span>
            <span className="font-medium text-neutral-100">
              {shopName || shop}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
          <div className="text-sm font-medium">No shop found</div>
          <p className="mt-2 text-sm text-neutral-400">
            Create your shop first, then come back here to pick a plan.
          </p>
          <a
            href="/get-started"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Create a shop →
          </a>
        </div>
      )}

      {/* Plan cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Monthly */}
        <button
          onClick={() => startCheckout("monthly")}
          disabled={!hasShop || loading !== null || loadingShop}
          className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-left hover:bg-neutral-900 disabled:opacity-50"
        >
          <div className="text-lg font-medium">Monthly</div>
          <div className="mt-1 text-neutral-400">$49.99 / month</div>
          <div className="mt-4 text-sm">
            {loading === "monthly"
              ? "Redirecting…"
              : hasShop
              ? "Start free trial →"
              : "Create a shop first"}
          </div>
        </button>

        {/* Yearly */}
        <button
          onClick={() => startCheckout("yearly")}
          disabled={!hasShop || loading !== null || loadingShop}
          className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 text-left hover:bg-neutral-900 disabled:opacity-50"
        >
          <div className="text-lg font-medium">Yearly</div>
          <div className="mt-1 text-neutral-400">$479.99 / year</div>
          <div className="mt-4 text-sm">
            {loading === "yearly"
              ? "Redirecting…"
              : hasShop
              ? "Start free trial →"
              : "Create a shop first"}
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
