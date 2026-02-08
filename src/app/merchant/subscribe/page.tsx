"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function MerchantSubscribePage() {
  const searchParams = useSearchParams();

  const shopSlug = useMemo(() => {
    const raw = searchParams?.get("shop") ?? "";
    return raw.trim().toLowerCase();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-xs tracking-[0.35em] text-neutral-400">
          VENTZON REWARDS
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Start your free trial
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-300">
          Choose a plan next. You’ll get a checkout page, then your dashboard
          unlocks automatically.
        </p>

        {!shopSlug ? (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6">
            <div className="text-sm text-neutral-200">Missing shop slug</div>
            <div className="mt-2 text-sm text-neutral-400">Open this page like:</div>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200">
              /merchant/subscribe?shop=govans-groceries
            </div>
            <div className="mt-3 text-xs text-neutral-500">
              Debug: shop = {JSON.stringify(searchParams?.get("shop"))}
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-950/40 p-8">
            <div className="text-sm text-neutral-400">Shop</div>
            <div className="mt-1 font-mono text-neutral-200">{shopSlug}</div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/pricing?shop=${encodeURIComponent(shopSlug)}`}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
              >
                Choose plan
              </Link>

              <Link
                href={`/merchant/${encodeURIComponent(shopSlug)}`}
                className="rounded-xl border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-900"
              >
                Back to dashboard
              </Link>
            </div>

            <div className="mt-4 text-xs text-neutral-500">
              Next: wire this to Stripe Checkout (Monthly/Yearly) from the Pricing page.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}