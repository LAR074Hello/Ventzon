"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
// @ts-ignore - some installs of qrcode.react ship without TS types; runtime is fine
import { QRCodeCanvas } from "qrcode.react";
import { createClient } from "@supabase/supabase-js";

type StatsResponse = {
  shop_slug: string;
  totals: { total: number; today: number };
  latest: Array<{ phone: string; created_at: string }>;
  // Optional: some installs return this from the stats endpoint
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

function maskPhone(phone: string) {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  if (digits.length <= 4) return digits;
  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatShortNY(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
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
  return t
    .replaceAll("{{shop_name}}", shopName)
    .replaceAll("{{deal_title}}", dealTitle);
}

export default function MerchantShopPage() {
  const params = useParams<{ shop?: string }>();

  const shopSlug = useMemo(() => {
    return String(params?.shop ?? "").trim().toLowerCase();
  }, [params]);

  const [paid, setPaid] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("inactive");
  const [shopLoadError, setShopLoadError] = useState<string>("");

  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    // Avoid hydration mismatch by only reading window on the client
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setShopLoadError("");

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !anon) {
          // If env isn't present, fall back to locked state rather than crashing.
          return;
        }
        if (!shopSlug) return;

        const supabase = createClient(url, anon);

        const { data: shopRow, error } = await supabase
          .from("shops")
          .select("is_paid,subscription_status")
          .eq("slug", shopSlug)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("[merchant] failed to load shop", error);
          setShopLoadError("Could not load shop status.");
          return;
        }

        if (!shopRow) {
          setShopLoadError("Shop not found. Double-check the link slug.");
          setPaid(false);
          setSubscriptionStatus("inactive");
          return;
        }

        setPaid(Boolean((shopRow as any).is_paid));
        setSubscriptionStatus(String((shopRow as any).subscription_status ?? "inactive"));
      } catch (e: any) {
        console.error("[merchant] shop status exception", e);
        if (!cancelled) setShopLoadError("Could not load shop status.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shopSlug]);

  const [data, setData] = useState<StatsResponse | null>(null);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [rewardGoalDraft, setRewardGoalDraft] = useState<number>(5);
  // Draft state for editable merchant settings
  const [shopNameDraft, setShopNameDraft] = useState<string>("");
  const [dealTitleDraft, setDealTitleDraft] = useState<string>("");
  const [dealDetailsDraft, setDealDetailsDraft] = useState<string>("");
  const [welcomeSmsDraft, setWelcomeSmsDraft] = useState<string>("");
  const [rewardSmsDraft, setRewardSmsDraft] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSettingsMsg, setSaveSettingsMsg] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const joinUrl = useMemo(() => {
    if (!origin || !shopSlug) return "";
    return `${origin}/join/${shopSlug}`;
  }, [origin, shopSlug]);

  const statsUrl = useMemo(() => {
    if (!shopSlug) return "";
    return `/merchant/stats?shop_slug=${encodeURIComponent(shopSlug)}`;
  }, [shopSlug]);

  async function loadStats() {
    try {
      setLoading(true);
      setLoadError("");

      if (!statsUrl) {
        setLoadError("Missing shop slug");
        return;
      }

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

  async function loadSettings() {
    try {
      setSettingsLoading(true);
      setSettingsError("");

      if (!shopSlug) {
        setSettingsError("Missing shop slug");
        return;
      }

      const res = await fetch(
        `/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load shop settings");

      setSettings(json.settings as ShopSettings);
      const goal = Number((json.settings as any)?.reward_goal ?? 5);
      setRewardGoalDraft(Number.isFinite(goal) ? goal : 5);
      // Initialize draft fields from loaded settings
      const s = json.settings as ShopSettings;
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

      const payload: any = {
        shop_slug: shopSlug,
        reward_goal: rewardGoalDraft,
        shop_name: shopNameDraft.trim() || null,
        deal_title: dealTitleDraft.trim() || null,
        deal_details: dealDetailsDraft.trim() || null,
        welcome_sms_template: welcomeSmsDraft || null,
        reward_sms_template: rewardSmsDraft || null,
      };

      const res = await fetch("/api/merchant/shop-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save settings");

      setSaveSettingsMsg("Saved ✓");
      await loadSettings();
      window.setTimeout(() => setSaveSettingsMsg(""), 1500);
    } catch (e: any) {
      setSaveSettingsMsg(e?.message ?? "Failed to save");
    } finally {
      setSavingSettings(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await Promise.all([loadStats(), loadSettings()]);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsUrl]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      loadStats();
    }, 15000); // 15s feels “live” without being annoying
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, statsUrl]);

  async function copyJoinLink() {
    if (!joinUrl) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function printQr() {
    window.print();
  }

  const isMissingShop = !shopSlug;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* subtle premium glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-200px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-neutral-800 blur-3xl" />
        <div className="absolute right-[-220px] top-[140px] h-[520px] w-[520px] rounded-full bg-neutral-900 blur-3xl" />
        <div className="absolute left-[-220px] bottom-[80px] h-[520px] w-[520px] rounded-full bg-neutral-900 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs tracking-[0.35em] text-neutral-400">
            VENTZON REWARDS
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Merchant Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-300">
            View signups and share your shop’s join link. Totals follow New York time. Refresh to see new signups instantly.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-neutral-800 bg-neutral-950/40 px-3 py-1 text-xs text-neutral-300">
              Shop: <span className="font-mono text-neutral-100">{shopSlug || "(missing)"}</span>
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                paid
                  ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-200"
                  : "border-neutral-800 bg-neutral-950/40 text-neutral-300"
              }`}
            >
              {paid ? "Active" : "Inactive"}
              {subscriptionStatus && subscriptionStatus !== "inactive"
                ? ` • ${subscriptionStatus}`
                : ""}
            </span>
            {shopLoadError ? (
              <span className="text-xs text-neutral-400">
                {shopLoadError}
              </span>
            ) : null}
          </div>
        </div>

        {isMissingShop ? (
          <section className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
            <div className="text-sm text-neutral-300">Missing shop slug</div>
            <div className="mt-2 text-sm text-neutral-400">
              Open this page like:
            </div>
            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4 font-mono text-sm text-neutral-200">
              /merchant/govans-groceries
            </div>
          </section>
        ) : (
          <>
            {/* Top row */}
            <section className="grid gap-6 lg:grid-cols-3">
              {/* Total */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
                <div className="text-sm text-neutral-400">Total signups</div>
                <div className="mt-2 text-5xl font-semibold tracking-tight">
                  {loading ? "…" : data?.totals?.total ?? 0}
                </div>
              </div>

              {/* Today */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
                <div className="text-sm text-neutral-400">Signups today</div>
                <div className="mt-2 text-5xl font-semibold tracking-tight">
                  {loading ? "…" : data?.totals?.today ?? 0}
                </div>
              </div>

              {/* QR / print area */}
              <div className="print-area rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-neutral-400">Join link (QR)</div>
                  {copied ? (
                    <div className="text-xs text-neutral-200">Copied ✓</div>
                  ) : (
                    <div className="text-xs text-neutral-500">
                      Print & place near checkout
                    </div>
                  )}
                </div>

                {!paid ? (
                  <div className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                    <div className="text-sm font-medium text-neutral-200">
                      Activation required
                    </div>
                    <div className="mt-2 text-sm text-neutral-400">
                      Subscribe to unlock your QR code, join link, and printing. This dashboard updates automatically once payment is confirmed.
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`/merchant/subscribe?shop=${encodeURIComponent(shopSlug)}`}
                        className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                      >
                        Activate now
                      </a>
                      <button
                        onClick={loadStats}
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                      >
                        Refresh stats
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col items-center gap-3 opacity-60">
                      <div className="flex justify-center">
                        <div className="rounded-2xl bg-white p-3 shadow-sm">
                          <QRCodeCanvas value={"locked"} size={160} />
                        </div>
                      </div>

                      <div className="w-full min-w-0">
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                          <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                            Join URL
                          </div>
                          <div className="mt-2 break-all font-mono text-xs text-neutral-200">(locked)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col items-center gap-3">
                    <div className="flex justify-center">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <QRCodeCanvas value={joinUrl || " "} size={160} />
                      </div>
                    </div>

                    <div className="w-full min-w-0">
                      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                        <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                          Join URL
                        </div>
                        <div className="mt-2 max-h-24 overflow-auto whitespace-normal break-all font-mono text-xs text-neutral-200">
                          {joinUrl}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={copyJoinLink}
                          className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                        >
                          Copy link
                        </button>

                        <button
                          onClick={printQr}
                          className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                        >
                          Print
                        </button>

                        <button
                          onClick={loadStats}
                          className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                        >
                          Refresh
                        </button>

                        <label className="flex items-center gap-2 text-xs text-neutral-400">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-white"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                          />
                          Auto-refresh
                        </label>

                        <div className="ml-auto flex items-center text-xs text-neutral-500">
                          {lastUpdated ? (
                            <span>Last updated: {lastUpdated}</span>
                          ) : (
                            <span>&nbsp;</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Error */}
            {loadError ? (
              <div className="mt-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
                {loadError}
              </div>
            ) : null}
            {settingsError ? (
              <div className="mt-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
                {settingsError}
              </div>
            ) : null}

            {/* Latest signups */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Latest signups</h2>
                <a
                  href={statsUrl}
                  className="text-sm text-neutral-400 underline hover:text-neutral-200"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open raw stats JSON
                </a>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-neutral-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950">
                    <tr className="text-neutral-300">
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-neutral-800">
                    {(data?.latest ?? []).length === 0 ? (
                      <tr className="hover:bg-neutral-950/60">
                        <td className="px-4 py-4 text-neutral-400" colSpan={2}>
                          {loading ? "Loading…" : "No signups yet."}
                        </td>
                      </tr>
                    ) : (
                      (data?.latest ?? []).map((row, idx) => (
                        <tr
                          key={`${row.phone}-${row.created_at}-${idx}`}
                          className="hover:bg-neutral-950/60"
                        >
                          <td className="px-4 py-3 font-mono text-neutral-200">
                            {maskPhone(row.phone)}
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-400">
                            {formatShortNY(row.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Offer preview */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Offer & welcome text</h2>
                <button
                  onClick={loadSettings}
                  className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                >
                  Refresh offer
                </button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                    Offer customers see
                  </div>

                  <div className="mt-3 text-sm text-neutral-300">
                    <div className="text-neutral-400">Shop</div>
                    {paid ? (
                      <input
                        value={shopNameDraft}
                        onChange={(e) => setShopNameDraft(e.target.value)}
                        placeholder={shopSlug}
                        className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                      />
                    ) : (
                      <div className="mt-1 text-lg font-semibold text-neutral-100">
                        {settingsLoading ? "Loading…" : settings?.shop_name || shopSlug}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-sm text-neutral-300">
                    <div className="text-neutral-400">Reward title</div>
                    {paid ? (
                      <input
                        value={dealTitleDraft}
                        onChange={(e) => setDealTitleDraft(e.target.value)}
                        placeholder="e.g., 10% off your next visit"
                        className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                      />
                    ) : (
                      <div className="mt-1 font-medium text-neutral-100">
                        {settingsLoading ? "Loading…" : settings?.deal_title || "—"}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-sm text-neutral-300">
                    <div className="text-neutral-400">Reward details</div>
                    {paid ? (
                      <textarea
                        value={dealDetailsDraft}
                        onChange={(e) => setDealDetailsDraft(e.target.value)}
                        placeholder="e.g., Show this message at checkout within 7 days."
                        rows={3}
                        className="mt-2 w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600"
                      />
                    ) : (
                      <div className="mt-1 whitespace-pre-wrap text-neutral-200">
                        {settingsLoading ? "Loading…" : settings?.deal_details || "—"}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 text-sm text-neutral-300">
                    <div className="text-neutral-400">Visits required to earn reward</div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        value={rewardGoalDraft}
                        onChange={(e) => setRewardGoalDraft(Number(e.target.value))}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 2).map((n) => (
                          <option key={n} value={n}>
                            {n} visits
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={saveShopSettings}
                        disabled={savingSettings || !paid}
                        className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-60"
                      >
                        {savingSettings ? "Saving…" : "Save"}
                      </button>

                      {saveSettingsMsg ? (
                        <span className="text-xs text-neutral-400">{saveSettingsMsg}</span>
                      ) : null}

                      {!paid ? (
                        <span className="text-xs text-neutral-500">
                          (Activate subscription to edit)
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 text-xs text-neutral-500">
                      Suggestion: many coffee shops choose 5–10 visits; salons often choose 2–5.
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <div className="text-[11px] uppercase tracking-widest text-neutral-500">Welcome text</div>

                  {paid ? (
                    <textarea
                      value={welcomeSmsDraft}
                      onChange={(e) => setWelcomeSmsDraft(e.target.value)}
                      placeholder="Welcome to {{shop_name}} Rewards 🎉 Reply STOP to opt out. Your deal: {{deal_title}}"
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-neutral-800 bg-black px-3 py-2 font-mono text-xs text-neutral-200 placeholder:text-neutral-600"
                    />
                  ) : null}

                  <div className="mt-3 whitespace-pre-wrap rounded-xl border border-neutral-800 bg-black p-4 font-mono text-xs text-neutral-200">
                    {settingsLoading
                      ? "Loading…"
                      : safeTemplatePreview(
                          paid ? welcomeSmsDraft : (settings?.welcome_sms_template ?? ""),
                          (paid ? shopNameDraft : (settings?.shop_name || shopSlug)) || shopSlug,
                          paid ? dealTitleDraft : (settings?.deal_title || "")
                        ) || "—"}
                  </div>

                  <div className="mt-3 text-[11px] uppercase tracking-widest text-neutral-500">Reward earned text</div>

                  {paid ? (
                    <textarea
                      value={rewardSmsDraft}
                      onChange={(e) => setRewardSmsDraft(e.target.value)}
                      placeholder="You earned your reward at {{shop_name}} 🎉 Show this text to redeem: {{deal_title}}"
                      rows={4}
                      className="mt-3 w-full resize-none rounded-xl border border-neutral-800 bg-black px-3 py-2 font-mono text-xs text-neutral-200 placeholder:text-neutral-600"
                    />
                  ) : null}

                  <div className="mt-3 whitespace-pre-wrap rounded-xl border border-neutral-800 bg-black p-4 font-mono text-xs text-neutral-200">
                    {settingsLoading
                      ? "Loading…"
                      : safeTemplatePreview(
                          paid ? rewardSmsDraft : String((settings as any)?.reward_sms_template ?? ""),
                          (paid ? shopNameDraft : (settings?.shop_name || shopSlug)) || shopSlug,
                          paid ? dealTitleDraft : (settings?.deal_title || "")
                        ) || "—"}
                  </div>

                  <div className="mt-3 text-xs text-neutral-500">
                    Use <span className="font-mono">{"{{shop_name}}"}</span> and{" "}
                    <span className="font-mono">{"{{deal_title}}"}</span>. Keep messages short.
                  </div>
                </div>
              </div>
            </section>

            {/* Quick start */}
            <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-neutral-700">
              <div className="text-sm text-neutral-400">Quick start</div>
              <div className="mt-2 text-sm text-neutral-200">
                Your customer join page:
              </div>
              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                  Customer join link
                </div>
                <div className="mt-2 break-all font-mono text-sm text-neutral-200">
                  {paid ? joinUrl : "(locked — activate to reveal your join link)"}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {paid ? (
                    <>
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                      >
                        Open join page
                      </a>
                      <button
                        onClick={copyJoinLink}
                        className="rounded-xl border border-neutral-800 px-3 py-2 text-sm hover:bg-neutral-900"
                      >
                        Copy link
                      </button>
                    </>
                  ) : (
                    <a
                      href={`/merchant/subscribe?shop=${encodeURIComponent(shopSlug)}`}
                      className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
                    >
                      Activate now
                    </a>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Print styling: only show the QR panel when printing */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          main {
            background: white !important;
          }
          main * {
            visibility: hidden;
          }
          main .print-area,
          main .print-area * {
            visibility: visible;
          }
          main .print-area {
            position: absolute;
            left: 24px;
            top: 24px;
            width: calc(100% - 48px);
            border: 1px solid #e5e5e5 !important;
            background: white !important;
            color: black !important;
          }
          main .print-area .bg-white {
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}