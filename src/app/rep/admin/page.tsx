"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Users, DollarSign, Download } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Rep = {
  id: string;
  full_name: string;
  email: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  totalMerchants: number;
  activePro: number;
  commissionThisMonth: number;
};

type PendingInvite = {
  id: string;
  email: string;
  full_name: string;
  token: string;
  expires_at: string;
};

export default function RepAdminPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [reps, setReps] = useState<Rep[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Invite form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/rep/admin")
      .then(r => {
        if (r.status === 401) { setUnauthorized(true); return null; }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setReps(d.reps ?? []);
        setPending(d.pendingInvites ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);
    setInviteLink(null);

    const res = await fetch("/api/rep/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, full_name: name }),
    });
    const data = await res.json();
    setInviting(false);

    if (!res.ok) { setInviteError(data.error); return; }

    const link = `${window.location.origin}/rep/join?token=${data.token}`;
    setInviteLink(link);
    setName(""); setEmail("");
    // Refresh
    fetch("/api/rep/admin").then(r => r.json()).then(d => setPending(d.pendingInvites ?? []));
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-black"><div className="h-5 w-5 animate-spin rounded-full border border-[#333] border-t-[#ededed]" /></div>;
  }

  if (unauthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-[14px] font-light text-[#555]">Admin access only.</p>
        <button onClick={() => router.push("/rep/home")} className="mt-4 text-[12px] font-light text-[#333]">Go back</button>
      </div>
    );
  }

  const totalCommission = reps.reduce((s, r) => s + r.commissionThisMonth, 0);

  return (
    <div className="min-h-full bg-black">
      <div className="flex items-start justify-between px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 20px)" }}>
        <div>
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">ADMIN</p>
          <h1 className="mt-1 text-[22px] font-extralight text-[#ededed]">Rep Management</h1>
        </div>
        <a
          href="/api/rep/admin/export"
          download
          className="mt-1 flex items-center gap-2 rounded-full border border-[#222] px-4 py-2 text-[11px] font-light tracking-[0.1em] text-[#555] transition-colors hover:border-[#444] hover:text-[#888]"
        >
          <Download className="h-3.5 w-3.5" /> EXPORT CSV
        </a>
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#1a1a1a] bg-[#080808] p-4">
            <Users className="h-4 w-4 text-[#444]" />
            <p className="mt-3 text-[26px] font-extralight text-[#ededed]">{reps.length}</p>
            <p className="mt-0.5 text-[11px] font-light text-[#444]">active reps</p>
          </div>
          <div className="rounded-xl border border-[#1a1a1a] bg-[#080808] p-4">
            <DollarSign className="h-4 w-4 text-[#444]" />
            <p className="mt-3 text-[26px] font-extralight text-[#ededed]">${totalCommission.toFixed(0)}</p>
            <p className="mt-0.5 text-[11px] font-light text-[#444]">owed this month</p>
          </div>
        </div>

        {/* Invite form */}
        <div className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">INVITE A REP</p>
          <form onSubmit={handleInvite} className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={inviting}
              className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444] focus:border-[#555] disabled:opacity-40"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={inviting}
              className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444] focus:border-[#555] disabled:opacity-40"
            />
            {inviteError && <p className="text-[12px] font-light text-red-400">{inviteError}</p>}
            <button
              type="submit"
              disabled={inviting}
              className="w-full rounded-xl border border-[#ededed] py-3 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black disabled:opacity-40"
            >
              {inviting ? "GENERATING…" : "GENERATE INVITE LINK"}
            </button>
          </form>

          {inviteLink && (
            <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-4">
              <p className="text-[11px] font-light tracking-[0.2em] text-emerald-400">INVITE LINK READY</p>
              <p className="mt-2 break-all text-[12px] font-light text-[#888]">{inviteLink}</p>
              <button
                onClick={() => copyLink(inviteLink)}
                className="mt-3 flex items-center gap-2 text-[12px] font-light text-[#ededed]"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}
        </div>

        {/* Active reps */}
        {reps.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] font-light tracking-[0.3em] text-[#555]">ACTIVE REPS</p>
            <div className="space-y-3">
              {reps.map(rep => (
                <div key={rep.id} className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[15px] font-light text-[#ededed]">{rep.full_name}</p>
                      <p className="mt-0.5 text-[12px] font-light text-[#444]">{rep.email}</p>
                      {rep.city && <p className="mt-0.5 text-[12px] font-light text-[#333]">{rep.city}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-extralight text-[#ededed]">${rep.commissionThisMonth.toFixed(2)}</p>
                      <p className="mt-0.5 text-[11px] font-light text-[#444]">this month</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-[12px] font-light text-[#444]">
                    <span>{rep.totalMerchants} merchants</span>
                    <span>{rep.activePro} pro</span>
                    <span>Since {new Date(rep.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending invites */}
        {pending.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] font-light tracking-[0.3em] text-[#555]">PENDING INVITES</p>
            <div className="space-y-2">
              {pending.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-[#1a1a1a] bg-[#050505] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-light text-[#888]">{inv.full_name}</p>
                    <p className="text-[11px] font-light text-[#444]">{inv.email}</p>
                  </div>
                  <button
                    onClick={() => copyLink(`${window.location.origin}/rep/join?token=${inv.token}`)}
                    className="flex items-center gap-1.5 text-[11px] font-light tracking-[0.1em] text-[#444] transition-colors hover:text-[#888]"
                  >
                    <Copy className="h-3 w-3" /> COPY
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
