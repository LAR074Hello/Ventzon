"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LogOut, User, ChevronRight, Trophy, Share2, Bell, BellOff, Trash2 } from "lucide-react";

type Membership = {
  shop_slug: string;
  shop_name: string;
  deal_title: string | null;
  reward_goal: number;
  visits: number;
  logo_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUser(session.user);
      const res = await fetch("/api/customer/memberships");
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/customer/auth");
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently remove all your loyalty cards and rewards. This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/customer/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete account");
      }
      await supabase.auth.signOut();
      router.replace("/customer/auth");
    } catch (e: any) {
      alert(e?.message ?? "Something went wrong. Please try again.");
      setDeletingAccount(false);
    }
  }

  async function shareApp() {
    try {
      await navigator.share({
        title: "Ventzon Rewards",
        text: "Earn rewards at local stores with Ventzon — the loyalty app for real businesses.",
        url: "https://www.ventzon.com",
      });
    } catch {}
  }

  async function toggleNotifications() {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (!notifEnabled) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
        setNotifEnabled(true);
      } else {
        setNotifEnabled(false);
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
          <User className="h-7 w-7 text-[#444]" />
        </div>
        <p className="mt-5 text-[16px] font-extralight text-[#ededed]">Not signed in</p>
        <button
          onClick={() => router.push("/customer/auth")}
          className="mt-8 rounded-2xl bg-[#ededed] px-8 py-4 text-[12px] font-light tracking-[0.2em] text-black transition-all active:bg-[#d0d0d0]"
        >
          SIGN IN
        </button>
      </div>
    );
  }

  const isPrivateRelay = user.email?.endsWith("@privaterelay.appleid.com") ?? false;
  const name = user.user_metadata?.full_name ?? (isPrivateRelay ? "Customer" : (user.email?.split("@")[0] ?? "Customer"));
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const totalVisits = memberships.reduce((s, m) => s + m.visits, 0);
  const readyCards = memberships.filter(m => m.visits >= m.reward_goal);
  const activeCards = memberships.length;

  return (
    <div className="flex min-h-full flex-col bg-black pb-8">
      {/* Header */}
      <div className="px-5 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <h1 className="text-[22px] font-extralight tracking-[-0.01em] text-[#ededed]">Profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-8">
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt={name} className="h-20 w-20 rounded-full border border-[#1a1a1a] object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-xl font-extralight text-[#555]">{initials}</span>
          </div>
        )}
        <p className="mt-4 text-[18px] font-extralight text-[#ededed]">{name}</p>
        <p className="mt-1 text-[13px] font-light text-[#555]">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="mx-5 mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "STORES", value: activeCards },
          { label: "STAMPS", value: totalVisits },
          { label: "READY", value: readyCards.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-2xl border border-[#1a1a1a] bg-[#080808] py-4">
            <p className="text-[22px] font-extralight text-[#ededed]">{value}</p>
            <p className="mt-1 text-[9px] font-light tracking-[0.15em] text-[#444]">{label}</p>
          </div>
        ))}
      </div>

      {/* Rewards ready */}
      {readyCards.length > 0 && (
        <div className="mx-5 mb-6">
          <p className="mb-3 text-[11px] font-light tracking-[0.15em] text-[#444]">REWARDS READY</p>
          <div className="space-y-2">
            {readyCards.map((m) => (
              <button
                key={m.shop_slug}
                onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-yellow-900/30 bg-yellow-950/10 px-4 py-3.5 text-left active:bg-yellow-950/20"
              >
                <Trophy className="h-4 w-4 shrink-0 text-yellow-500" strokeWidth={1.5} />
                <p className="flex-1 text-[13px] font-light text-[#ededed]">{m.shop_name}</p>
                <ChevronRight className="h-4 w-4 text-[#444]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All loyalty cards */}
      {memberships.length > 0 && (
        <div className="mx-5 mb-6">
          <p className="mb-3 text-[11px] font-light tracking-[0.15em] text-[#444]">YOUR CARDS</p>
          <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden">
            {memberships.map((m, i) => {
              const isReady = m.visits >= m.reward_goal;
              return (
                <button
                  key={m.shop_slug}
                  onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                  className={`flex w-full items-center gap-4 px-4 py-3.5 text-left active:bg-[#0a0a0a] ${i > 0 ? "border-t border-[#111]" : ""}`}
                >
                  {m.logo_url ? (
                    <img src={m.logo_url} alt={m.shop_name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1a1a1a] bg-[#111]">
                      <span className="text-sm font-extralight text-[#555]">{m.shop_name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-light text-[#ededed] truncate">{m.shop_name}</p>
                    <div className="mt-1.5 flex gap-1">
                      {Array.from({ length: Math.min(m.reward_goal, 10) }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full ${idx < m.visits ? isReady ? "bg-yellow-400" : "bg-[#ededed]" : "bg-[#1a1a1a]"}`}
                          style={{ width: `${Math.min(100 / Math.min(m.reward_goal, 10), 24)}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isReady && <span className="text-[10px] font-light text-yellow-500">READY</span>}
                    <span className="text-[12px] font-light text-[#444]">{m.visits}/{m.reward_goal}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[#333]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mx-5 rounded-2xl border border-[#1a1a1a] overflow-hidden">
        <button
          onClick={shareApp}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#0a0a0a] border-b border-[#111]"
        >
          <Share2 className="h-4 w-4 text-[#555]" />
          <span className="flex-1 text-[14px] font-light text-[#888]">Share Ventzon</span>
        </button>
        <button
          onClick={toggleNotifications}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#0a0a0a] border-b border-[#111]"
        >
          {notifEnabled ? <Bell className="h-4 w-4 text-[#555]" /> : <BellOff className="h-4 w-4 text-[#555]" />}
          <span className="flex-1 text-[14px] font-light text-[#888]">Notifications</span>
          <span className="text-[12px] font-light text-[#333]">{notifEnabled ? "On" : "Off"}</span>
        </button>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#0a0a0a] border-b border-[#111]"
        >
          <LogOut className="h-4 w-4 text-[#555]" />
          <span className="text-[14px] font-light text-[#888]">Sign out</span>
        </button>
        <button
          onClick={deleteAccount}
          disabled={deletingAccount}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#0a0a0a] disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4 text-red-900/60" />
          <span className="text-[14px] font-light text-red-900/60">
            {deletingAccount ? "Deleting account…" : "Delete account"}
          </span>
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[11px] font-light tracking-[0.15em] text-[#222]">VENTZON</p>
      </div>
    </div>
  );
}
