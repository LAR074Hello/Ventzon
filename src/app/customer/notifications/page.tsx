"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Bell, Megaphone, Trophy, MapPin, ChevronRight } from "lucide-react";

type Notification = {
  id: string;
  type: "drop" | "reward_expiry" | "new_nearby";
  shop_slug: string | null;
  title: string;
  body: string;
  sent_at: string;
};

const TYPE_ICON = {
  drop: Megaphone,
  reward_expiry: Trophy,
  new_nearby: MapPin,
} as const;

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/customer/auth?redirect=/customer/notifications");
        return;
      }
      fetch("/api/customer/notifications")
        .then((r) => (r.ok ? r.json() : { notifications: [] }))
        .then((d) => setNotifications(d.notifications ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-black">
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#f5f5f5]">Notifications</h1>
        <p className="mt-1 text-[12px] font-normal text-[#666]">
          Drops from stores you follow, rewards, and new places nearby
        </p>
      </div>

      <div className="flex-1 px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-[#1f1f1f] p-4">
                <div className="skeleton h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="skeleton h-3.5 w-40 rounded" />
                  <div className="skeleton h-3 w-56 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#1f1f1f] bg-[#0d0d0d]">
              <Bell className="h-7 w-7 text-[#333]" />
            </div>
            <p className="mt-5 text-[16px] font-semibold text-[#f5f5f5]">Nothing yet</p>
            <p className="mt-2 text-[13px] font-normal leading-relaxed text-[#666]">
              Follow stores you love and we'll let you know<br />when they post something new
            </p>
            <button
              onClick={() => router.push("/customer/explore")}
              className="mt-7 rounded-2xl border border-[#1f1f1f] px-8 py-3.5 text-[12px] font-medium tracking-[0.1em] text-[#999]"
            >
              BROWSE STORES
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => n.shop_slug && router.push(`/customer/shop/${n.shop_slug}`)}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] px-4 py-3.5 text-left active:bg-[#0f0f0f]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a1a1a]">
                    <Icon className="h-4 w-4 text-[#888]" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#ededed] truncate">{n.title}</p>
                    <p className="mt-0.5 text-[12px] font-normal text-[#666] truncate">{n.body}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] font-normal text-[#444]">{timeAgo(n.sent_at)}</span>
                    {n.shop_slug && <ChevronRight className="h-3.5 w-3.5 text-[#333]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
