
"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Avatar from "../components/Avatar";
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
    <div className="flex min-h-full flex-col bg-surface pb-8">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
      >
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface-raised"
        >
          <ArrowLeft className="h-4 w-4 text-primary" />
        </button>
        <h1 className="font-display text-xl font-semibold tracking-tight text-primary truncate">
          {title || (shopSlug ? "Followers" : type === "followers" ? "Followers" : "Following")}
        </h1>
      </div>

      {/* Followers / Following tabs — creator subjects only */}
      {!shopSlug && (
        <div className="mx-5 mb-3 flex rounded-card border border-subtle bg-surface-raised p-1">
          {(["followers", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-ctl py-3 text-sm font-medium transition-all ${
                type === t ? "bg-primary text-inverse" : "text-muted"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mx-5 mb-4 flex items-center gap-3 rounded-card border border-subtle bg-surface-raised px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="text-base text-primary flex-1 bg-transparent font-normal outline-none placeholder:"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-card border border-subtle p-3.5">
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
            <p className="text-base text-secondary font-medium">
              {query ? `No results for "${query}"` : "Nobody here yet"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted mb-2 font-normal">
              {total} {total === 1 ? "person" : "people"}
            </p>
            <div className="space-y-2.5">
              {items.map((item, i) => (
                <div
                  key={`${item.profile_id ?? item.display_name}-${i}`}
                  className="flex items-center gap-3 rounded-card border border-subtle bg-surface-raised px-3.5 py-3"
                >
                  <button
                    onClick={() => item.profile_id && router.push(`/customer/creator/${item.profile_id}`)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    disabled={!item.profile_id}
                  >
                    <Avatar
                      name={item.display_name}
                      seed={item.profile_id ?? item.display_name}
                      url={item.avatar_url}
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-primary font-medium truncate">
                        {item.display_name}
                        {item.is_creator && (
                          <span className="text-2xs font-semibold uppercase tracking-caps text-muted ml-2">PUBLIC PROFILE</span>
                        )}
                      </p>
                      {item.bio && (
                        <p className="text-xs text-muted mt-0.5 font-normal truncate">{item.bio}</p>
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
                className="text-xs font-semibold uppercase tracking-caps text-muted mt-4 w-full rounded-card border border-subtle py-3.5 disabled:opacity-40"
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
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-subtle border-t-ink" />
        </div>
      }
    >
      <FollowListContent />
    </Suspense>
  );
}
