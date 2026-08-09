"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// POST-BETA: /merchant/subscribe is a legacy detour — onboarding goes
// straight to /pricing?shop=. This page exists only for the locked-QR
// "Activate now" link and may be folded away later.
export default function SubscribeContent({ shopSlug }: { shopSlug: string }) {
  return (
    <div className="mx-auto max-w-lg px-8 pb-20 pt-28">
      <p className="text-[11px] font-light tracking-[0.3em] text-fog-500">
        VENTZON REWARDS
      </p>
      <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-fog-100 sm:text-5xl">
        Choose a plan
      </h1>
      <p className="mt-4 text-[15px] font-light leading-relaxed text-fog-500">
        Pick a plan to activate your dashboard. Your shop will go live as
        soon as payment is confirmed.
      </p>

      {!shopSlug ? (
        <div className="mt-10 rounded-xl border border-night-700 p-6">
          <p className="text-[14px] font-light text-fog-100">
            Missing shop
          </p>
          <p className="mt-2 text-[13px] font-light text-fog-500">
            This page requires a shop slug. Open it like:
          </p>
          <p className="mt-3 rounded-lg border border-night-700 bg-night-900 px-4 py-3 font-mono text-[13px] font-light text-fog-500">
            /merchant/subscribe?shop=your-shop
          </p>
          <Link
            href="/get-started"
            className="mt-5 inline-flex items-center gap-2 text-[12px] font-light tracking-[0.05em] text-fog-600 transition-colors duration-300 hover:text-fog-100"
          >
            Create a shop to get started
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-night-700 p-6 transition-colors duration-500 hover:border-night-600">
          <p className="text-[11px] font-light tracking-[0.2em] text-fog-500">
            SHOP
          </p>
          <p className="mt-1 font-mono text-[14px] font-light text-fog-100">
            {shopSlug}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/pricing?shop=${encodeURIComponent(shopSlug)}`}
              className="inline-flex items-center gap-2 rounded-full border border-fog-100 px-6 py-3 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-500 hover:bg-fog-100 hover:text-black"
            >
              Choose plan
              <ArrowRight className="h-3 w-3" />
            </Link>

            <Link
              href={`/merchant/${encodeURIComponent(shopSlug)}`}
              className="rounded-full border border-night-600 px-6 py-3 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-500 hover:border-fog-500 hover:bg-white/5"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

