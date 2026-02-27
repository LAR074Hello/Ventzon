"use client";

import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
// @ts-ignore - some installs of qrcode.react ship without TS types; runtime is fine
import { QRCodeCanvas } from "qrcode.react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { LogOut } from "lucide-react";
import MerchantAnalytics from "@/components/MerchantAnalytics";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StatsResponse = {
  shop_slug: string;
  totals: { total: number; today: number };
  latest: Array<{ phone: string; created_at: string }>;
  is_paid?: boolean;
  subscription_status?: string | null;
};

type ShopSettings = {
  shop_slug: string;
  shop_name: string | null;
  deal_title: string | null;
  deal_details: string | null;
  welcome_sms_template: string | null;
  reward_goal: number | null;
  reward_sms_template: string | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function maskPhone(phone: string) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (digits.length <= 4) return digits;
  return `***-***-${digits.slice(-4)}`;
}

function formatShortNY(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function safeTemplatePreview(tpl: string | null, shopName: string, dealTitle: string) {
  const t = (tpl ?? "").trim();
  if (!t) return "";
  return t.replaceAll("{{shop_name}}", shopName).replaceAll("{{deal_title}}", dealTitle);
}

/* ------------------------------------------------------------------ */
/*  Small UI components                                                */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-light tracking-[0.1em] text-[#555]">
      {children}
    </label>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border border-[#333] px-5 py-2.5 text-[12px] font-light tracking-[0.1em] text-[#ededed] transition-all duration-500 hover:border-[#666] hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  href,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center rounded-full border border-[#ededed] px-6 py-2.5 text-[12px] font-light tracking-[0.1em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:cursor-not-allowed disabled:opacity-40 ${className}`;

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Wrapper with Suspense                                              */
/* ------------------------------------------------------------------ */

export default function MerchantShopPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black text-[#ededed]">
          <p className="text-[13px] font-light text-[#555]">Loading dashboard…</p>
        </main>
      }
    >
      <MerchantShopPage />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

function MerchantShopPage() {
  const params = useParams<{ shop?: string }>();
  const shopSlug = useMemo(() => String(params?.shop ?? "").trim().toLowerCase(), [params]);

  const searchParams = useSearchParams();
  const isCheckoutReturn = searchParams.get("checkout") === "success";

  /* ── State ── */
  const [paid, setPaid] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [shopLoadError, setShopLoadError] = useState("");
  const [waitingForPayment, setWaitingForPayment] = useState(isCheckoutReturn);
  const pollCountRef = useRef(0);

  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const [data, setData] = useState<StatsResponse | null>(null);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [rewardGoalDraft, setRewardGoalDraft] = useState(5);
  const [shopNameDraft, setShopNameDraft] = useState("");
  const [dealTitleDraft, setDealTitleDraft] = useState("");
  const [dealDetailsDraft, setDealDetailsDraft] = useState("");
  const [welcomeSmsDraft, setWelcomeSmsDraft] = useState("");
  const [rewardSmsDraft, setRewardSmsDraft] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSettingsMsg, setSaveSettingsMsg] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutRouter = useRouter();
  const [billingData, setBillingData] = useState<{
    plan_type: string;
    rewards_this_month: number;
    estimated_charge: string;
  } | null>(null);

  const joinUrl = useMemo(() => {
    if (!origin || !shopSlug) return "";
    return `${origin}/join/${shopSlug}`;
  }, [origin, shopSlug]);

  const statsUrl = useMemo(() => {
    if (!shopSlug) return "";
    return `/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`;
  }, [shopSlug]);

  /* ── Shop status (payment polling) ── */
  const fetchShopStatus = useCallback(async () => {
    if (!shopSlug) return null;
    const supabase = createSupabaseBrowserClient();
    const { data: shopRow, error } = await supabase
      .from("shops")
      .select("is_paid,subscription_status,logo_url")
      .eq("slug", shopSlug)
      .maybeSingle();
    if (error) throw error;
    return shopRow;
  }, [shopSlug]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadShopStatus() {
      try {
        setShopLoadError("");
        if (!shopSlug) return;
        const shopRow = await fetchShopStatus();
        if (cancelled) return;

        if (!shopRow) {
          setShopLoadError("Shop not found. Double-check the link slug.");
          setPaid(false);
          setSubscriptionStatus("inactive");
          setWaitingForPayment(false);
          return;
        }

        const isPaid = Boolean((shopRow as any).is_paid);
        setPaid(isPaid);
        setSubscriptionStatus(String((shopRow as any).subscription_status ?? "inactive"));
        setLogoUrl((shopRow as any).logo_url || null);

        if (isPaid) {
          setWaitingForPayment(false);
          pollCountRef.current = 0;
          if (isCheckoutReturn) window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        if (isCheckoutReturn && !isPaid && pollCountRef.current < 10) {
          pollCountRef.current += 1;
          pollTimer = setTimeout(() => { if (!cancelled) loadShopStatus(); }, 2000);
        } else if (isCheckoutReturn && !isPaid) {
          setWaitingForPayment(false);
          pollCountRef.current = 0;
        }
      } catch (e: any) {
        console.error("[merchant] shop status exception", e);
        if (!cancelled) { setShopLoadError("Could not load shop status."); setWaitingForPayment(false); }
      }
    }

    loadShopStatus();
    return () => { cancelled = true; if (pollTimer) clearTimeout(pollTimer); };
  }, [shopSlug, fetchShopStatus, isCheckoutReturn]);

  /* ── Stats ── */
  async function loadStats() {
    try {
      setLoading(true);
      setLoadError("");
      if (!statsUrl) { setLoadError("Missing shop slug"); return; }
      const res = await fetch(statsUrl, { cache: "no-store" });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load stats");
      setData(json as StatsResponse);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  /* ── Settings ── */
  async function loadSettings() {
    try {
      setSettingsLoading(true);
      setSettingsError("");
      if (!shopSlug) { setSettingsError("Missing shop slug"); return; }
      const res = await fetch(`/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load shop settings");
      const s = json.settings as ShopSettings;
      setSettings(s);
      setRewardGoalDraft(Number.isFinite(Number(s?.reward_goal)) ? Number(s.reward_goal) : 5);
      setShopNameDraft(String(s?.shop_name ?? ""));
      setDealTitleDraft(String(s?.deal_title ?? ""));
      setDealDetailsDraft(String(s?.deal_details ?? ""));
      setWelcomeSmsDraft(String(s?.welcome_sms_template ?? ""));
      setRewardSmsDraft(String((s as any)?.reward_sms_template ?? ""));
    } catch (e: any) {
      setSettingsError(e?.message ?? "Failed to load shop settings");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveShopSettings() {
    try {
      if (!shopSlug) return;
      setSavingSettings(true);
      setSaveSettingsMsg("");
      const res = await fetch("/api/merchant/shop-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_slug: shopSlug,
          reward_goal: rewardGoalDraft,
          shop_name: shopNameDraft.trim() || null,
          deal_title: dealTitleDraft.trim() || null,
          deal_details: dealDetailsDraft.trim() || null,
          welcome_sms_template: welcomeSmsDraft || null,
          reward_sms_template: rewardSmsDraft || null,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save settings");
      setSaveSettingsMsg("Saved");
      await loadSettings();
      setTimeout(() => setSaveSettingsMsg(""), 1500);
    } catch (e: any) {
      setSaveSettingsMsg(e?.message ?? "Failed to save");
    } finally {
      setSavingSettings(false);
    }
  }

  /* ── Logo ── */
  async function uploadLogo(file: File) {
    if (!shopSlug) return;
    setLogoUploading(true);
    setLogoMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("shop_slug", shopSlug);
      const res = await fetch("/api/merchant/logo", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      setLogoUrl(json.logo_url);
      setLogoMsg("Uploaded");
      setTimeout(() => setLogoMsg(""), 2000);
    } catch (e: any) {
      setLogoMsg(e?.message ?? "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  /* ── Billing ── */
  async function openBillingPortal() {
    if (!shopSlug) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to open billing portal");
      window.location.href = d.url;
    } catch (e: any) {
      alert(e.message || "Could not open billing portal");
      setPortalLoading(false);
    }
  }

  /* ── Billing data ── */
  async function loadBilling() {
    if (!shopSlug) return;
    try {
      const res = await fetch(`/api/merchant/billing?shop_slug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setBillingData(json);
      }
    } catch {}
  }

  /* ── Clipboard ── */
  async function copyJoinLink() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  /* ── Logout ── */
  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    logoutRouter.push("/login");
    logoutRouter.refresh();
  }

  /* ── Initial load + auto-refresh ── */
  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await Promise.all([loadStats(), loadSettings(), loadBilling()]); })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsUrl]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => loadStats(), 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, statsUrl]);

  const isMissingShop = !shopSlug;

  /* ── Derived display values ── */
  const displayShopName = paid ? shopNameDraft : (settings?.shop_name || shopSlug);
  const displayDealTitle = paid ? dealTitleDraft : (settings?.deal_title || "");

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <main className="min-h-screen bg-black text-[#ededed]">
      {/* Radial glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative mx-auto max-w-5xl px-8 pb-20 pt-28">

        {/* ============================================================
            HEADER
            ============================================================ */}
        <header className="animate-fade-in anim-delay-200 opacity-0">
          <p className="text-[11px] font-light tracking-[0.5em] text-[#555]">
            MERCHANT DASHBOARD
          </p>
          <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-white sm:text-5xl">
            {settingsLoading ? shopSlug : (settings?.shop_name || shopSlug)}
          </h1>

          {/* Status bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#1a1a1a] px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#888]">
              {shopSlug}
            </span>
            <span
              className={`rounded-full border px-4 py-1.5 text-[11px] font-light tracking-[0.1em] ${
                paid
                  ? "border-emerald-800/50 text-emerald-400"
                  : waitingForPayment
                  ? "animate-pulse border-yellow-800/50 text-yellow-400"
                  : "border-[#1a1a1a] text-[#555]"
              }`}
            >
              {paid ? "Active" : waitingForPayment ? "Processing payment…" : "Inactive"}
              {subscriptionStatus && subscriptionStatus !== "inactive" ? ` · ${subscriptionStatus}` : ""}
            </span>
            {paid && (
              <GhostButton onClick={openBillingPortal} disabled={portalLoading}>
                {portalLoading ? "Opening…" : "Manage billing"}
              </GhostButton>
            )}
            {shopLoadError && (
              <span className="text-[12px] font-light text-[#555]">{shopLoadError}</span>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-[#1a1a1a] px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#555] transition-all duration-500 hover:border-[#333] hover:text-[#ededed] disabled:opacity-40"
            >
              <LogOut className="h-3 w-3" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>

        {isMissingShop ? (
          /* ── Missing shop fallback ── */
          <section className="mt-16 rounded-2xl border border-[#1a1a1a] p-8">
            <SectionLabel>ERROR</SectionLabel>
            <SectionTitle>Missing shop slug</SectionTitle>
            <p className="mt-4 text-[14px] font-light text-[#666]">
              Open this page like:{" "}
              <code className="rounded bg-[#111] px-2 py-0.5 font-mono text-[13px] text-[#888]">
                /merchant/your-shop-slug
              </code>
            </p>
          </section>
        ) : (
          <>
            {/* ============================================================
                STATS
                ============================================================ */}
            <section className="animate-fade-in-up anim-delay-400 mt-14 opacity-0">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total signups */}
                <div className="group rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                  <SectionLabel>TOTAL SIGNUPS</SectionLabel>
                  <div className="mt-4 text-5xl font-extralight tracking-tight text-white">
                    {loading ? "…" : (data?.totals?.total ?? 0).toLocaleString()}
                  </div>
                  <p className="mt-3 text-[12px] font-light text-[#444]">All time</p>
                </div>

                {/* Today */}
                <div className="group rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                  <SectionLabel>TODAY</SectionLabel>
                  <div className="mt-4 text-5xl font-extralight tracking-tight text-white">
                    {loading ? "…" : (data?.totals?.today ?? 0).toLocaleString()}
                  </div>
                  <p className="mt-3 text-[12px] font-light text-[#444]">New York time</p>
                </div>

                {/* Reward goal */}
                <div className="group rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                  <SectionLabel>REWARD GOAL</SectionLabel>
                  <div className="mt-4 text-5xl font-extralight tracking-tight text-white">
                    {settingsLoading ? "…" : (settings?.reward_goal ?? rewardGoalDraft)}
                  </div>
                  <p className="mt-3 text-[12px] font-light text-[#444]">Visits to earn reward</p>
                </div>
              </div>

              {/* Refresh controls */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <GhostButton onClick={loadStats}>Refresh</GhostButton>
                <label className="flex items-center gap-2 text-[12px] font-light text-[#555]">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-white"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Auto-refresh
                </label>
                {lastUpdated && (
                  <span className="text-[11px] font-light text-[#333]">
                    Updated {lastUpdated}
                  </span>
                )}
              </div>
            </section>

            {/* Errors */}
            {loadError && (
              <div className="mt-6 rounded-2xl border border-red-900/30 p-4 text-[13px] font-light text-red-400">
                {loadError}
              </div>
            )}
            {settingsError && (
              <div className="mt-6 rounded-2xl border border-red-900/30 p-4 text-[13px] font-light text-red-400">
                {settingsError}
              </div>
            )}

            {/* ============================================================
                ANALYTICS
                ============================================================ */}
            {paid && <MerchantAnalytics shopSlug={shopSlug} />}

            {/* ============================================================
                QR CODE & JOIN LINK
                ============================================================ */}
            <section className="mt-14">
              <div className="luxury-divider mx-auto mb-14 max-w-xs" />

              <div className="print-area rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333] sm:p-10">
                <div className="grid items-center gap-10 lg:grid-cols-[auto_1fr]">
                  {/* QR code */}
                  <div className="flex flex-col items-center gap-4">
                    <div className={`rounded-2xl bg-white p-4 shadow-sm ${!paid ? "opacity-40" : ""}`}>
                      <QRCodeCanvas value={paid ? (joinUrl || " ") : "locked"} size={180} />
                    </div>
                    {paid && (
                      <Link
                        href={`/merchant/${shopSlug}/print-card`}
                        className="text-[11px] font-light tracking-[0.15em] text-[#555] transition-colors duration-300 hover:text-[#ededed]"
                      >
                        Open print card
                      </Link>
                    )}
                  </div>

                  {/* Info + actions */}
                  <div>
                    <SectionLabel>JOIN LINK</SectionLabel>
                    <SectionTitle>
                      {paid ? "Share with customers" : "Activate to unlock"}
                    </SectionTitle>

                    {paid ? (
                      <>
                        <div className="mt-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-4">
                          <p className="break-all font-mono text-[13px] font-light text-[#888]">
                            {joinUrl}
                          </p>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <GhostButton onClick={copyJoinLink}>
                            {copied ? "Copied" : "Copy link"}
                          </GhostButton>
                          <GhostButton onClick={() => window.print()}>Print QR</GhostButton>
                          <a
                            href={joinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[12px] font-light tracking-[0.1em] text-[#555] transition-colors duration-300 hover:text-[#ededed]"
                          >
                            Open join page
                          </a>
                        </div>

                        <p className="mt-5 text-[13px] font-light leading-[1.7] text-[#444]">
                          Print this QR code and place it near your register.
                          Customers scan to join your rewards program instantly.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mt-4 text-[14px] font-light leading-[1.7] text-[#555]">
                          Subscribe to unlock your QR code, join link, and customer rewards.
                          This dashboard updates automatically once payment is confirmed.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <PrimaryButton href={`/merchant/subscribe?shop=${encodeURIComponent(shopSlug)}`}>
                            Activate now
                          </PrimaryButton>
                          <GhostButton onClick={loadStats}>Refresh status</GhostButton>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================
                LATEST SIGNUPS
                ============================================================ */}
            <section className="mt-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionLabel>ACTIVITY</SectionLabel>
                  <SectionTitle>Latest signups</SectionTitle>
                </div>
                <a
                  href={statsUrl}
                  className="text-[11px] font-light tracking-[0.1em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
                  target="_blank"
                  rel="noreferrer"
                >
                  Raw JSON
                </a>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#1a1a1a]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      <th className="px-6 py-4 text-[11px] font-light tracking-[0.2em] text-[#555]">
                        PHONE
                      </th>
                      <th className="px-6 py-4 text-[11px] font-light tracking-[0.2em] text-[#555]">
                        TIME
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    {(data?.latest ?? []).length === 0 ? (
                      <tr>
                        <td className="px-6 py-6 text-[13px] font-light text-[#444]" colSpan={2}>
                          {loading ? "Loading…" : "No signups yet."}
                        </td>
                      </tr>
                    ) : (
                      (data?.latest ?? []).map((row, idx) => (
                        <tr
                          key={`${row.phone}-${row.created_at}-${idx}`}
                          className="transition-colors duration-300 hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4 font-mono text-[13px] font-light text-[#ededed]">
                            {maskPhone(row.phone)}
                          </td>
                          <td className="px-6 py-4 font-mono text-[13px] font-light text-[#555]">
                            {formatShortNY(row.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ============================================================
                STORE LOGO
                ============================================================ */}
            <section className="mt-14">
              <div className="luxury-divider mx-auto mb-14 max-w-xs" />

              <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                <SectionLabel>BRANDING</SectionLabel>
                <SectionTitle>Store logo</SectionTitle>
                <p className="mt-2 text-[13px] font-light text-[#444]">
                  Displayed on your customer check-in page.
                </p>

                <div className="mt-6 flex items-center gap-6">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Store logo"
                      className="h-20 w-20 rounded-xl border border-[#1a1a1a] bg-white object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-[#333] text-[11px] font-light text-[#444]">
                      No logo
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className={`cursor-pointer ${!paid || logoUploading ? "pointer-events-none opacity-40" : ""}`}>
                      <GhostButton>
                        {logoUploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
                      </GhostButton>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={!paid || logoUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadLogo(f);
                          e.target.value = "";
                        }}
                      />
                    </label>

                    {logoMsg && <span className="text-[11px] font-light text-[#555]">{logoMsg}</span>}
                    {!paid && <span className="text-[11px] font-light text-[#444]">Activate subscription to upload</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================
                OFFER SETTINGS
                ============================================================ */}
            <section className="mt-14">
              <div className="luxury-divider mx-auto mb-14 max-w-xs" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionLabel>SETTINGS</SectionLabel>
                  <SectionTitle>Offer & reward</SectionTitle>
                </div>
                <GhostButton onClick={loadSettings}>Refresh</GhostButton>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {/* Left column: Offer details */}
                <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                    OFFER CUSTOMERS SEE
                  </p>

                  <div className="mt-6 space-y-5">
                    <div>
                      <FieldLabel>SHOP NAME</FieldLabel>
                      {paid ? (
                        <input
                          value={shopNameDraft}
                          onChange={(e) => setShopNameDraft(e.target.value)}
                          placeholder={shopSlug}
                          className="mt-2 w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] focus:border-[#333]"
                        />
                      ) : (
                        <div className="mt-2 text-[15px] font-normal text-white">
                          {settingsLoading ? "Loading…" : settings?.shop_name || shopSlug}
                        </div>
                      )}
                    </div>

                    <div>
                      <FieldLabel>REWARD TITLE</FieldLabel>
                      {paid ? (
                        <input
                          value={dealTitleDraft}
                          onChange={(e) => setDealTitleDraft(e.target.value)}
                          placeholder="e.g., 10% off your next visit"
                          className="mt-2 w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] focus:border-[#333]"
                        />
                      ) : (
                        <div className="mt-2 text-[15px] font-normal text-white">
                          {settingsLoading ? "Loading…" : settings?.deal_title || "—"}
                        </div>
                      )}
                    </div>

                    <div>
                      <FieldLabel>REWARD DETAILS</FieldLabel>
                      {paid ? (
                        <textarea
                          value={dealDetailsDraft}
                          onChange={(e) => setDealDetailsDraft(e.target.value)}
                          placeholder="e.g., Show this message at checkout within 7 days."
                          rows={3}
                          className="mt-2 w-full resize-none rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] focus:border-[#333]"
                        />
                      ) : (
                        <div className="mt-2 whitespace-pre-wrap text-[14px] font-light text-[#888]">
                          {settingsLoading ? "Loading…" : settings?.deal_details || "—"}
                        </div>
                      )}
                    </div>

                    <div>
                      <FieldLabel>VISITS TO EARN REWARD</FieldLabel>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <select
                          value={rewardGoalDraft}
                          onChange={(e) => setRewardGoalDraft(Number(e.target.value))}
                          disabled={!paid}
                          className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 focus:border-[#333] disabled:opacity-40"
                        >
                          {Array.from({ length: 30 }, (_, i) => i + 2).map((n) => (
                            <option key={n} value={n}>{n} visits</option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-[11px] font-light text-[#333]">
                        Coffee shops: 5–10 visits. Salons: 2–5.
                      </p>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="mt-8 flex items-center gap-3">
                    <PrimaryButton onClick={saveShopSettings} disabled={savingSettings || !paid}>
                      {savingSettings ? "Saving…" : "Save settings"}
                    </PrimaryButton>
                    {saveSettingsMsg && (
                      <span className="text-[12px] font-light text-[#555]">{saveSettingsMsg}</span>
                    )}
                    {!paid && (
                      <span className="text-[11px] font-light text-[#444]">Activate to edit</span>
                    )}
                  </div>
                </div>

                {/* Right column: SMS templates */}
                <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
                    SMS MESSAGES
                  </p>

                  {/* Welcome SMS */}
                  <div className="mt-6">
                    <FieldLabel>WELCOME TEXT</FieldLabel>
                    {paid && (
                      <textarea
                        value={welcomeSmsDraft}
                        onChange={(e) => setWelcomeSmsDraft(e.target.value)}
                        placeholder={'Welcome to {{shop_name}} Rewards! Reply STOP to opt out. Your deal: {{deal_title}}'}
                        rows={3}
                        className="mt-2 w-full resize-none rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 font-mono text-[12px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] focus:border-[#333]"
                      />
                    )}
                    <div className="mt-3 rounded-xl border border-[#111] bg-[#0a0a0a] px-4 py-3">
                      <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">PREVIEW</p>
                      <p className="mt-2 whitespace-pre-wrap font-mono text-[12px] font-light text-[#888]">
                        {settingsLoading
                          ? "Loading…"
                          : safeTemplatePreview(
                              paid ? welcomeSmsDraft : (settings?.welcome_sms_template ?? ""),
                              displayShopName || shopSlug,
                              displayDealTitle
                            ) || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Reward SMS */}
                  <div className="mt-8">
                    <FieldLabel>REWARD EARNED TEXT</FieldLabel>
                    {paid && (
                      <textarea
                        value={rewardSmsDraft}
                        onChange={(e) => setRewardSmsDraft(e.target.value)}
                        placeholder={'You earned your reward at {{shop_name}}! Show this text to redeem: {{deal_title}}'}
                        rows={3}
                        className="mt-2 w-full resize-none rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 font-mono text-[12px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] focus:border-[#333]"
                      />
                    )}
                    <div className="mt-3 rounded-xl border border-[#111] bg-[#0a0a0a] px-4 py-3">
                      <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">PREVIEW</p>
                      <p className="mt-2 whitespace-pre-wrap font-mono text-[12px] font-light text-[#888]">
                        {settingsLoading
                          ? "Loading…"
                          : safeTemplatePreview(
                              paid ? rewardSmsDraft : String((settings as any)?.reward_sms_template ?? ""),
                              displayShopName || shopSlug,
                              displayDealTitle
                            ) || "—"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 text-[11px] font-light text-[#333]">
                    Use <code className="font-mono text-[#555]">{"{{shop_name}}"}</code> and{" "}
                    <code className="font-mono text-[#555]">{"{{deal_title}}"}</code>. Keep messages short.
                  </p>
                </div>
              </div>
            </section>

            {/* ============================================================
                BILLING (small, understated)
                ============================================================ */}
            {paid && billingData && (
              <section className="mt-14">
                <div className="luxury-divider mx-auto mb-14 max-w-xs" />

                <div className="rounded-2xl border border-[#1a1a1a] px-8 py-6 transition-all duration-500 hover:border-[#333]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full border border-[#1a1a1a] px-3 py-1 text-[10px] font-light tracking-[0.2em] text-[#555]">
                        {billingData.plan_type === "pro" ? "PRO" : "FREE"}
                      </span>
                      <span className="text-[13px] font-light text-[#666]">
                        {billingData.plan_type === "pro"
                          ? "$19/mo \u00b7 All rewards included"
                          : `${billingData.rewards_this_month} reward${billingData.rewards_this_month === 1 ? "" : "s"} this month \u2192 ${billingData.estimated_charge}`}
                      </span>
                    </div>
                    <button
                      onClick={openBillingPortal}
                      disabled={portalLoading}
                      className="text-[11px] font-light tracking-[0.1em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
                    >
                      {portalLoading ? "Opening\u2026" : "Manage billing"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================
                QUICK START
                ============================================================ */}
            <section className="mt-14">
              <div className="luxury-divider mx-auto mb-14 max-w-xs" />

              <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                <SectionLabel>QUICK START</SectionLabel>
                <SectionTitle>Customer join page</SectionTitle>

                <div className="mt-6 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-4">
                  <p className="text-[10px] font-light tracking-[0.2em] text-[#444]">JOIN URL</p>
                  <p className="mt-2 break-all font-mono text-[13px] font-light text-[#888]">
                    {paid ? joinUrl : "(locked — activate to reveal your join link)"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {paid ? (
                    <>
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-light tracking-[0.1em] text-[#555] transition-colors duration-300 hover:text-[#ededed]"
                      >
                        Open join page
                      </a>
                      <span className="text-[#333]">·</span>
                      <button
                        onClick={copyJoinLink}
                        className="text-[12px] font-light tracking-[0.1em] text-[#555] transition-colors duration-300 hover:text-[#ededed]"
                      >
                        {copied ? "Copied" : "Copy link"}
                      </button>
                    </>
                  ) : (
                    <PrimaryButton href={`/merchant/subscribe?shop=${encodeURIComponent(shopSlug)}`}>
                      Activate now
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ============================================================
          PRINT STYLES — Only show QR panel when printing
          ============================================================ */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          main { background: white !important; }
          main * { visibility: hidden; }
          main .print-area, main .print-area * { visibility: visible; }
          main .print-area {
            position: absolute;
            left: 24px;
            top: 24px;
            width: calc(100% - 48px);
            border: 1px solid #e5e5e5 !important;
            background: white !important;
            color: black !important;
          }
          main .print-area .bg-white { box-shadow: none !important; }
        }
      `}</style>
    </main>
  );
}
