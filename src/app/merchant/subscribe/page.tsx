"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

function SubscribeContent() {
  const searchParams = useSearchParams();

  const shopSlug = useMemo(() => {
    const raw = searchParams?.get("shop") ?? "";
    return raw.trim().toLowerCase();
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-lg px-8 pb-20 pt-28">
      <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
        VENTZON REWARDS
      </p>
      <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
        Choose a plan
      </h1>
      <p className="mt-4 text-[15px] font-light leading-relaxed text-[#555]">
        Pick a plan to activate your dashboard. Your shop will go live as
        soon as payment is confirmed.
      </p>

      {!shopSlug ? (
        <div className="mt-10 rounded-xl border border-[#1a1a1a] p-6">
          <p className="text-[14px] font-light text-[#ededed]">
            Missing shop
          </p>
          <p className="mt-2 text-[13px] font-light text-[#555]">
            This page requires a shop slug. Open it like:
          </p>
          <p className="mt-3 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 font-mono text-[13px] font-light text-[#666]">
            /merchant/subscribe?shop=your-shop
          </p>
          <Link
            href="/get-started"
            className="mt-5 inline-flex items-center gap-2 text-[12px] font-light tracking-[0.05em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            Create a shop to get started
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-[#1a1a1a] p-6 transition-colors duration-500 hover:border-[#222]">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">
            SHOP
          </p>
          <p className="mt-1 font-mono text-[14px] font-light text-[#ededed]">
            {shopSlug}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/pricing?shop=${encodeURIComponent(shopSlug)}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#ededed] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
            >
              Choose plan
              <ArrowRight className="h-3 w-3" />
            </Link>

            <Link
              href={`/merchant/${encodeURIComponent(shopSlug)}`}
              className="rounded-full border border-[#333] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MerchantSubscribePage() {
  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      <Suspense>
        <SubscribeContent />
      </Suspense>
    </main>
  );
}
