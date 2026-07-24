"use client";

import { Award } from "lucide-react";

export type ProfileStatValues = {
  followers: number;
  following: number;
  posts: number;
  businesses_visited: number;
  total_points: number;
  referrals: number;
};

export type BadgeValue = { id: string; label: string; description: string; earned: boolean };

function Stat({ value, label, onTap }: { value: number; label: string; onTap?: () => void }) {
  const Wrapper: any = onTap ? "button" : "div";
  return (
    <Wrapper
      {...(onTap ? { onClick: onTap } : {})}
      className={`flex flex-col items-center rounded-card bg-surface-raised px-2 py-3.5 ${
        onTap ? "active:bg-surface-sunken transition-colors" : ""
      }`}
      style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
    >
      {/* Public Sans, not mono. A profile stat grid is a summary, not a
          record — and mixing mono for check-ins with sans for followers
          inside one identical grid would read as arbitrary. */}
      <p className="text-xl font-semibold text-primary">{value}</p>
      <p className="mt-0.5 text-2xs font-medium uppercase tracking-caps text-muted">
        {label.toUpperCase()}
      </p>
    </Wrapper>
  );
}

/** The 6-stat grid shared by the public creator page and the Profile tab. */
export function ProfileStats({
  stats,
  onFollowersTap,
  onFollowingTap,
  showReferrals = false,
}: {
  stats: ProfileStatValues;
  onFollowersTap?: () => void;
  onFollowingTap?: () => void;
  /** Referrals are private: shown on your own profile, never in public. */
  showReferrals?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat value={stats.followers} label="Followers" onTap={onFollowersTap} />
      <Stat value={stats.following} label="Following" onTap={onFollowingTap} />
      <Stat value={stats.posts} label="Posts" />
      <Stat value={stats.businesses_visited} label="Places" />
      <Stat value={stats.total_points} label="Check-ins" />
      {showReferrals && <Stat value={stats.referrals} label="Referrals" />}
    </div>
  );
}

/** Earned milestone badge pills, shared wherever badges are shown. */
export function BadgePills({ badges }: { badges: BadgeValue[] }) {
  const earned = badges.filter((b) => b.earned);
  if (earned.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Award className="h-4 w-4 text-muted" />
        <p className="text-xs font-semibold uppercase tracking-caps text-muted">
          Badges
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {earned.map((b) => (
          <div
            key={b.id}
            className="rounded-full bg-surface-raised px-3.5 py-2"
            style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}
          >
            <p className="text-sm font-medium text-primary">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
