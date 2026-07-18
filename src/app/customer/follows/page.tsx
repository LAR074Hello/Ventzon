"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";
import FollowButton from "../components/FollowButton";

type FollowItem = {
  profile_id: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  followed_by_viewer: boolean;
  is_self: boolean;
};

function FollowListContent() {
  const router = useRouter();
  const params = useSearchParams();
  const profileId = params.get("profile_id");
  const shopSlug = params.get("shop_slug");
  const initialType = params.get("type") === "following" ? "following" : "followers";
  const title = params.get("title") ?? "";

  const [type, setType] = useState<"followers" | "following">(initialType);
  const [items, setItems] = useState<FollowItem[]>([]);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      const qs = new URLSearchParams();
      if (profileId) qs.set("profile_id", profileId);
      if (shopSlug) qs.set("shop_slug", shopSlug);
      qs.set("type", shopSlug ? "followers" : type);
      if (query.trim()) qs.set("q", query.trim());
      qs.set("offset", String(nextOffset));
      const res = await fetch(`/api/customer/follow-list?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
      setHasMore(data.has_more);
      setTotal(data.total);
      setOffset(nextOffset + (data.items?.length ?? 0));
    },
    [profileId, shopSlug, type, query]
  );

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetchPage(0, true).finally(() => setLoading(false));
    }, query ? 250 : 0); // debounce searches
    return () => clearTimeout(t);
  }, [fetchPage, query]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(offset, false);
    setLoadingMore(false);
  }

  return (
    <div className="flex min-h-full flex-col bg-black pb-8">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f1f1f] bg-[#0a0a0a]"
        >
          <ArrowLeft className="h-4 w-4 text-[#f5f5f5]" />
        </button>
        <h1 className="text-[18px] font-semibold text-[#f5f5f5] truncate">
          {title || (shopSlug ? "Followers" : type === "followers" ? "Followers" : "Following")}
        </h1>
      </div>

      {/* Followers / Following tabs — creator subjects only */}
      {!shopSlug && (
        <div className="mx-5 mb-3 flex rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-1">
          {(["followers", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-xl py-2 text-[11px] font-medium tracking-[0.08em] transition-all ${
                type === t ? "bg-[#ededed] text-black" : "text-[#666]"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mx-5 mb-4 flex items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-[#444]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="flex-1 bg-transparent text-[14px] font-normal text-[#f5f5f5] outline-none placeholder:text-[#444]"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-[#666]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#1f1f1f] p-3.5">
                <div className="skeleton h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3.5 w-32 rounded" />
                  <div className="skeleton h-3 w-44 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] font-medium text-[#888]">
              {query ? `No results for "${query}"` : "Nobody here yet"}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-[11px] font-normal text-[#555]">
              {total} {total === 1 ? "person" : "people"}
            </p>
            <div className="space-y-2.5">
              {items.map((item, i) => (
                <div
                  key={`${item.profile_id ?? item.display_name}-${i}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-3.5 py-3"
                >
                  <button
                    onClick={() => item.profile_id && router.push(`/customer/creator/${item.profile_id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    disabled={!item.profile_id}
                  >
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a]">
                        <span className="text-[14px] font-medium text-[#888]">
                          {item.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium text-[#ededed] truncate">
                        {item.display_name}
                        {item.is_creator && (
                          <span className="ml-2 text-[9px] font-light tracking-[0.15em] text-[#555]">CREATOR</span>
                        )}
                      </p>
                      {item.bio && (
                        <p className="mt-0.5 text-[12px] font-normal text-[#666] truncate">{item.bio}</p>
                      )}
                    </div>
                  </button>
                  {!item.is_self && item.is_creator && item.profile_id && (
                    <FollowButton
                      profileId={item.profile_id}
                      following={item.followed_by_viewer}
                      compact
                    />
                  )}
                </div>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-4 w-full rounded-2xl border border-[#1f1f1f] py-3.5 text-[11px] font-medium tracking-[0.15em] text-[#888] disabled:opacity-40"
              >
                {loadingMore ? "LOADING…" : "LOAD MORE"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FollowListPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
        </div>
      }
    >
      <FollowListContent />
    </Suspense>
  );
}
