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
  reward_goal: number | null;
  reward_expires_days: number | null;
  bonus_days: number[] | null;
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
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0=none, 1=confirming, 2=deleting
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
  const [addressDraft, setAddressDraft] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSettingsMsg, setSaveSettingsMsg] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Customers tab
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersHasMore, setCustomersHasMore] = useState(false);
  const [customersTotal, setCustomersTotal] = useState(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerTab, setCustomerTab] = useState<"all" | "lapsed">("all");

  // Customer detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerCheckins, setCustomerCheckins] = useState<any[]>([]);
  const [customerRewards, setCustomerRewards] = useState<any[]>([]);
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false);

  // Email campaigns
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignMsg, setCampaignMsg] = useState("");
  const [campaignError, setCampaignError] = useState("");

  // Deal-change warning
  const [dealChangeWarning, setDealChangeWarning] = useState<{ affectedCount: number; knownCount: boolean } | null>(null);

  // Advanced settings
  const [rewardExpiresDaysDraft, setRewardExpiresDaysDraft] = useState<number | "">("");
  const [bonusDaysDraft, setBonusDaysDraft] = useState<number[]>([]);
  const [registerPinDraft, setRegisterPinDraft] = useState("");
  const [registerPinSet, setRegisterPinSet] = useState(false); // whether DB has a PIN

  // Manual check-in modal
  const [showManualCheckin, setShowManualCheckin] = useState(false);
  const [manualContact, setManualContact] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<any>(null);
  const [manualError, setManualError] = useState("");
  const logoutRouter = useRouter();
  const [billingData, setBillingData] = useState<{
    plan_type: string;
    rewards_this_month: number;
    estimated_charge: string;
  } | null>(null);

  const joinUrl = useMemo(() => {
    if (!origin || !shopSlug) return "";
    const base = `${origin}/join/${shopSlug}`;
    return joinToken ? `${base}?t=${joinToken}` : base;
  }, [origin, shopSlug, joinToken]);

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

        if (isCheckoutReturn && !isPaid && pollCountRef.current < 30) {
          pollCountRef.current += 1;
          // Poll faster at first, then back off
          const delay = pollCountRef.current < 10 ? 2000 : 5000;
          pollTimer = setTimeout(() => { if (!cancelled) loadShopStatus(); }, delay);
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
      if (json.join_token) setJoinToken(json.join_token);
      setSettings(s);
      setRewardGoalDraft(Number.isFinite(Number(s?.reward_goal)) ? Number(s.reward_goal) : 5);
      setShopNameDraft(String(s?.shop_name ?? ""));
      setDealTitleDraft(String(s?.deal_title ?? ""));
      setDealDetailsDraft(String(s?.deal_details ?? ""));
      setAddressDraft(String((s as any)?.address ?? ""));
      setRewardExpiresDaysDraft(s?.reward_expires_days ?? "");
      setBonusDaysDraft(Array.isArray(s?.bonus_days) ? s.bonus_days : []);
      // Load register_pin status from authenticated endpoint
      try {
        const pinRes = await fetch(`/api/merchant/shop-settings?shop_slug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" });
        if (pinRes.ok) {
          const pinJson = await pinRes.json();
          setRegisterPinSet(!!(pinJson.settings as any)?.register_pin);
        }
      } catch { /* non-fatal */ }
    } catch (e: any) {
      setSettingsError(e?.message ?? "Failed to load shop settings");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function saveShopSettings() {
    if (!shopSlug) return;

    // Check if deal_title or reward_goal changed — warn if customers have stamps in progress
    const dealChanged =
      dealTitleDraft.trim() !== (settings?.deal_title ?? "") ||
      rewardGoalDraft !== (settings?.reward_goal ?? 5);

    if (dealChanged && !dealChangeWarning) {
      const affectedCount = customersLoaded
        ? customers.filter((c: any) => (c.visits ?? 0) > 0).length
        : 0;
      if (affectedCount > 0 || !customersLoaded) {
        setDealChangeWarning({ affectedCount, knownCount: customersLoaded });
        return; // pause — wait for merchant to confirm
      }
    }

    // Confirmed or no change — proceed
    setDealChangeWarning(null);
    try {
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
          address: addressDraft.trim() || null,
          reward_expires_days: rewardExpiresDaysDraft === "" ? null : Number(rewardExpiresDaysDraft),
          bonus_days: bonusDaysDraft,
          ...(registerPinDraft !== "" ? { register_pin: registerPinDraft } : {}),
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save settings");
      setSaveSettingsMsg("Saved");
      setRegisterPinDraft("");
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

  async function handleDeleteAccount() {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      return;
    }
    setDeleteConfirmStep(2);
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/merchant/delete-account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete account");
      }
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      logoutRouter.push("/");
    } catch (e: any) {
      setDeletingAccount(false);
      setDeleteConfirmStep(0);
      alert(e?.message ?? "Something went wrong. Please try again.");
    }
  }

  async function loadCustomers(page = 1) {
    if (!shopSlug || customersLoading) return;
    setCustomersLoading(true);
    try {
      const res = await fetch(`/api/merchant/customers?shop_slug=${encodeURIComponent(shopSlug)}&page=${page}`);
      const json = await res.json();
      if (res.ok) {
        const next = json.customers ?? [];
        setCustomers(prev => page === 1 ? next : [...prev, ...next]);
        setCustomersPage(page);
        setCustomersHasMore(json.pagination?.has_more ?? false);
        setCustomersTotal(json.pagination?.total ?? next.length);
        setCustomersLoaded(true);
      }
    } finally {
      setCustomersLoading(false);
    }
  }

  async function handleManualCheckin(e: React.FormEvent) {
    e.preventDefault();
    setManualError("");
    setManualResult(null);
    setManualLoading(true);
    try {
      const res = await fetch("/api/merchant/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, contact: manualContact.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setManualError(json.error ?? "Failed"); }
      else {
        setManualResult(json);
        setManualContact("");
        // Refresh customer list if open
        if (customersLoaded) loadCustomers(1);
      }
    } catch (e: any) {
      setManualError(e?.message ?? "Unknown error");
    } finally {
      setManualLoading(false);
    }
  }

  /* ── Customer detail ── */
  async function openCustomerDetail(customer: any) {
    setSelectedCustomer(customer);
    setCustomerDetailLoading(true);
    setCustomerCheckins([]);
    setCustomerRewards([]);
    try {
      const res = await fetch(
        `/api/merchant/customer-checkins?shop_slug=${encodeURIComponent(shopSlug)}&customer_id=${encodeURIComponent(customer.id)}`
      );
      const json = await res.json();
      if (res.ok) {
        setCustomerCheckins(json.checkins ?? []);
        setCustomerRewards(json.rewards ?? []);
      }
    } finally {
      setCustomerDetailLoading(false);
    }
  }

  /* ── Email campaign ── */
  async function sendCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCampaignSending(true);
    setCampaignMsg("");
    setCampaignError("");
    try {
      const res = await fetch("/api/merchant/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, subject: campaignSubject, body: campaignBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send");
      setCampaignMsg(`Sent to ${json.sent} customer${json.sent !== 1 ? "s" : ""}${json.failed > 0 ? ` (${json.failed} failed)` : ""}`);
      setCampaignSubject("");
      setCampaignBody("");
    } catch (err: any) {
      setCampaignError(err?.message ?? "Error sending campaign");
    } finally {
      setCampaignSending(false);
    }
  }

  /* ── Auto-dismiss deal-change warning when drafts revert to saved values ── */
  useEffect(() => {
    if (!dealChangeWarning) return;
    const dealUnchanged =
      dealTitleDraft.trim() === (settings?.deal_title ?? "") &&
      rewardGoalDraft === (settings?.reward_goal ?? 5);
    if (dealUnchanged) setDealChangeWarning(null);
  }, [dealTitleDraft, rewardGoalDraft, settings, dealChangeWarning]);

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
              <>
                <GhostButton onClick={openBillingPortal} disabled={portalLoading}>
                  {portalLoading ? "Opening…" : "Manage billing"}
                </GhostButton>
                <Link
                  href={`/merchant/${shopSlug}/register`}
                  className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#888] transition-all duration-300 hover:border-[#555] hover:text-[#ededed]"
                >
                  Register tool
                </Link>
              </>
            )}
            {!paid && !waitingForPayment && isCheckoutReturn && (
              <GhostButton onClick={() => { pollCountRef.current = 0; window.location.reload(); }}>
                Refresh
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
                  <SectionLabel>TOTAL CUSTOMERS</SectionLabel>
                  <div className="mt-4 text-5xl font-extralight tracking-tight text-white">
                    {loading ? "…" : (data?.totals?.total ?? 0).toLocaleString()}
                  </div>
                  <p className="mt-3 text-[12px] font-light text-[#444]">All-time loyalty members</p>
                </div>

                {/* Today */}
                <div className="group rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                  <SectionLabel>CHECK-INS TODAY</SectionLabel>
                  <div className="mt-4 text-5xl font-extralight tracking-tight text-white">
                    {loading ? "…" : (data?.totals?.today ?? 0).toLocaleString()}
                  </div>
                  <p className="mt-3 text-[12px] font-light text-[#444]">Since midnight</p>
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
                <GhostButton onClick={loadStats}>Refresh stats</GhostButton>
                <button
                  onClick={() => setAutoRefresh(v => !v)}
                  className={`text-[11px] font-light tracking-[0.1em] transition-colors duration-300 ${autoRefresh ? "text-emerald-400" : "text-[#444] hover:text-[#888]"}`}
                >
                  {autoRefresh ? "● Live" : "Auto-refresh off"}
                </button>
                {lastUpdated && (
                  <span className="text-[11px] font-light text-[#2a2a2a]">
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
                SETUP REMINDER (new merchants who haven't set a reward yet)
                ============================================================ */}
            {paid && !settingsLoading && !settings?.deal_title && (
              <div className="mt-8 rounded-2xl border border-yellow-900/30 bg-yellow-950/10 px-6 py-5">
                <p className="text-[11px] font-light tracking-[0.2em] text-yellow-600/80">ACTION NEEDED</p>
                <p className="mt-1 text-[14px] font-light text-[#ededed]">Set your reward offer</p>
                <p className="mt-1 text-[12px] font-light text-[#555]">
                  Scroll down to <span className="text-[#888]">Offer &amp; reward</span> to add a reward title and details so customers know what they&rsquo;re earning.
                </p>
              </div>
            )}

            {/* ============================================================
                ANALYTICS
                ============================================================ */}
            {paid && <MerchantAnalytics shopSlug={shopSlug} />}

            {/* ============================================================
                CUSTOMERS
                ============================================================ */}
            {paid && (
              <section className="mt-14">
                <div className="luxury-divider mx-auto mb-14 max-w-xs" />
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">CUSTOMERS</p>
                    <p className="mt-1 text-[13px] font-light text-[#444]">
                      {customersLoaded
                        ? `${customersTotal.toLocaleString()} loyalty member${customersTotal !== 1 ? "s" : ""}`
                        : "Everyone who has joined your loyalty program"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <GhostButton onClick={() => setShowManualCheckin(true)}>
                      + Manual stamp
                    </GhostButton>
                    {customersLoaded && customers.length > 0 && (
                      <GhostButton onClick={() => window.open(`/api/merchant/customers?shop_slug=${encodeURIComponent(shopSlug)}&format=csv`, "_blank")}>
                        Export CSV
                      </GhostButton>
                    )}
                    {!customersLoaded && (
                      <GhostButton onClick={() => loadCustomers(1)} disabled={customersLoading}>
                        {customersLoading ? "Loading…" : "Load customers"}
                      </GhostButton>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                {customersLoaded && (
                  <div className="mb-4 flex gap-1 rounded-full border border-[#1a1a1a] p-1 w-fit">
                    {(["all", "lapsed"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCustomerTab(tab)}
                        className={`rounded-full px-4 py-1.5 text-[11px] font-light tracking-[0.1em] transition-all duration-300 ${
                          customerTab === tab
                            ? "bg-[#ededed] text-black"
                            : "text-[#555] hover:text-[#ededed]"
                        }`}
                      >
                        {tab === "all" ? "ALL" : "LAPSED 30+ DAYS"}
                      </button>
                    ))}
                  </div>
                )}

                {customersLoaded && (
                  <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden">
                    {customers.length > 0 && (
                      <div className="px-4 py-3 border-b border-[#111]">
                        <input
                          value={customerSearch}
                          onChange={e => setCustomerSearch(e.target.value)}
                          placeholder="Search by phone or email…"
                          className="w-full bg-transparent text-[13px] font-light text-[#ededed] placeholder:text-[#333] outline-none"
                        />
                      </div>
                    )}
                    {customers.length === 0 ? (
                      <div className="px-6 py-10 text-center text-[13px] font-light text-[#444]">
                        No customers yet — share your QR code to get started.
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-[#111]">
                            <th className="px-5 py-3 text-[10px] font-light tracking-[0.15em] text-[#444]">CONTACT</th>
                            <th className="px-5 py-3 text-[10px] font-light tracking-[0.15em] text-[#444]">STAMPS</th>
                            <th className="hidden px-5 py-3 text-[10px] font-light tracking-[0.15em] text-[#444] sm:table-cell">LAST VISIT</th>
                            <th className="hidden px-5 py-3 text-[10px] font-light tracking-[0.15em] text-[#444] sm:table-cell">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers
                            .filter(c => {
                              // Lapsed filter: no check-in in 30+ days
                              if (customerTab === "lapsed") {
                                if (!c.last_checkin_date) return true;
                                const lastDate = new Date(c.last_checkin_date);
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                if (lastDate > thirtyDaysAgo) return false;
                              }
                              if (!customerSearch) return true;
                              const q = customerSearch.toLowerCase();
                              return (c.phone ?? "").includes(q) || (c.email ?? "").toLowerCase().includes(q);
                            })
                            .map((c, i) => {
                              const goal = settings?.reward_goal ?? 5;
                              const progress = Math.min(((c.visits ?? 0) % goal) / goal, 1);
                              const isReady = (c.visits ?? 0) > 0 && (c.visits ?? 0) % goal === 0;
                              return (
                                <tr key={c.id} onClick={() => openCustomerDetail(c)} className={`cursor-pointer ${i > 0 ? "border-t border-[#0d0d0d]" : ""} hover:bg-[#0a0a0a]`}>
                                  <td className="px-5 py-3.5 text-[13px] font-light text-[#888] font-mono">
                                    {c.phone || c.email || "—"}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[13px] font-light text-[#ededed]">{c.visits ?? 0}</span>
                                      <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-[#111] sm:block">
                                        <div className="h-full rounded-full bg-[#333] transition-all" style={{ width: `${progress * 100}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="hidden px-5 py-3.5 text-[12px] font-light text-[#444] sm:table-cell">
                                    {c.last_checkin_date ?? "—"}
                                  </td>
                                  <td className="hidden px-5 py-3.5 sm:table-cell">
                                    {c.opted_out ? (
                                      <span className="text-[10px] font-light tracking-[0.1em] text-[#444]">OPTED OUT</span>
                                    ) : isReady ? (
                                      <span className="text-[10px] font-light tracking-[0.1em] text-yellow-500">REWARD READY</span>
                                    ) : (
                                      <span className="text-[10px] font-light tracking-[0.1em] text-[#333]">ACTIVE</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Load more */}
                {customersLoaded && customersHasMore && !customerSearch && customerTab === "all" && (
                  <div className="mt-4 flex justify-center">
                    <GhostButton onClick={() => loadCustomers(customersPage + 1)} disabled={customersLoading}>
                      {customersLoading ? "Loading…" : `Load more · ${customers.length} of ${customersTotal.toLocaleString()}`}
                    </GhostButton>
                  </div>
                )}
              </section>
            )}

            {/* ============================================================
                MANUAL CHECK-IN MODAL
                ============================================================ */}
            {showManualCheckin && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => { setShowManualCheckin(false); setManualResult(null); setManualError(""); }}>
                <div className="w-full max-w-md rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">MANUAL STAMP</p>
                  <p className="mt-2 text-[18px] font-extralight text-[#ededed]">Add a stamp</p>
                  <p className="mt-1 text-[13px] font-light text-[#444]">Enter a customer's phone number or email to add a stamp manually.</p>

                  {manualResult ? (
                    <div className="mt-6 rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-5 py-4">
                      <p className="text-[14px] font-light text-emerald-400">
                        {manualResult.status === "reward" ? "🎉 Reward earned!" : "✓ Stamp added"}
                      </p>
                      <p className="mt-1 text-[12px] font-light text-[#555]">
                        {manualResult.new_customer ? "New customer · " : ""}{manualResult.visits} / {manualResult.goal} stamps
                        {manualResult.status !== "reward" && ` · ${manualResult.remaining} to go`}
                      </p>
                      <button onClick={() => setManualResult(null)} className="mt-4 text-[12px] font-light text-[#555] hover:text-[#ededed]">
                        Add another →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleManualCheckin} className="mt-6 space-y-4">
                      <input
                        autoFocus
                        value={manualContact}
                        onChange={e => setManualContact(e.target.value)}
                        placeholder="Phone (e.g. 5551234567) or email"
                        className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#333]"
                      />
                      {manualError && (
                        <p className="text-[12px] font-light text-red-400">{manualError}</p>
                      )}
                      <div className="flex gap-3">
                        <button type="submit" disabled={manualLoading || !manualContact.trim()} className="flex-1 rounded-xl border border-[#ededed] py-3 text-[12px] font-light tracking-[0.1em] text-[#ededed] transition-all hover:bg-[#ededed] hover:text-black disabled:opacity-40">
                          {manualLoading ? "Adding…" : "Add stamp"}
                        </button>
                        <button type="button" onClick={() => { setShowManualCheckin(false); setManualResult(null); setManualError(""); }} className="rounded-xl border border-[#1a1a1a] px-5 py-3 text-[12px] font-light text-[#555] hover:border-[#333]">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================
                CUSTOMER DETAIL MODAL
                ============================================================ */}
            {selectedCustomer && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
                <div className="w-full max-w-md rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">CUSTOMER DETAIL</p>
                      <p className="mt-2 font-mono text-[15px] font-light text-[#ededed]">
                        {selectedCustomer.phone || selectedCustomer.email || "—"}
                      </p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="text-[#555] hover:text-[#ededed] text-[20px] leading-none">×</button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="rounded-xl border border-[#1a1a1a] p-3 text-center">
                      <p className="text-[10px] font-light tracking-[0.1em] text-[#555]">STAMPS</p>
                      <p className="mt-1 text-xl font-extralight text-[#ededed]">{selectedCustomer.visits ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-[#1a1a1a] p-3 text-center">
                      <p className="text-[10px] font-light tracking-[0.1em] text-[#555]">LAST VISIT</p>
                      <p className="mt-1 text-[12px] font-light text-[#ededed]">{selectedCustomer.last_checkin_date ?? "—"}</p>
                    </div>
                    <div className="rounded-xl border border-[#1a1a1a] p-3 text-center">
                      <p className="text-[10px] font-light tracking-[0.1em] text-[#555]">VISITS</p>
                      <p className="mt-1 text-xl font-extralight text-[#ededed]">{customerCheckins.length}</p>
                    </div>
                  </div>

                  {customerDetailLoading ? (
                    <p className="text-center text-[13px] font-light text-[#444]">Loading history…</p>
                  ) : (
                    <>
                      {/* Rewards */}
                      {customerRewards.length > 0 && (
                        <div className="mb-5">
                          <p className="text-[10px] font-light tracking-[0.15em] text-[#555] mb-3">REWARDS EARNED</p>
                          <div className="space-y-1.5">
                            {customerRewards.map((r, i) => (
                              <div key={i} className="flex items-center justify-between rounded-lg border border-[#111] px-3 py-2">
                                <span className="text-[12px] font-light text-[#888]">{r.reward_date}</span>
                                <span className={`text-[10px] font-light tracking-[0.1em] ${r.is_redeemed ? "text-emerald-500" : "text-yellow-500"}`}>
                                  {r.is_redeemed ? "REDEEMED" : "PENDING"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Check-in history */}
                      <div>
                        <p className="text-[10px] font-light tracking-[0.15em] text-[#555] mb-3">CHECK-IN HISTORY</p>
                        {customerCheckins.length === 0 ? (
                          <p className="text-[13px] font-light text-[#444]">No check-ins recorded.</p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto space-y-1.5">
                            {customerCheckins.map((c, i) => (
                              <div key={i} className="flex items-center justify-between rounded-lg border border-[#111] px-3 py-2">
                                <span className="text-[12px] font-light text-[#888]">{c.checkin_date}</span>
                                <span className="text-[11px] font-light text-[#444]">
                                  {new Date(c.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================
                EMAIL CAMPAIGNS
                ============================================================ */}
            {paid && (
              <section className="mt-14">
                <div className="luxury-divider mx-auto mb-14 max-w-xs" />
                <div>
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">EMAIL CAMPAIGNS</p>
                  <h2 className="mt-3 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">Send to customers</h2>
                  <p className="mt-1 text-[13px] font-light text-[#444]">
                    Sends to all opted-in customers who have an email address on file.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                  <form onSubmit={sendCampaign} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">SUBJECT</label>
                      <input
                        value={campaignSubject}
                        onChange={e => setCampaignSubject(e.target.value)}
                        placeholder="e.g. Double stamps this weekend!"
                        required
                        className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">MESSAGE</label>
                      <textarea
                        value={campaignBody}
                        onChange={e => setCampaignBody(e.target.value)}
                        placeholder="Write your message to customers…"
                        required
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                      />
                    </div>

                    {campaignMsg && (
                      <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-4 py-3">
                        <p className="text-[13px] font-light text-emerald-400">{campaignMsg}</p>
                      </div>
                    )}
                    {campaignError && (
                      <div className="rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3">
                        <p className="text-[13px] font-light text-red-400">{campaignError}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <PrimaryButton disabled={campaignSending || !campaignSubject.trim() || !campaignBody.trim()}>
                        {campaignSending ? "Sending…" : "Send campaign"}
                      </PrimaryButton>
                      <span className="text-[12px] font-light text-[#444]">Emails only · No SMS</span>
                    </div>
                  </form>
                </div>
              </section>
            )}

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
                          <Link
                            href={`/merchant/${shopSlug}/qr`}
                            className="rounded-full border border-[#2a2a2a] px-4 py-2 text-[12px] font-light tracking-[0.1em] text-[#888] transition-colors duration-300 hover:border-[#444] hover:text-[#ededed]"
                          >
                            Display in-store
                          </Link>
                          <Link
                            href={`/merchant/${shopSlug}/print-card`}
                            className="text-[12px] font-light tracking-[0.1em] text-[#555] transition-colors duration-300 hover:text-[#ededed]"
                          >
                            Print card
                          </Link>
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
                        <p className="mt-3 text-[12px] font-light text-[#333]">
                          Customers can also download the app:{" "}
                          <a
                            href="https://www.ventzon.com/download"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#555] underline underline-offset-2 transition-colors hover:text-[#ededed]"
                          >
                            ventzon.com/download
                          </a>
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
              <div>
                <SectionLabel>RECENT ACTIVITY</SectionLabel>
                <SectionTitle>Latest check-ins</SectionTitle>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#1a1a1a]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      <th className="px-6 py-4 text-[11px] font-light tracking-[0.2em] text-[#555]">
                        CONTACT
                      </th>
                      <th className="px-6 py-4 text-[11px] font-light tracking-[0.2em] text-[#555]">
                        TIME
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    {(data?.latest ?? []).length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-[13px] font-light text-[#444]" colSpan={2}>
                          {loading ? "Loading…" : "No check-ins yet — share your QR code to get started."}
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

                    {!paid && <span className="text-[11px] font-light text-[#444]">Available after activating subscription</span>}
                    {logoMsg && <span className="text-[11px] font-light text-[#555]">{logoMsg}</span>}
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

              <div className="mt-8">
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
                      <FieldLabel>STORE ADDRESS</FieldLabel>
                      {paid ? (
                        <input
                          value={addressDraft}
                          onChange={(e) => setAddressDraft(e.target.value)}
                          placeholder="e.g., 123 Main St, Brooklyn, NY 11201"
                          className="mt-2 w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] focus:border-[#333]"
                        />
                      ) : (
                        <div className="mt-2 text-[14px] font-light text-[#888]">
                          {settingsLoading ? "Loading…" : (settings as any)?.address || "—"}
                        </div>
                      )}
                      <p className="mt-1.5 text-[11px] font-light text-[#333]">
                        Shows your store as a pin on the customer map.
                      </p>
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

                    <div>
                      <FieldLabel>REWARD EXPIRY (DAYS)</FieldLabel>
                      {paid ? (
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={rewardExpiresDaysDraft}
                            onChange={(e) => setRewardExpiresDaysDraft(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="No expiry"
                            className="w-32 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                          />
                          <span className="text-[12px] font-light text-[#444]">days after earning</span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[14px] font-light text-[#888]">
                          {settings?.reward_expires_days ? `${settings.reward_expires_days} days` : "No expiry"}
                        </div>
                      )}
                      <p className="mt-2 text-[11px] font-light text-[#333]">
                        Leave blank for rewards that never expire.
                      </p>
                    </div>

                    <div>
                      <FieldLabel>BONUS STAMP DAYS</FieldLabel>
                      <p className="mt-1 text-[11px] font-light text-[#444]">Customers earn 2 stamps on these days.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
                          const isSelected = bonusDaysDraft.includes(idx);
                          return (
                            <button
                              key={day}
                              type="button"
                              disabled={!paid}
                              onClick={() => {
                                setBonusDaysDraft(prev =>
                                  isSelected ? prev.filter(d => d !== idx) : [...prev, idx]
                                );
                              }}
                              className={`rounded-full border px-3.5 py-1.5 text-[11px] font-light tracking-[0.05em] transition-all duration-200 disabled:opacity-40 ${
                                isSelected
                                  ? "border-[#ededed] bg-[#ededed] text-black"
                                  : "border-[#1a1a1a] text-[#555] hover:border-[#333]"
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>REGISTER TOOL PIN</FieldLabel>
                      <p className="mt-1 text-[11px] font-light text-[#444]">
                        {registerPinSet ? "A PIN is set. Enter a new one to change it, or save blank to remove it." : "Set a 4-digit PIN to lock the register tool. Leave blank for no PIN."}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={registerPinDraft}
                          onChange={(e) => setRegisterPinDraft(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder={registerPinSet ? "••••" : "e.g. 1234"}
                          className="w-32 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                        />
                        {registerPinSet && registerPinDraft === "" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch("/api/merchant/shop-settings", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ shop_slug: shopSlug, register_pin: "" }),
                              });
                              setRegisterPinSet(false);
                              setSaveSettingsMsg("PIN removed");
                              setTimeout(() => setSaveSettingsMsg(""), 1500);
                            }}
                            className="text-[11px] font-light text-red-400/70 hover:text-red-400 transition-colors"
                          >
                            Remove PIN
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deal-change warning */}
                  {dealChangeWarning && (
                    <div className="mt-6 rounded-xl border border-yellow-900/40 bg-yellow-950/10 px-5 py-4">
                      <p className="text-[13px] font-light text-yellow-300/90">
                        {dealChangeWarning.knownCount
                          ? dealChangeWarning.affectedCount === 1
                            ? "1 customer currently has stamps in progress toward the current reward."
                            : `${dealChangeWarning.affectedCount} customers currently have stamps in progress toward the current reward.`
                          : "Some customers may have stamps in progress toward the current reward."}
                        {" "}Changing the deal title or goal will affect them immediately.
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={saveShopSettings}
                          disabled={savingSettings}
                          className="rounded-full border border-yellow-700/60 px-5 py-2 text-[11px] font-light tracking-[0.1em] text-yellow-300 transition-all hover:bg-yellow-950/40 disabled:opacity-40"
                        >
                          {savingSettings ? "Saving…" : "Save anyway"}
                        </button>
                        <button
                          onClick={() => setDealChangeWarning(null)}
                          className="text-[11px] font-light text-[#555] transition-colors hover:text-[#888]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  {!dealChangeWarning && (
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
                  )}
                  {dealChangeWarning && saveSettingsMsg && (
                    <p className="mt-3 text-[12px] font-light text-[#555]">{saveSettingsMsg}</p>
                  )}
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
                          ? "$25/mo \u00b7 + $0.85 per reward redeemed"
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

          </>
        )}
      </div>

      {/* ============================================================
          DANGER ZONE
          ============================================================ */}
      <section className="mx-auto mt-16 w-full max-w-6xl px-4 pb-16">
        <div className="rounded-2xl border border-red-950/30 p-8">
          <p className="text-[11px] font-light tracking-[0.3em] text-red-900/60">DANGER ZONE</p>
          <div className="mt-6 flex items-start justify-between gap-8">
            <div className="flex-1">
              <p className="text-[14px] font-light text-[#888]">Delete account</p>
              <p className="mt-1 text-[12px] font-light text-[#444]">
                Permanently removes your account, all shops, all customer data, and cancels your subscription.
              </p>
              {deleteConfirmStep === 1 && (
                <div className="mt-4 rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3">
                  <p className="text-[12px] font-light text-red-300/80">
                    This cannot be undone. All customer data and your subscription will be permanently deleted.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="rounded-lg border border-red-800/60 px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-red-400 transition-colors hover:bg-red-950/30 disabled:opacity-40"
                    >
                      Yes, permanently delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmStep(0)}
                      className="text-[11px] font-light text-[#555] transition-colors hover:text-[#888]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            {deleteConfirmStep === 0 && (
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="shrink-0 rounded-xl border border-red-950/40 px-5 py-2.5 text-[12px] font-light tracking-[0.1em] text-red-900/60 transition-colors hover:border-red-900/60 hover:text-red-400 disabled:opacity-40"
              >
                Delete account
              </button>
            )}
          </div>
        </div>
      </section>

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
