"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Store, TrendingUp, ArrowRight, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Stats = {
  totalMerchants: number;
  activePro: number;
  activeFree: number;
  commissionThisMonth: number;
  allTimeCommission: number;
};

type Profile = {
  full_name: string;
  email: string;
  city: string | null;
  created_at: string;
};

export default function RepHomePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rep/profile")
      .then(r => {
        if (r.status === 401 || r.status === 403) {
          router.replace("/rep/auth");
          return null;
        }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setProfile(d.profile);
        setStats(d.stats);
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/rep/auth");
  }

  const firstName = profile?.full_name?.split(" ")[0];
  const monthName = new Date().toLocaleString("default", { month: "long" });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-black">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 20px)" }}>
        <div>
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">REP PORTAL</p>
          <h1 className="mt-1 text-[22px] font-extralight text-[#ededed]">
            {firstName ? `Hey, ${firstName}` : "Dashboard"}
          </h1>
          {profile?.city && (
            <p className="mt-0.5 text-[13px] font-light text-[#444]">{profile.city}</p>
          )}
        </div>
        <button onClick={handleSignOut} className="mt-1 p-2 text-[#333] transition-colors hover:text-[#666]">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Commission this month */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-6">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">{monthName.toUpperCase()} COMMISSION</p>
          <p className="mt-3 text-[42px] font-extralight tracking-[-0.02em] text-[#ededed]">
            ${stats?.commissionThisMonth.toFixed(2) ?? "0.00"}
          </p>
          <p className="mt-1 text-[12px] font-light text-[#444]">
            Based on {stats?.activePro ?? 0} active Pro merchant{stats?.activePro !== 1 ? "s" : ""}
          </p>
          {(stats?.allTimeCommission ?? 0) > 0 && (
            <p className="mt-3 text-[12px] font-light text-[#333]">
              All-time: ~${stats?.allTimeCommission.toFixed(0)}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: stats?.totalMerchants ?? 0, sub: "merchants" },
            { label: "Pro", value: stats?.activePro ?? 0, sub: "active" },
            { label: "Free", value: stats?.activeFree ?? 0, sub: "active" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl border border-[#1a1a1a] bg-[#080808] p-4">
              <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">{label.toUpperCase()}</p>
              <p className="mt-2 text-[26px] font-extralight text-[#ededed]">{value}</p>
              <p className="mt-0.5 text-[11px] font-light text-[#444]">{sub}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/rep/merchants/new")}
            className="flex w-full items-center justify-between rounded-2xl border border-[#1a1a1a] bg-[#080808] px-5 py-4 text-left transition-colors active:bg-[#111]"
          >
            <div className="flex items-center gap-3">
              <Store className="h-4 w-4 text-[#555]" />
              <span className="text-[14px] font-light text-[#ededed]">Log a new merchant</span>
            </div>
            <ArrowRight className="h-4 w-4 text-[#333]" />
          </button>

          <button
            onClick={() => router.push("/rep/merchants")}
            className="flex w-full items-center justify-between rounded-2xl border border-[#1a1a1a] bg-[#080808] px-5 py-4 text-left transition-colors active:bg-[#111]"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-[#555]" />
              <span className="text-[14px] font-light text-[#ededed]">View my merchants</span>
            </div>
            <ArrowRight className="h-4 w-4 text-[#333]" />
          </button>
        </div>

        {/* How commission works */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-5">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">HOW YOU EARN</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Pro merchant active", value: "$5.00/mo", detail: "20% of $25 subscription" },
              { label: "Per reward redeemed", value: "$0.17", detail: "20% of $0.85 per redemption" },
            ].map(({ label, value, detail }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-light text-[#bbb]">{label}</p>
                  <p className="text-[11px] font-light text-[#444]">{detail}</p>
                </div>
                <p className="text-[15px] font-extralight text-[#ededed]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
