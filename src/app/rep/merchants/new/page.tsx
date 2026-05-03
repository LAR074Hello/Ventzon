"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft, Search, Store } from "lucide-react";

type Result = {
  slug: string;
  name: string;
  plan: string;
  alreadyClaimed: boolean;
  claimedByMe: boolean;
};

export default function NewMerchantPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/rep/merchants/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setSearching(false);
    }, 300);
  }, [query]);

  async function handleClaim(slug: string, name: string) {
    setError(null);
    setClaiming(slug);

    const res = await fetch("/api/rep/merchants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });

    const data = await res.json();
    setClaiming(null);

    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setSuccess(name);
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
            onClick={() => { setSuccess(null); setQuery(""); setResults([]); }}
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
          Help the owner sign up first, then search for their business name here.
        </p>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-3 rounded-xl border border-[#333] bg-[#0d0d0d] px-4">
          <Search className="h-4 w-4 shrink-0 text-[#444]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by business name…"
            autoFocus
            className="flex-1 bg-transparent py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444]"
          />
          {searching && (
            <div className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-[#333] border-t-[#666]" />
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-[13px] font-light text-red-300/80">
            {error}
          </p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map(r => (
              <div
                key={r.slug}
                className="flex items-center justify-between rounded-2xl border border-[#1a1a1a] bg-[#080808] px-5 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Store className="h-4 w-4 shrink-0 text-[#444]" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-light text-[#ededed] truncate">{r.name}</p>
                    <p className="text-[11px] font-light text-[#444]">
                      {r.plan === "pro" ? "Pro plan" : "Free plan"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {r.claimedByMe ? (
                    <span className="text-[11px] font-light tracking-[0.1em] text-emerald-500">YOURS</span>
                  ) : r.alreadyClaimed ? (
                    <span className="text-[11px] font-light tracking-[0.1em] text-[#444]">CLAIMED</span>
                  ) : (
                    <button
                      onClick={() => handleClaim(r.slug, r.name)}
                      disabled={claiming === r.slug}
                      className="rounded-full border border-[#ededed] px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black disabled:opacity-40"
                    >
                      {claiming === r.slug ? "…" : "CLAIM"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] px-5 py-8 text-center">
            <p className="text-[14px] font-light text-[#555]">No businesses found for "{query}"</p>
            <p className="mt-2 text-[12px] font-light text-[#333]">
              Make sure the owner has created their Ventzon account first.
            </p>
          </div>
        )}

        {query.length === 0 && (
          <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
            <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">HOW IT WORKS</p>
            <div className="mt-4 space-y-3">
              {[
                "Help the owner go to ventzon.com and create their account",
                "Once they're signed up, search for their business name above",
                "Tap Claim — they'll appear in your merchant list instantly",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#333] text-[10px] font-light text-[#555]">
                    {i + 1}
                  </span>
                  <p className="text-[13px] font-light leading-relaxed text-[#888]">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
