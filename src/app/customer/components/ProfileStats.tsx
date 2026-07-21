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
      className={`flex flex-col items-center rounded-card border border-line bg-surface px-2 py-3 ${
        onTap ? "active:bg-surface transition-colors" : ""
      }`}
    >
      <p className="text-[17px] font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] font-light tracking-[0.08em] text-muted">{label.toUpperCase()}</p>
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
        <Award className="h-3.5 w-3.5 text-muted" />
        <p className="text-[11px] font-light tracking-[0.15em] text-muted">BADGES</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {earned.map((b) => (
          <div key={b.id} className="rounded-full border border-line bg-surface px-3.5 py-1.5">
            <p className="text-[11px] font-medium text-ink">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
