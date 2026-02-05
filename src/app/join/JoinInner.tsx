"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JoinInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const slug =
      (searchParams.get("shop_slug") || searchParams.get("shop") || "")
        .trim()
        .toLowerCase();

    // If they visited /join?shop_slug=govans-groceries, redirect to /join/govans-groceries
    if (slug) {
      router.replace(`/join/${encodeURIComponent(slug)}`);
    }
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="text-xs tracking-[0.35em] text-neutral-400">
          VENTZON REWARDS
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Missing shop
        </h1>
        <p className="mt-3 text-neutral-300">
          Open a link like{" "}
          <span className="font-mono">/join/govans-groceries</span> (or{" "}
          <span className="font-mono">/join?shop_slug=govans-groceries</span>).
        </p>
      </div>
    </main>
  );
}