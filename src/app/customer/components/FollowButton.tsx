"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserPlus, UserCheck } from "lucide-react";

/**
 * Shared follow/unfollow button for creators — optimistic, accurate
 * state, redirects signed-out users to auth. Used on creator pages,
 * follower lists, and feed suggestions.
 */
export default function FollowButton({
  profileId,
  following,
  onChange,
  compact = false,
}: {
  profileId: string;
  following: boolean;
  onChange?: (following: boolean) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isFollowing, setIsFollowing] = useState(following);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    const next = !isFollowing;
    setBusy(true);
    setIsFollowing(next);
    onChange?.(next);
    try {
      const res = await fetch("/api/customer/user-follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, follow: next }),
      });
      if (res.status === 401) {
        router.push(`/customer/auth?redirect=${encodeURIComponent(pathname ?? "/customer/explore")}`);
        return;
      }
      if (!res.ok) {
        setIsFollowing(!next);
        onChange?.(!next);
      }
    } catch {
      setIsFollowing(!next);
      onChange?.(!next);
    } finally {
      setBusy(false);
    }
  }

  const base = compact
    ? "px-3.5 py-1.5 text-[10px] gap-1"
    : "px-6 py-2.5 text-[12px] gap-2";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex shrink-0 items-center rounded-full font-medium tracking-[0.08em] transition-all duration-200 ${base} ${
        isFollowing
          ? "border border-line bg-surface text-ink"
          : "bg-ink text-bg active:opacity-80"
      }`}
    >
      {isFollowing ? (
        <UserCheck className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ) : (
        <UserPlus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      )}
      {isFollowing ? "FOLLOWING" : "FOLLOW"}
    </button>
  );
}
