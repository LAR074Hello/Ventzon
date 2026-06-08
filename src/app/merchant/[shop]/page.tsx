"use client";

import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
// @ts-ignore - some installs of qrcode.react ship without TS types; runtime is fine
import { QRCodeCanvas } from "qrcode.react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { LogOut, Sparkles, RefreshCw } from "lucide-react";
import MerchantAnalytics from "@/components/MerchantAnalytics";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StatsResponse = {
  shop_slug: string;
  totals: { total: number; today: number };
  latest: Array<{ phone: string | null; email: string | null; created_at: string }>;
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

  // Win-back campaign
  const [winBackSending, setWinBackSending] = useState(false);
  const [winBackMsg, setWinBackMsg] = useState("");
  const [winBackError, setWinBackError] = useState("");

  // Promotions
  const [promoBody, setPromoBody] = useState("");
  const [promoSending, setPromoSending] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promotionsLoaded, setPromotionsLoaded] = useState(false);

  // AI Promo Writer
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGoal, setAiGoal] = useState("slow_day");
  const [aiDetails, setAiDetails] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [aiError, setAiError] = useState("");

  // AI Insights
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

  // QR card PDF download
  const [qrCardDownloading, setQrCardDownloading] = useState(false);

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

  // Community Rewards
  type CommunityGroupSetting = {
    group_key: string;
    label: string;
    enabled: boolean;
    boost: number;
  };
  const [communitySettings, setCommunitySettings] = useState<CommunityGroupSetting[]>([]);
  const [communityMerchantId, setCommunityMerchantId] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communitySaving, setCommunitySaving] = useState(false);
  const [communityMsg, setCommunityMsg] = useState("");

  // Community grant modal
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantContact, setGrantContact] = useState("");
  const [grantGroup, setGrantGroup] = useState("care");
  const [grantBoost, setGrantBoost] = useState(1.5);
  const [grantExpires, setGrantExpires] = useState(12);
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantMsg, setGrantMsg] = useState("");
  const [grantError, setGrantError] = useState("");

  // Community analytics
  type CommunityAnalytics = {
    total_community_scans: number;
    total_community_customers: number;
    total_merchant_scans: number;
    verified_badges: number;
    merchant_grants: number;
    groups: Array<{
      group_key: string;
      scan_count: number;
      unique_customers: number;
      repeat_rate: number;
      avg_boost: number;
      total_boost_cost: number;
    }>;
  };
  const [communityAnalytics, setCommunityAnalytics] = useState<CommunityAnalytics | null>(null);
  const [communityAnalyticsLoading, setCommunityAnalyticsLoading] = useState(false);

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

  /* ── Win-back campaign (lapsed customers only) ── */
  async function sendWinBack() {
    setWinBackSending(true);
    setWinBackMsg("");
    setWinBackError("");
    try {
      const res = await fetch("/api/merchant/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, target: "lapsed", win_back: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send");
      setWinBackMsg(
        json.sent === 0
          ? "No lapsed customers with an email address on file."
          : `Win-back email sent to ${json.sent} lapsed customer${json.sent !== 1 ? "s" : ""}${json.failed > 0 ? ` (${json.failed} failed)` : ""}.`
      );
    } catch (err: any) {
      setWinBackError(err?.message ?? "Error sending win-back email");
    } finally {
      setWinBackSending(false);
    }
  }

  /* ── Promotions ── */
  async function loadPromotions() {
    if (!shopSlug) return;
    try {
      const res = await fetch(`/api/promotions?shop_slug=${encodeURIComponent(shopSlug)}`);
      const json = await res.json();
      if (res.ok) { setPromotions(json.promotions ?? []); setPromotionsLoaded(true); }
    } catch {}
  }

  async function submitPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoBody.trim()) return;
    setPromoSending(true);
    setPromoMsg("");
    setPromoError("");
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop_slug: shopSlug, body: promoBody }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit");
      setPromoMsg("Promotion submitted for review.");
      setPromoBody("");
      await loadPromotions();
      setTimeout(() => setPromoMsg(""), 3000);
    } catch (err: any) {
      setPromoError(err?.message ?? "Error submitting promotion");
    } finally {
      setPromoSending(false);
    }
  }

  async function generatePromoOptions() {
    setAiGenerating(true);
    setAiOptions([]);
    setAiError("");
    try {
      const res = await fetch("/api/ai/promo-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          storeType: settings?.shop_name || shopSlug,
          goal: aiGoal,
          details: aiDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed");
      setAiOptions(json.options ?? []);
    } catch (err: any) {
      setAiError(err?.message ?? "Failed to generate options");
    } finally {
      setAiGenerating(false);
    }
  }

  function pickAIOption(text: string) {
    setPromoBody(text);
    setShowAIModal(false);
    setAiOptions([]);
    setAiDetails("");
  }

  /* ── AI Insights ── */
  const loadInsight = useCallback(async (refresh = false) => {
    if (!shopSlug) return;
    setInsightLoading(true);
    setInsightError(false);
    try {
      const params = new URLSearchParams({ shop_slug: shopSlug });
      if (refresh) params.set("refresh", "1");
      const res = await fetch(`/api/ai/insights?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.insight) throw new Error(json.error ?? "No insight");
      setInsight(json.insight);
    } catch {
      setInsightError(true);
    } finally {
      setInsightLoading(false);
    }
  }, [shopSlug]);

  /* ── QR card PDF download ── */
  async function downloadQRCard() {
    if (!shopSlug) return;
    setQrCardDownloading(true);
    try {
      const res = await fetch(`/api/merchant/qr-card?shop=${encodeURIComponent(shopSlug)}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${shopSlug}-qr-card.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Download failed");
    } finally {
      setQrCardDownloading(false);
    }
  }

  /* ── Community Rewards: load settings ── */
  async function loadCommunitySettings() {
    if (!shopSlug) return;
    setCommunityLoading(true);
    try {
      const res = await fetch(`/api/merchant/community-settings?shop=${encodeURIComponent(shopSlug)}`);
      const json = await res.json();
      if (json.ok) {
        setCommunitySettings(json.settings ?? []);
        setCommunityMerchantId(json.merchant_id ?? "");
      }
    } catch {
      // non-fatal
    } finally {
      setCommunityLoading(false);
    }
  }

  async function saveCommunitySettings() {
    if (!shopSlug) return;
    setCommunitySaving(true);
    setCommunityMsg("");
    try {
      const res = await fetch("/api/merchant/community-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shopSlug,
          updates: communitySettings.map((g) => ({
            group_key: g.group_key,
            enabled: g.enabled,
            boost: g.boost,
          })),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setCommunityMsg("Saved.");
        setTimeout(() => setCommunityMsg(""), 2500);
      } else {
        setCommunityMsg(json.error ?? "Save failed");
      }
    } catch (e: any) {
      setCommunityMsg(e?.message ?? "Save failed");
    } finally {
      setCommunitySaving(false);
    }
  }

  async function loadCommunityAnalytics() {
    if (!shopSlug) return;
    setCommunityAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/merchant/community-analytics?shop=${encodeURIComponent(shopSlug)}`);
      const json = await res.json();
      if (json.ok) setCommunityAnalytics(json);
    } catch {
      // non-fatal
    } finally {
      setCommunityAnalyticsLoading(false);
    }
  }

  async function submitGrant() {
    if (!grantContact.trim() || !shopSlug) return;
    setGrantLoading(true);
    setGrantError("");
    setGrantMsg("");
    try {
      const res = await fetch("/api/merchant/community-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shopSlug,
          contact: grantContact.trim(),
          group_key: grantGroup,
          boost: grantBoost,
          expires_months: grantExpires,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setGrantMsg("Perk granted.");
        setGrantContact("");
        setTimeout(() => { setShowGrantModal(false); setGrantMsg(""); }, 1800);
      } else {
        setGrantError(json.error ?? "Failed to grant perk");
      }
    } catch (e: any) {
      setGrantError(e?.message ?? "Failed");
    } finally {
      setGrantLoading(false);
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
    (async () => { if (!cancelled) await Promise.all([loadStats(), loadSettings(), loadBilling(), loadCommunitySettings(), loadCommunityAnalytics()]); })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsUrl]);

  useEffect(() => {
    if (shopSlug) loadInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopSlug]);

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

      <div className="relative mx-auto max-w-5xl px-4 sm:px-8 pb-20 pt-28">

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

        {/* ============================================================
            ONBOARDING CHECKLIST (shown until all steps complete)
            ============================================================ */}
        {!isMissingShop && !settingsLoading && (() => {
          const hasLogo = !!logoUrl;
          const hasDeal = !!(settings?.deal_title?.trim());
          const hasAddress = !!(addressDraft?.trim());
          const allDone = hasLogo && hasDeal && hasAddress;
          if (allDone) return null;
          const steps = [
            { done: true, label: "Create your shop", action: null },
            { done: hasDeal, label: "Set your reward deal", action: () => document.getElementById("settings-section")?.scrollIntoView({ behavior: "smooth" }) },
            { done: hasLogo, label: "Upload your logo", action: () => document.getElementById("settings-section")?.scrollIntoView({ behavior: "smooth" }) },
            { done: hasAddress, label: "Add your business address", action: () => document.getElementById("settings-section")?.scrollIntoView({ behavior: "smooth" }) },
            { done: false, label: "Print your QR code", action: null, href: `/merchant/${shopSlug}/print-card` },
          ];
          const doneCount = steps.filter(s => s.done).length;
          return (
            <section className="animate-fade-in-up anim-delay-300 mt-10 opacity-0">
              <div className="rounded-2xl border border-[#1e1e1e] bg-[#050505] p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">GETTING STARTED</p>
                  <p className="text-[11px] font-light text-[#333]">{doneCount}/{steps.length} complete</p>
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-[#111]">
                  <div className="h-1 rounded-full bg-[#ededed] transition-all duration-700" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
                </div>
                <ul className="mt-5 space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${step.done ? "border-emerald-700 bg-emerald-950" : "border-[#2a2a2a]"}`}>
                        {step.done && <span className="text-[10px] text-emerald-400">✓</span>}
                      </div>
                      <span className={`text-[13px] font-light ${step.done ? "text-[#444] line-through" : "text-[#bbb]"}`}>
                        {step.label}
                      </span>
                      {!step.done && (step.href ? (
                        <a href={step.href} className="ml-auto text-[11px] font-light tracking-[0.1em] text-[#555] underline decoration-[#333] underline-offset-2 hover:text-[#ededed]">Go →</a>
                      ) : step.action ? (
                        <button onClick={step.action} className="ml-auto text-[11px] font-light tracking-[0.1em] text-[#555] underline decoration-[#333] underline-offset-2 hover:text-[#ededed]">Go →</button>
                      ) : null)}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })()}

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
                AI INSIGHT CARD
                ============================================================ */}
            <section className="mt-8">
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#040404] p-6 transition-all duration-500 hover:border-[#2a2a2a]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#555]" />
                    <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">THIS WEEK&apos;S INSIGHT</p>
                  </div>
                  <button
                    onClick={() => loadInsight(true)}
                    disabled={insightLoading}
                    title="Refresh insight"
                    className="flex items-center gap-1.5 rounded-full border border-[#1a1a1a] px-3 py-1.5 text-[11px] font-light text-[#444] transition-all duration-300 hover:border-[#333] hover:text-[#888] disabled:opacity-40"
                  >
                    <RefreshCw className={`h-3 w-3 ${insightLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>

                {insightLoading ? (
                  /* Skeleton */
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3.5 w-full rounded-full bg-[#111]" />
                    <div className="h-3.5 w-4/5 rounded-full bg-[#111]" />
                  </div>
                ) : insightError ? (
                  <p className="text-[13px] font-light text-[#444]">
                    Check back after more customers visit — insights appear once you have a week of data.
                  </p>
                ) : insight ? (
                  <p className="text-[14px] font-light leading-relaxed text-[#bbb]">{insight}</p>
                ) : (
                  <p className="text-[13px] font-light text-[#444]">Loading your insight…</p>
                )}
              </div>
            </section>

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
                  <div className="flex flex-wrap gap-3">
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
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 rounded-full border border-[#1a1a1a] p-1">
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

                    {/* Win-back button — only visible on lapsed tab */}
                    {customerTab === "lapsed" && paid && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={sendWinBack}
                          disabled={winBackSending}
                          className="rounded-full border border-[#2a2a2a] px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#888] transition-all duration-300 hover:border-[#ededed] hover:text-[#ededed] disabled:opacity-40"
                        >
                          {winBackSending ? "Sending…" : "Send win-back email"}
                        </button>
                        {winBackMsg && (
                          <p className="text-[11px] font-light text-emerald-400">{winBackMsg}</p>
                        )}
                        {winBackError && (
                          <p className="text-[11px] font-light text-red-400">{winBackError}</p>
                        )}
                      </div>
                    )}
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
                        {manualResult.status === "reward" ? "Reward earned." : "Stamp added."}
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
                PROMOTIONS
                ============================================================ */}
            {paid && (
              <section className="mt-14">
                <div className="luxury-divider mx-auto mb-14 max-w-xs" />
                <div>
                  <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">PROMOTIONS</p>
                  <h2 className="mt-3 text-xl font-extralight tracking-[-0.01em] text-white sm:text-2xl">Send a promotion</h2>
                  <p className="mt-1 text-[13px] font-light text-[#444]">
                    Write a short message to share with your customers. Promotions are reviewed before going out.
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-[#1a1a1a] p-6 transition-all duration-500 hover:border-[#333]">
                  <form onSubmit={submitPromo} className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-[11px] font-light tracking-[0.15em] text-[#555]">MESSAGE</label>
                        <button
                          type="button"
                          onClick={() => { setShowAIModal(true); setAiOptions([]); setAiError(""); }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] px-3.5 py-1.5 text-[11px] font-light tracking-[0.1em] text-[#888] transition-all duration-300 hover:border-[#ededed] hover:text-[#ededed]"
                        >
                          <span>✦</span> Write with AI
                        </button>
                      </div>
                      <textarea
                        value={promoBody}
                        onChange={e => setPromoBody(e.target.value)}
                        placeholder="e.g. It's a slow Tuesday — come in today and get a free cookie with any drink ☕"
                        required
                        rows={4}
                        maxLength={160}
                        className="w-full resize-none rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                      />
                      <p className={`mt-1 text-right text-[11px] font-light ${promoBody.length > 140 ? "text-yellow-500/70" : "text-[#333]"}`}>
                        {promoBody.length}/160
                      </p>
                    </div>

                    {promoMsg && (
                      <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-4 py-3">
                        <p className="text-[13px] font-light text-emerald-400">{promoMsg}</p>
                      </div>
                    )}
                    {promoError && (
                      <div className="rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3">
                        <p className="text-[13px] font-light text-red-400">{promoError}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <PrimaryButton disabled={promoSending || !promoBody.trim()}>
                        {promoSending ? "Submitting…" : "Submit for review"}
                      </PrimaryButton>
                      {!promotionsLoaded && (
                        <button type="button" onClick={loadPromotions} className="text-[11px] font-light text-[#444] hover:text-[#888] transition-colors">
                          View history
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Promotion history */}
                {promotionsLoaded && promotions.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-[#1a1a1a] overflow-hidden">
                    <div className="border-b border-[#111] px-5 py-3">
                      <p className="text-[10px] font-light tracking-[0.3em] text-[#555]">HISTORY</p>
                    </div>
                    <div className="divide-y divide-[#0d0d0d]">
                      {promotions.map((p) => (
                        <div key={p.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-[13px] font-light leading-relaxed text-[#bbb]">{p.body}</p>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-light tracking-[0.1em] ${
                              p.status === "approved" ? "border border-emerald-900/40 text-emerald-500" :
                              p.status === "rejected" ? "border border-red-900/40 text-red-500" :
                              "border border-[#2a2a2a] text-[#555]"
                            }`}>
                              {p.status?.toUpperCase()}
                            </span>
                          </div>
                          {p.reject_reason && (
                            <p className="mt-1.5 text-[11px] font-light text-[#444]">Reason: {p.reject_reason}</p>
                          )}
                          <p className="mt-1 text-[11px] font-light text-[#333]">
                            {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                          <GhostButton onClick={downloadQRCard} disabled={qrCardDownloading}>
                            {qrCardDownloading ? "Generating…" : "↓ Download Print-Ready Card (PDF)"}
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
                            href="https://apps.apple.com/us/app/ventzon/id6763768638"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#555] underline underline-offset-2 transition-colors hover:text-[#ededed]"
                          >
                            App Store
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
                            {row.phone ? maskPhone(row.phone) : row.email ? row.email.replace(/(.{2}).+(@.+)/, "$1***$2") : "—"}
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

              <div id="settings-section" className="flex items-end justify-between gap-4">
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
                COMMUNITY REWARDS SETTINGS  (Phase 2 + 4 + 5)
                ============================================================ */}
            <section className="mt-14">
              <div className="luxury-divider mx-auto mb-14 max-w-xs" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionLabel>COMMUNITY REWARDS</SectionLabel>
                  <SectionTitle>Give extra stamps to special customers</SectionTitle>
                </div>
                <GhostButton onClick={loadCommunitySettings}>Refresh</GhostButton>
              </div>

              <div className="mt-8 space-y-4">
                {communityLoading ? (
                  <p className="text-[13px] font-light text-[#444]">Loading…</p>
                ) : (
                  <>
                    {/* Per-group toggles */}
                    <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                      <p className="text-[11px] font-light tracking-[0.3em] text-[#555] mb-6">
                        GROUPS &amp; BOOST MULTIPLIERS
                      </p>
                      <div className="space-y-5">
                        {(communitySettings.length > 0
                          ? communitySettings
                          : [
                              { group_key: "veteran", label: "Veterans", enabled: false, boost: 1.5 },
                              { group_key: "student", label: "Students", enabled: false, boost: 1.5 },
                              { group_key: "senior", label: "Seniors (60+)", enabled: false, boost: 1.5 },
                              { group_key: "first_responder", label: "First Responders", enabled: false, boost: 1.5 },
                              { group_key: "care", label: "Care Community", enabled: false, boost: 1.5 },
                            ]
                        ).map((g) => (
                          <div key={g.group_key} className="flex items-center justify-between gap-4">
                            {/* Toggle */}
                            <button
                              onClick={() => {
                                if (!paid) return;
                                setCommunitySettings((prev) =>
                                  prev.map((x) =>
                                    x.group_key === g.group_key ? { ...x, enabled: !x.enabled } : x
                                  )
                                );
                              }}
                              className={`flex items-center gap-3 text-left transition-colors ${paid ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                            >
                              <span
                                className={`inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors duration-300 ${
                                  g.enabled ? "border-[#ededed] bg-[#ededed]" : "border-[#333] bg-transparent"
                                }`}
                              >
                                <span
                                  className={`h-3.5 w-3.5 rounded-full transition-transform duration-300 ${
                                    g.enabled ? "translate-x-4 bg-black" : "translate-x-0.5 bg-[#444]"
                                  }`}
                                />
                              </span>
                              <span className="text-[14px] font-light text-[#ededed]">{g.label}</span>
                            </button>

                            {/* Boost multiplier */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-light text-[#555]">BOOST</span>
                              <input
                                type="number"
                                min={1.0}
                                max={5.0}
                                step={0.25}
                                disabled={!paid || !g.enabled}
                                value={g.boost}
                                onChange={(e) => {
                                  const val = Math.min(5, Math.max(1, parseFloat(e.target.value) || 1));
                                  setCommunitySettings((prev) =>
                                    prev.map((x) =>
                                      x.group_key === g.group_key ? { ...x, boost: val } : x
                                    )
                                  );
                                }}
                                className="w-16 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1.5 text-center text-[13px] font-light text-[#ededed] outline-none transition-colors focus:border-[#333] disabled:opacity-30"
                              />
                              <span className="text-[11px] font-light text-[#444]">×</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {paid ? (
                        <div className="mt-6 flex items-center justify-between">
                          <button
                            onClick={saveCommunitySettings}
                            disabled={communitySaving}
                            className="rounded-full border border-[#ededed] px-6 py-2.5 text-[12px] font-light tracking-[0.1em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
                          >
                            {communitySaving ? "Saving…" : "Save boosts"}
                          </button>
                          {communityMsg && (
                            <p className="text-[12px] font-light text-[#555]">{communityMsg}</p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-6 text-[11px] font-light text-[#444]">Activate to enable community rewards</p>
                      )}
                    </div>

                    {/* How verification works */}
                    <div className="rounded-2xl border border-[#1a1a1a] px-6 py-5">
                      <p className="text-[11px] font-light tracking-[0.3em] text-[#555] mb-3">HOW IT WORKS</p>
                      <div className="space-y-2 text-[12px] font-light text-[#444] leading-relaxed">
                        <p>🎖 <strong className="text-[#666] font-light">Veterans</strong> — verified via VA Lighthouse API (global badge, works at all merchants)</p>
                        <p>🎓 <strong className="text-[#666] font-light">Students</strong> — verified via .edu email link (global badge)</p>
                        <p>👴 <strong className="text-[#666] font-light">Seniors</strong> — derived from date of birth at scan time, no badge stored</p>
                        <p>🚒 <strong className="text-[#666] font-light">First Responders</strong> — merchant grant only (use &quot;Grant a perk&quot; below)</p>
                        <p>💙 <strong className="text-[#666] font-light">Care Community</strong> — merchant grant only, cancer patients &amp; family</p>
                        <p className="mt-2 text-[#333]">Boosts resolve as max, not stack. A customer who qualifies for multiple groups gets the highest boost only.</p>
                      </div>
                    </div>

                    {/* Grant a perk */}
                    {paid && (
                      <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">MANUAL GRANTS</p>
                            <p className="mt-2 text-[15px] font-extralight text-[#ededed]">Grant a perk</p>
                            <p className="mt-1 text-[12px] font-light text-[#444]">
                              Give a community boost to a specific customer by phone or email.
                            </p>
                          </div>
                          <GhostButton onClick={() => { setShowGrantModal(true); setGrantError(""); setGrantMsg(""); }}>
                            + Grant
                          </GhostButton>
                        </div>
                      </div>
                    )}

                    {/* Community analytics */}
                    {communityAnalytics && (communityAnalytics.total_community_scans > 0) && (
                      <div className="rounded-2xl border border-[#1a1a1a] p-8 transition-all duration-500 hover:border-[#333]">
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">COMMUNITY ANALYTICS · 90 DAYS</p>
                          <button
                            onClick={loadCommunityAnalytics}
                            disabled={communityAnalyticsLoading}
                            className="text-[11px] font-light text-[#444] hover:text-[#888] transition-colors disabled:opacity-40"
                          >
                            {communityAnalyticsLoading ? "…" : "Refresh"}
                          </button>
                        </div>

                        {/* Summary row */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="rounded-xl border border-[#1a1a1a] px-4 py-3 text-center">
                            <p className="text-[22px] font-extralight text-white">{communityAnalytics.total_community_scans}</p>
                            <p className="text-[10px] font-light tracking-[0.2em] text-[#555] mt-1">COMMUNITY SCANS</p>
                          </div>
                          <div className="rounded-xl border border-[#1a1a1a] px-4 py-3 text-center">
                            <p className="text-[22px] font-extralight text-white">{communityAnalytics.total_community_customers}</p>
                            <p className="text-[10px] font-light tracking-[0.2em] text-[#555] mt-1">UNIQUE CUSTOMERS</p>
                          </div>
                          <div className="rounded-xl border border-[#1a1a1a] px-4 py-3 text-center">
                            <p className="text-[22px] font-extralight text-white">
                              {communityAnalytics.verified_badges}
                              <span className="text-[14px] text-[#555]"> / {communityAnalytics.verified_badges + communityAnalytics.merchant_grants}</span>
                            </p>
                            <p className="text-[10px] font-light tracking-[0.2em] text-[#555] mt-1">VERIFIED / TOTAL</p>
                          </div>
                        </div>

                        {/* Per-group rows */}
                        {communityAnalytics.groups.length > 0 && (
                          <div className="space-y-3">
                            {communityAnalytics.groups.map((g) => (
                              <div key={g.group_key} className="flex items-center justify-between rounded-xl border border-[#111] px-4 py-3">
                                <div>
                                  <p className="text-[13px] font-light text-[#ededed] capitalize">
                                    {g.group_key.replace("_", " ")}
                                  </p>
                                  <p className="text-[11px] font-light text-[#555]">
                                    {g.unique_customers} customer{g.unique_customers !== 1 ? "s" : ""} · {g.repeat_rate}% repeat
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[13px] font-light text-[#ededed]">{g.scan_count} scans</p>
                                  <p className="text-[11px] font-light text-[#555]">{g.avg_boost}× avg boost</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
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
          AI PROMO WRITER MODAL
          ============================================================ */}
      {showAIModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={() => { setShowAIModal(false); setAiOptions([]); setAiError(""); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[#1a1a1a] bg-[#080808] p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">AI PROMO WRITER</p>
                <p className="mt-2 text-[18px] font-extralight text-[#ededed]">Generate options</p>
              </div>
              <button
                onClick={() => { setShowAIModal(false); setAiOptions([]); setAiError(""); }}
                className="text-[#555] hover:text-[#ededed] text-[22px] leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {aiOptions.length === 0 ? (
              <div className="space-y-5">
                {/* Goal dropdown */}
                <div>
                  <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">
                    WHAT&apos;S THE GOAL?
                  </label>
                  <select
                    value={aiGoal}
                    onChange={e => setAiGoal(e.target.value)}
                    className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors focus:border-[#333]"
                  >
                    <option value="slow_day">Slow day traffic boost</option>
                    <option value="new_item">New item announcement</option>
                    <option value="holiday">Holiday / weekend special</option>
                    <option value="win_back">Win back lapsed customers</option>
                    <option value="appreciation">General appreciation</option>
                  </select>
                </div>

                {/* Details field */}
                <div>
                  <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">
                    ANYTHING SPECIFIC TO MENTION? <span className="text-[#333]">(optional)</span>
                  </label>
                  <input
                    value={aiDetails}
                    onChange={e => setAiDetails(e.target.value)}
                    placeholder="e.g. 20% off lattes, new fall menu, free cookie…"
                    className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                  />
                </div>

                {aiError && (
                  <div className="rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3">
                    <p className="text-[13px] font-light text-red-400">{aiError}</p>
                  </div>
                )}

                <button
                  onClick={generatePromoOptions}
                  disabled={aiGenerating}
                  className="w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
                >
                  {aiGenerating ? "Generating…" : "Generate Options"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-light tracking-[0.15em] text-[#555] mb-4">PICK ONE TO USE</p>
                {aiOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => pickAIOption(opt)}
                    className="group w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-4 text-left transition-all duration-300 hover:border-[#ededed] hover:bg-[#111]"
                  >
                    <p className="text-[13px] font-light leading-relaxed text-[#bbb] group-hover:text-[#ededed] transition-colors">{opt}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className={`text-[11px] font-light ${opt.length > 140 ? "text-yellow-500/70" : "text-[#333]"}`}>
                        {opt.length}/155 chars
                      </p>
                      <p className="text-[11px] font-light tracking-[0.1em] text-[#444] group-hover:text-[#888] transition-colors">
                        Use this →
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { setAiOptions([]); setAiError(""); }}
                  className="mt-2 w-full text-center text-[11px] font-light text-[#444] hover:text-[#888] transition-colors"
                >
                  ← Try different options
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          GRANT A PERK MODAL
          ============================================================ */}
      {showGrantModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setShowGrantModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-[#1a1a1a] bg-[#0d0d0d] p-8 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">COMMUNITY REWARDS</p>
                <p className="mt-2 text-[18px] font-extralight text-[#ededed]">Grant a perk</p>
              </div>
              <button
                onClick={() => setShowGrantModal(false)}
                className="text-[#555] hover:text-[#ededed] text-[22px] leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              {/* Customer lookup */}
              <div>
                <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">
                  CUSTOMER PHONE OR EMAIL
                </label>
                <input
                  value={grantContact}
                  onChange={(e) => setGrantContact(e.target.value)}
                  placeholder="+1 555 000 0000 or name@example.com"
                  className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors placeholder:text-[#333] focus:border-[#333]"
                />
              </div>

              {/* Group picker */}
              <div>
                <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">
                  GROUP
                </label>
                <select
                  value={grantGroup}
                  onChange={(e) => setGrantGroup(e.target.value)}
                  className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors focus:border-[#333]"
                >
                  <option value="care">💙 Care Community (cancer patients &amp; family)</option>
                  <option value="first_responder">🚒 First Responder</option>
                  <option value="veteran">🎖 Veteran</option>
                  <option value="student">🎓 Student</option>
                </select>
              </div>

              {/* Boost */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">
                    BOOST MULTIPLIER
                  </label>
                  <input
                    type="number"
                    min={1.0}
                    max={5.0}
                    step={0.25}
                    value={grantBoost}
                    onChange={(e) => setGrantBoost(Math.min(5, Math.max(1, parseFloat(e.target.value) || 1)))}
                    className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors focus:border-[#333]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-light tracking-[0.15em] text-[#555] mb-2">
                    EXPIRES (MONTHS)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    step={1}
                    value={grantExpires}
                    onChange={(e) => setGrantExpires(Math.max(1, parseInt(e.target.value) || 12))}
                    className="w-full rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[14px] font-light text-[#ededed] outline-none transition-colors focus:border-[#333]"
                  />
                </div>
              </div>

              {grantError && (
                <div className="rounded-xl border border-red-900/30 bg-red-950/10 px-4 py-3">
                  <p className="text-[13px] font-light text-red-400">{grantError}</p>
                </div>
              )}
              {grantMsg && (
                <p className="text-[13px] font-light text-green-400">{grantMsg}</p>
              )}

              <button
                onClick={submitGrant}
                disabled={grantLoading || !grantContact.trim()}
                className="w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
              >
                {grantLoading ? "Granting…" : "Grant perk"}
              </button>

              <p className="text-[11px] font-light text-[#333] text-center">
                Grants are for this shop only · Default 12-month expiry · Customer is not notified of revocation
              </p>
            </div>
          </div>
        </div>
      )}

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
