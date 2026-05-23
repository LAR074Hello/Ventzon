"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Store, TrendingUp, ArrowRight, LogOut, Plus, X, Trash2 } from "lucide-react";
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

type CommissionLog = {
  id: string;
  amount: number;
  description: string;
  logged_at: string;
};

export default function RepHomePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Commission logs
  const [logs, setLogs] = useState<CommissionLog[]>([]);
  const [logMonthTotal, setLogMonthTotal] = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logAmount, setLogAmount] = useState("");
  const [logDescription, setLogDescription] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    loadLogs();
  }, [router]);

  function loadLogs() {
    fetch("/api/rep/commission-log")
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs ?? []);
        setLogMonthTotal(d.monthTotal ?? 0);
      })
      .catch(() => {});
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/rep/auth");
  }

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLogError("");
    const amount = parseFloat(logAmount);
    if (!amount || amount <= 0) { setLogError("Enter a valid amount"); return; }
    if (!logDescription.trim()) { setLogError("Add a description"); return; }

    setLogSaving(true);
    const res = await fetch("/api/rep/commission-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, description: logDescription.trim(), logged_at: logDate }),
    });
    setLogSaving(false);

    if (!res.ok) {
      const d = await res.json();
      setLogError(d.error ?? "Failed to save");
      return;
    }

    setShowLogModal(false);
    setLogAmount("");
    setLogDescription("");
    setLogDate(new Date().toISOString().slice(0, 10));
    loadLogs();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch("/api/rep/commission-log", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeletingId(null);
    loadLogs();
  }

  const firstName = profile?.full_name?.split(" ")[0];
  const monthName = new Date().toLocaleString("default", { month: "long" });

  function formatDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

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
            ${(( stats?.commissionThisMonth ?? 0) + logMonthTotal).toFixed(2)}
          </p>
          <div className="mt-2 space-y-0.5">
            {(stats?.commissionThisMonth ?? 0) > 0 && (
              <p className="text-[12px] font-light text-[#444]">
                Auto-tracked: ${stats?.commissionThisMonth.toFixed(2)} from {stats?.activePro ?? 0} merchant{stats?.activePro !== 1 ? "s" : ""}
              </p>
            )}
            {logMonthTotal > 0 && (
              <p className="text-[12px] font-light text-[#444]">
                Manually logged: ${logMonthTotal.toFixed(2)}
              </p>
            )}
          </div>
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

        {/* ── Manual Commission Log ── */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#111]">
            <div>
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">PAYMENTS RECEIVED</p>
              <p className="mt-0.5 text-[12px] font-light text-[#444]">Log what you've been paid</p>
            </div>
            <button
              onClick={() => { setShowLogModal(true); setLogError(""); }}
              className="flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#ededed] transition-colors hover:border-[#555]"
            >
              <Plus className="h-3 w-3" />
              LOG
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[13px] font-light text-[#333]">No payments logged yet</p>
              <p className="mt-1 text-[11px] font-light text-[#2a2a2a]">Tap + LOG when you receive a payment</p>
            </div>
          ) : (
            <div className="divide-y divide-[#0d0d0d]">
              {logs.map(log => (
                <div key={log.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-light text-[#ededed] truncate">{log.description}</p>
                    <p className="text-[11px] font-light text-[#444]">{formatDate(log.logged_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <p className="text-[15px] font-extralight text-emerald-400">+${Number(log.amount).toFixed(2)}</p>
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className="text-[#2a2a2a] transition-colors hover:text-red-500/60 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How commission works */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#050505] p-5">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">HOW YOU EARN</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Pro merchant active", value: "$12.50/mo", detail: "50% of $25 subscription" },
              { label: "Per reward redeemed", value: "$0.43", detail: "50% of $0.85 per redemption" },
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

      {/* ── Log Payment Modal ── */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm pb-0"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-[#1a1a1a] bg-[#080808] p-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">LOG A PAYMENT</p>
              <button onClick={() => setShowLogModal(false)} className="text-[#333] hover:text-[#666]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-[11px] font-light tracking-[0.2em] text-[#555] mb-2">AMOUNT RECEIVED ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-[16px] font-light">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={logAmount}
                    onChange={e => setLogAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] pl-8 pr-4 py-3.5 text-[20px] font-extralight text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#333]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-light tracking-[0.2em] text-[#555] mb-2">DESCRIPTION</label>
                <input
                  type="text"
                  value={logDescription}
                  onChange={e => setLogDescription(e.target.value)}
                  placeholder="e.g. Joe's Coffee — monthly"
                  className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#333]"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-light tracking-[0.2em] text-[#555] mb-2">DATE</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none focus:border-[#333]"
                />
              </div>

              {logError && (
                <p className="text-[12px] font-light text-red-400/80">{logError}</p>
              )}

              <button
                type="submit"
                disabled={logSaving}
                className="w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black disabled:opacity-40 mt-2"
              >
                {logSaving ? "SAVING…" : "SAVE PAYMENT"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
