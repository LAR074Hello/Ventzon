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

  // Sentence case, tracking zero. Letterspaced uppercase on a button was the
  // loudest holdover from the dark-neon identity.
  // The filled state stays ink rather than accent on purpose: a green fill
  // here would read as "done / success" rather than as Ventzon.
  // Compact sits at ~34px tall, under the 44px touch floor — raising it
  // further changes list row height, which is a Phase C layout call.
  const base = compact
    ? "px-3.5 py-2 text-xs gap-1.5"
    : "px-6 py-3 text-sm gap-2";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex shrink-0 items-center rounded-full font-medium transition-all duration-200 ${base} ${
        isFollowing
          ? "bg-surface-raised text-primary"
          : "bg-primary text-inverse active:opacity-80"
      }`}
      style={
        isFollowing ? { boxShadow: "inset 0 0 0 1px var(--border-subtle)" } : undefined
      }
    >
      {isFollowing ? (
        <UserCheck className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <UserPlus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
