// src/app/pricing/page.tsx

import Link from "next/link";

type SP = {
  shop?: string;
};

export default function PricingPage({
  searchParams,
}: {
  searchParams?: SP;
}) {
  const shop = (searchParams?.shop || "").trim();

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.22em] text-white/60">
            Ventzon Rewards
          </div>
          <h1 className="mt-4 text-4xl font-semibold">Choose your plan</h1>
          <p className="mt-3 text-white/70">Start your free trial. Cancel anytime.</p>

          {/* If shop is present, we can keep the “shop-aware” flow. If not, no error — just guide them. */}
          {shop ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
              Pricing for shop:
              <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-xs">
                {shop}
              </span>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm text-white/80">
              <div className="font-medium text-white">No shop yet? No problem.</div>
              <div className="mt-1 text-white/70">
                Create your shop first, then you can subscribe when you’re ready.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
                >
                  Create a shop
                </Link>
                <Link
                  href="/merchant/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-transparent px-4 py-2 text-sm font-medium text-white"
                >
                  Open merchant dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Starter */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="text-sm font-medium text-white">Starter</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-semibold">$39</div>
              <div className="pb-1 text-sm text-white/60">/ month</div>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              <li>• Unlimited customer check-ins</li>
              <li>• Custom reward + visit goal (2–31)</li>
              <li>• SMS progress + redeem (when enabled)</li>
              <li>• Basic dashboard + daily stats</li>
            </ul>

            <div className="mt-8">
              {shop ? (
                <Link
                  href={`/subscribe?shop=${encodeURIComponent(shop)}&plan=starter`}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Start free trial
                </Link>
              ) : (
                <Link
                  href="/get-started"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Create shop to start
                </Link>
              )}
              <div className="mt-2 text-center text-xs text-white/50">
                You can upgrade/downgrade anytime.
              </div>
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="text-sm font-medium text-white">Pro</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-semibold">$79</div>
              <div className="pb-1 text-sm text-white/60">/ month</div>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              <li>• Everything in Starter</li>
              <li>• Promo broadcasts (opt-in customers)</li>
              <li>• Advanced templates + branding fields</li>
              <li>• Priority support</li>
            </ul>

            <div className="mt-8">
              {shop ? (
                <Link
                  href={`/subscribe?shop=${encodeURIComponent(shop)}&plan=pro`}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Start free trial
                </Link>
              ) : (
                <Link
                  href="/get-started"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                >
                  Create shop to start
                </Link>
              )}
              <div className="mt-2 text-center text-xs text-white/50">
                Cancel anytime.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/80">
          <div className="font-medium text-white">Why loyalty works</div>
          <div className="mt-2 text-white/70">
            Rewards programs typically increase repeat visits because they give customers a reason to come back sooner.
            Ventzon keeps it simple: scan → phone + 6-digit PIN → track visits → redeem.
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/how-it-works"
            className="rounded-xl border border-white/15 bg-transparent px-4 py-2 text-sm font-medium text-white"
          >
            See how it works
          </Link>
        </div>
      </div>
    </main>
  );
}