"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function JoinInner() {
  const sp = useSearchParams();
  const shopSlugFromQuery = sp.get("shop_slug") ?? "";

  // If someone uses /join?shop_slug=govans-groceries, we still support it gracefully.
  const shopSlug = useMemo(() => shopSlugFromQuery.trim().toLowerCase(), [shopSlugFromQuery]);

  const [status] = useState<"idle" | "success">("success"); // placeholder to keep your UI working

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="tracking-[0.2em] text-xs text-neutral-400">VENTZON REWARDS</div>

        {!shopSlug ? (
          <>
            <h1 className="mt-4 text-3xl font-semibold">Missing shop</h1>
            <p className="mt-2 text-neutral-400">
              Open a link like <span className="font-mono text-neutral-200">/join/govans-groceries</span>{" "}
              (or <span className="font-mono text-neutral-200">/join?shop_slug=govans-groceries</span>)
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-4xl font-semibold">🎉 You’re in!</h1>
            <p className="mt-3 text-neutral-300">
              You’ll earn a reward after 5 qualifying purchases.
            </p>
            <p className="mt-2 text-xs text-neutral-500">Text confirmations coming soon.</p>
          </>
        )}
      </div>
    </main>
  );
}