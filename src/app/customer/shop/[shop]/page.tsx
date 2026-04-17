"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Check, ArrowLeft, Bell } from "lucide-react";

type ShopSettings = {
  shop_slug: string;
  shop_name: string | null;
  deal_title: string | null;
  deal_details: string | null;
  reward_goal: number;
  logo_url: string | null;
};

type CustomerStatus = {
  visits: number;
  last_checkin_date: string | null;
};

export default function CustomerShopPage() {
  const params = useParams<{ shop: string }>();
  const router = useRouter();
  const shopSlug = String(params?.shop ?? "").toLowerCase();
  const supabase = createSupabaseBrowserClient();

  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [status, setStatus] = useState<CustomerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinResult, setCheckinResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = status?.last_checkin_date === today;

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Load shop settings
      const res = await fetch(`/api/join/settings?shop_slug=${shopSlug}`);
      const json = await res.json();
      if (res.ok) setSettings(json.settings);

      // Load customer status if logged in
      if (session?.user?.email) {
        const memberRes = await fetch("/api/customer/memberships");
        const memberData = await memberRes.json();
        const match = (memberData.memberships ?? []).find(
          (m: any) => m.shop_slug === shopSlug
        );
        if (match) {
          setStatus({ visits: match.visits, last_checkin_date: match.last_checkin_date });
        }
      }

      setLoading(false);
    }
    load();
  }, [shopSlug]);

  async function handleCheckin() {
    if (!user?.email) {
      router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`);
      return;
    }
    setErr(null);
    setCheckinLoading(true);
    try {
      const res = await fetch("/api/join/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, email: user.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Check-in failed");
      setCheckinResult(json);
      setStatus({ visits: json.visits, last_checkin_date: today });
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setCheckinLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  const shopName = settings?.shop_name ?? shopSlug;
  const goal = settings?.reward_goal ?? 5;
  const visits = status?.visits ?? 0;
  const isReady = visits >= goal;

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed left-4 top-12 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#1a1a1a] bg-black/80 backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 text-[#ededed]" />
      </button>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-24 pb-8">
        {settings?.logo_url ? (
          <img
            src={settings.logo_url}
            alt={shopName}
            className="h-24 w-24 rounded-2xl border border-[#1a1a1a] object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-3xl font-extralight text-[#555]">
              {shopName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <h1 className="mt-5 text-[20px] font-extralight tracking-[-0.01em] text-[#ededed]">
          {shopName}
        </h1>

        {settings?.deal_title && (
          <div className="mt-3 rounded-xl border border-[#1a1a1a] px-5 py-3 text-center">
            <p className="text-[13px] font-light text-[#888]">{settings.deal_title}</p>
            {settings.deal_details && (
              <p className="mt-1 text-[12px] font-light text-[#555]">{settings.deal_details}</p>
            )}
          </div>
        )}
      </div>

      {/* Loyalty card */}
      <div className="mx-5 rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">YOUR PROGRESS</p>
          <p className="text-[11px] font-light text-[#444]">{visits}/{goal}</p>
        </div>

        {/* Progress dots */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: goal }).map((_, i) => (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                i < visits
                  ? isReady ? "bg-yellow-400/90" : "bg-[#ededed]"
                  : "border border-[#222] bg-transparent"
              }`}
            >
              {i < visits && <Check className="h-4 w-4 text-black" />}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[12px] font-light text-[#444]">
          {isReady
            ? "Show this screen to the cashier to redeem your reward"
            : checkedInToday
            ? "You've already checked in today — see you tomorrow!"
            : `Scan the QR code in-store to check in`}
        </p>

        {isReady && (
          <div className="mt-4 rounded-xl border border-yellow-900/40 bg-yellow-950/20 px-4 py-3 text-center">
            <p className="text-[12px] font-light tracking-[0.15em] text-yellow-300/80">
              REWARD READY — SHOW CASHIER
            </p>
          </div>
        )}
      </div>

      {/* Check-in result */}
      {checkinResult && (
        <div className="mx-5 mt-4 rounded-2xl border border-emerald-900/30 bg-emerald-950/20 p-5 text-center">
          <Check className="mx-auto h-6 w-6 text-emerald-400" />
          <p className="mt-2 text-[14px] font-light text-[#ededed]">{checkinResult.message}</p>
        </div>
      )}

      {err && (
        <div className="mx-5 mt-4 rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-center">
          <p className="text-[13px] font-light text-red-300/80">{err}</p>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="px-5 pb-8 pt-4 space-y-3">
        {!user && (
          <button
            onClick={() => router.push(`/customer/auth?redirect=/customer/shop/${shopSlug}`)}
            className="w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black"
          >
            SIGN IN TO TRACK PROGRESS
          </button>
        )}

        {user && !checkedInToday && !checkinResult && (
          <button
            onClick={handleCheckin}
            disabled={checkinLoading}
            className="w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
          >
            {checkinLoading ? "CHECKING IN…" : "CHECK IN HERE"}
          </button>
        )}

        <button
          onClick={() => setNotifEnabled(!notifEnabled)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#1a1a1a] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors hover:border-[#333] hover:text-[#888]"
        >
          <Bell className="h-3.5 w-3.5" />
          {notifEnabled ? "NOTIFICATIONS ON" : "GET NOTIFIED OF DEALS"}
        </button>
      </div>
    </div>
  );
}
