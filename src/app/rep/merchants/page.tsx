"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Store } from "lucide-react";

type Merchant = {
  slug: string;
  name: string;
  plan: string;
  status: string;
  claimedAt: string | null;
  rewardsThisMonth: number;
  monthlyCommission: number;
};

function StatusPill({ plan, status }: { plan: string; status: string }) {
  if (plan === "pro" && status === "active") {
    return (
      <span className="rounded-full border border-emerald-900/40 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-light tracking-[0.1em] text-emerald-400/80">
        PRO
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="rounded-full border border-[#222] bg-[#111] px-2 py-0.5 text-[10px] font-light tracking-[0.1em] text-[#555]">
        FREE
      </span>
    );
  }
  return (
    <span className="rounded-full border border-yellow-900/40 bg-yellow-950/20 px-2 py-0.5 text-[10px] font-light tracking-[0.1em] text-yellow-600/80">
      {status.toUpperCase()}
    </span>
  );
}

export default function MerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rep/merchants")
      .then(r => {
        if (r.status === 401 || r.status === 403) { router.replace("/rep/auth"); return null; }
        return r.json();
      })
      .then(d => { if (d) setMerchants(d.merchants ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const totalCommission = merchants.reduce((sum, m) => sum + m.monthlyCommission, 0);

  return (
    <div className="min-h-full bg-black">
      <div className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 20px)" }}>
        <h1 className="text-[22px] font-extralight text-[#ededed]">My Merchants</h1>
        <p className="mt-1 text-[13px] font-light text-[#444]">
          {merchants.length} merchant{merchants.length !== 1 ? "s" : ""} · ${totalCommission.toFixed(2)}/mo this month
        </p>
      </div>

      <div className="px-5 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#1a1a1a] bg-[#080808]">
              <Store className="h-7 w-7 text-[#333]" />
            </div>
            <p className="mt-5 text-[17px] font-extralight text-[#ededed]">No merchants yet</p>
            <p className="mt-2 text-[13px] font-light text-[#555]">
              Sign up a business and log them here to start earning
            </p>
            <button
              onClick={() => router.push("/rep/merchants/new")}
              className="mt-6 rounded-2xl bg-[#ededed] px-6 py-3.5 text-[12px] font-light tracking-[0.15em] text-black transition-all active:bg-[#ccc]"
            >
              LOG FIRST MERCHANT
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {merchants.map(m => (
              <div key={m.slug} className="rounded-2xl border border-[#1a1a1a] bg-[#080808] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-light text-[#ededed] truncate">{m.name}</p>
                      <StatusPill plan={m.plan} status={m.status} />
                    </div>
                    <p className="mt-0.5 text-[12px] font-light text-[#444]">/{m.slug}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[16px] font-extralight text-[#ededed]">${m.monthlyCommission.toFixed(2)}</p>
                    <p className="mt-0.5 text-[11px] font-light text-[#444]">this month</p>
                  </div>
                </div>
                {m.rewardsThisMonth > 0 && (
                  <p className="mt-3 text-[11px] font-light text-[#444]">
                    {m.rewardsThisMonth} reward{m.rewardsThisMonth !== 1 ? "s" : ""} redeemed this month
                  </p>
                )}
                {m.claimedAt && (
                  <p className="mt-1 text-[11px] font-light text-[#333]">
                    Claimed {new Date(m.claimedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}

            <button
              onClick={() => router.push("/rep/merchants/new")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#222] py-4 text-[12px] font-light tracking-[0.15em] text-[#444] transition-colors active:text-[#666]"
            >
              <Plus className="h-3.5 w-3.5" /> LOG A MERCHANT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
