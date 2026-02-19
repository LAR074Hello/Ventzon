"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function GetStartedPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect to signup if user is not authenticated
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/signup");
        return;
      }
      setCheckingAuth(false);
    })();
  }, [supabase, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create shop via API (server handles slug + membership)
      const resp = await fetch("/api/merchant/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error ?? "Failed to create shop");

      // Send to pricing to pick a plan
      router.push(`/pricing?shop=${encodeURIComponent(json.shopSlug)}`);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="mx-auto w-full max-w-xl px-6 py-16 text-white">
        <p className="text-neutral-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 text-white">
      <div className="text-xs uppercase tracking-[0.22em] text-white/60">
        Ventzon Rewards
      </div>

      <h1 className="mt-3 text-4xl font-semibold">Create your shop</h1>

      <p className="mt-3 text-white/70">
        Give your shop a name and we'll set everything up for you.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
      >
        <label className="text-sm text-white/70">Shop name</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Govans Groceries"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        />

        {error && (
          <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-40"
        >
          {loading ? "Creating shop..." : "Continue to plans"}
        </button>

        <div className="mt-4 text-xs text-white/50">
          Already have a shop?{" "}
          <a href="/merchant/dashboard" className="underline">
            Go to dashboard
          </a>
        </div>
      </form>
    </main>
  );
}
