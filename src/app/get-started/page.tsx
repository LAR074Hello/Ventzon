"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function GetStartedPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect to signup if not authenticated; redirect to dashboard if already has a shop
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/signup");
        return;
      }
      // If the merchant already has a shop, send them to the dashboard instead
      const { data: shops } = await supabase
        .from("shops")
        .select("slug")
        .eq("user_id", data.user.id)
        .limit(1);
      if (shops && shops.length > 0) {
        router.replace("/merchant/dashboard");
        return;
      }
      setCheckingAuth(false);
    })();
  }, [supabase, router]);

  // Generate slug preview
  const slugPreview = shopName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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

  /* ── Loading state ── */
  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
        <p className="text-[14px] font-light text-[#444] animate-pulse">
          Loading…
        </p>
      </main>
    );
  }

  /* ── Page ── */
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-lg animate-fade-in opacity-0 anim-delay-200">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ededed]">
              <span className="text-[11px] font-normal text-black">1</span>
            </div>
            <span className="text-[11px] font-light tracking-[0.1em] text-[#ededed]">Name your shop</span>
          </div>
          <div className="h-[1px] w-6 bg-[#333]" />
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#333]">
              <span className="text-[11px] font-light text-[#555]">2</span>
            </div>
            <span className="text-[11px] font-light tracking-[0.1em] text-[#555]">Choose a plan</span>
          </div>
        </div>

        {/* Header */}
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          ONBOARDING
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
          Name your shop
        </h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-[#555]">
          This is the name your customers will see when they check in.
          You&rsquo;ll set your reward offer and goal in the dashboard after subscribing.
        </p>

        {/* Card */}
        <div className="mt-10 rounded-xl border border-[#1a1a1a] p-6 transition-colors duration-500 hover:border-[#222]">
          <form onSubmit={onSubmit}>
            <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
              SHOP NAME
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Sunrise Bakery"
              required
              maxLength={60}
              className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
            />

            {/* Slug preview */}
            {shopName.length > 0 && (
              <p className="mt-3 text-[12px] font-light text-[#444]">
                ventzon.com/join/
                <span className="text-[#666]">{slugPreview || "…"}</span>
              </p>
            )}

            {/* Character count */}
            <p className="mt-2 text-right text-[11px] font-light text-[#333]">
              {shopName.length}/60
            </p>

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3.5 text-[13px] font-light text-red-300/80">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              disabled={loading}
              className="mt-6 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-2">
                {loading ? "Creating shop…" : "Continue to plans"}
                {!loading && <ArrowRight className="h-3 w-3" />}
              </span>
            </button>
          </form>

          {/* Dashboard link */}
          <div className="mt-5 border-t border-[#1a1a1a] pt-5">
            <Link
              href="/merchant/dashboard"
              className="inline-flex items-center gap-2 text-[12px] font-light tracking-[0.05em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
            >
              Already have a shop? Go to dashboard
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
