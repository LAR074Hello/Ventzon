"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function NewMerchantPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/rep/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: slug.trim().toLowerCase() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setSuccess(data.shopName);
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
        <h1 className="mt-5 text-[22px] font-extralight text-[#ededed]">Merchant claimed</h1>
        <p className="mt-2 text-[14px] font-light text-[#999]">
          <span className="text-[#ededed]">{success}</span> is now in your book of business.
        </p>
        <p className="mt-1 text-[13px] font-light text-[#555]">Commission starts counting from today.</p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => { setSuccess(null); setSlug(""); }}
            className="rounded-full border border-[#333] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#888] transition-colors hover:border-[#555]"
          >
            ADD ANOTHER
          </button>
          <button
            onClick={() => router.push("/rep/merchants")}
            className="rounded-full border border-[#ededed] px-6 py-3 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black"
          >
            VIEW MERCHANTS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black">
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 20px)" }}>
        <button onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-[11px] font-light tracking-[0.2em] text-[#555]">
          <ArrowLeft className="h-3.5 w-3.5" /> BACK
        </button>
        <h1 className="text-[22px] font-extralight text-[#ededed]">Log a Merchant</h1>
        <p className="mt-1 text-[13px] font-light text-[#555]">
          Once the business has created their Ventzon account, enter their shop slug here to add them to your book.
        </p>
      </div>

      <div className="px-5 pb-8">
        <div className="mb-6 rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">WHERE TO FIND THE SLUG</p>
          <p className="mt-3 text-[13px] font-light leading-relaxed text-[#888]">
            The shop slug is in the merchant's Ventzon dashboard URL — it looks like{" "}
            <span className="text-[#ededed]">ventzon.com/merchant/sunrise-bakery</span>.
            Ask the owner to share it with you after they sign up.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-light tracking-[0.25em] text-[#aaa]">
              SHOP SLUG *
            </label>
            <div className="flex items-center rounded-xl border border-[#333] bg-[#0d0d0d] px-4">
              <span className="mr-1 text-[14px] font-light text-[#444]">ventzon.com/</span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="sunrise-bakery"
                required
                disabled={loading}
                className="flex-1 bg-transparent py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] disabled:opacity-40"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-[13px] font-light text-red-300/80">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !slug.trim()}
            className="w-full rounded-xl border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-200 hover:bg-[#ededed] hover:text-black disabled:opacity-30"
          >
            {loading ? "CLAIMING…" : "CLAIM MERCHANT"}
          </button>
        </form>
      </div>
    </div>
  );
}
