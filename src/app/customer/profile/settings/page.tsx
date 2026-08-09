"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { checkPushPermission, requestPushPermission } from "@/lib/push-client";
import { stripImageMetadata } from "@/lib/strip-exif";
import {
  LogOut, User, ChevronRight, Trophy, Share2, Bell,
  Trash2, Pencil, Check, X, Camera, Mail, HelpCircle, FileText,
  Shield, Star, MessageSquare, Info, ChevronDown, Sparkles, Eye, Ban, Map,
} from "lucide-react";

type Membership = {
  shop_slug: string;
  shop_name: string;
  deal_title: string | null;
  reward_goal: number;
  reward_mode?: "stamps" | "points";
  visits: number;
  logo_url: string | null;
};

const APP_VERSION = "1.0.0";
const APP_STORE_URL = "https://apps.apple.com/app/id6763768638";

/* ── Theme preference, as an external store ──────────────────────────
   localStorage is external state. Reading it with useState + useEffect
   triggers a second render on every mount; useSyncExternalStore reads it
   during render with an SSR-safe server snapshot. `storage` covers other
   tabs; the local Set covers this one, which `storage` does not fire for. */
type ThemePreference = "system" | "light" | "dark";
const THEME_KEY = "ventzon_theme";
const themeListeners = new Set<() => void>();

function subscribeTheme(onChange: () => void) {
  themeListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    themeListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getStoredTheme(): ThemePreference {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "system" ? t : "light";
  } catch {
    return "light";
  }
}

function emitThemeChange() {
  themeListeners.forEach((fn) => fn());
}

function SectionLabel({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-caps text-muted mb-2 px-5">
      {title.toUpperCase()}
    </p>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  onClick,
  destructive,
  chevron = true,
  rightNode,
}: {
  icon?: any;
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  rightNode?: React.ReactNode;
}) {
  // Rows without their own onClick (e.g. toggle rows) render as a div —
  // a Toggle is itself a <button>, and buttons can't nest inside buttons.
  const Wrapper: any = onClick ? "button" : "div";
  const content = (
    <>
      {Icon && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl ${destructive ? "bg-danger/10" : "bg-surface-raised"}`}>
          <Icon className={`h-4 w-4 ${destructive ? "text-danger" : "text-muted"}`} strokeWidth={1.5} />
        </div>
      )}
      <span className={`flex-1 text-base ${destructive ? "text-danger" : "text-primary"}`}>
        {label}
      </span>
      {rightNode}
      {value && !rightNode && <span className="text-sm text-secondary shrink-0 max-w-[140px] truncate">{value}</span>}
      {chevron && onClick && !rightNode && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      )}
    </>
  );
  return (
    <Wrapper
      {...(onClick ? { onClick } : {})}
      className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors active:bg-surface-raised"
    >
      {content}
    </Wrapper>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${enabled ? "bg-primary" : "bg-subtle"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [birthMonth, setBirthMonth] = useState<number | "">("");
  const [birthDay, setBirthDay] = useState<number | "">("");
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [birthdaySaved, setBirthdaySaved] = useState(false);
  const [blocked, setBlocked] = useState<
    { profile_id: string | null; display_name: string; avatar_url: string | null }[]
  >([]);
  const [showBlocked, setShowBlocked] = useState(false);

  async function loadBlocked() {
    try {
      const res = await fetch("/api/customer/blocks");
      if (res.ok) {
        const d = await res.json();
        setBlocked(d.blocks ?? []);
      }
    } catch {}
  }

  useEffect(() => { loadBlocked(); }, []);

  async function unblock(profileId: string) {
    setBlocked((b) => b.filter((x) => x.profile_id !== profileId));
    try {
      await fetch("/api/customer/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, block: false }),
      });
    } catch {
      loadBlocked();
    }
  }

  // ventzon_theme stores the PREFERENCE; <html data-theme> holds the
  // RESOLVED value. Dark is the default, so an absent key means dark —
  // "system" is stored explicitly when chosen.
  // Kept in sync with the pre-paint script in src/app/layout.tsx.
  //
  // Read through useSyncExternalStore rather than useState + useEffect:
  // localStorage is external state, and syncing it in via setState on mount
  // is exactly the cascading-render pattern react-hooks warns about. This
  // also keeps the control honest if the value changes in another tab.
  const theme = useSyncExternalStore(
    subscribeTheme,
    getStoredTheme,
    () => "light" as ThemePreference
  );

  function setTheme(t: ThemePreference) {
    try {
      localStorage.setItem(THEME_KEY, t);
      const resolved =
        t === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : t;
      document.documentElement.setAttribute("data-theme", resolved);
    } catch {}
    emitThemeChange();
  }

  const [notifPrefs, setNotifPrefs] = useState({
    notify_drops: true,
    notify_reward_expiry: true,
    notify_new_nearby: true,
    notify_new_follower: true,
    notify_post_engagement: true,
  });
  const [creatorProfile, setCreatorProfile] = useState<{
    id: string;
    is_creator: boolean;
    bio: string | null;
    show_on_leaderboard: boolean;
  } | null>(null);
  const [bioInput, setBioInput] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUser(session.user);
      setEmailNotif(session.user.user_metadata?.email_notif !== false);
      const res = await fetch("/api/customer/memberships");
      if (res.ok) {
        const data = await res.json();
        setMemberships(data.memberships ?? []);
        if (data.birthday) {
          setBirthMonth(data.birthday.birth_month ?? "");
          setBirthDay(data.birthday.birth_day ?? "");
        }
      }
      try {
        const prefsRes = await fetch("/api/customer/notification-prefs");
        if (prefsRes.ok) {
          const prefsData = await prefsRes.json();
          if (prefsData.prefs) setNotifPrefs(prefsData.prefs);
        }
      } catch {}
      try {
        const creatorRes = await fetch("/api/customer/creator-profile");
        if (creatorRes.ok) {
          const creatorData = await creatorRes.json();
          if (creatorData.profile) {
            setCreatorProfile({
              id: creatorData.profile.id,
              is_creator: creatorData.profile.is_creator,
              bio: creatorData.profile.bio,
              show_on_leaderboard: creatorData.profile.show_on_leaderboard,
            });
            setBioInput(creatorData.profile.bio ?? "");
          }
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function saveBirthday() {
    if (birthMonth === "" || birthDay === "") return;
    setSavingBirthday(true);
    setBirthdaySaved(false);
    try {
      const res = await fetch("/api/customer/birthday", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth_month: birthMonth, birth_day: birthDay }),
      });
      if (res.ok) {
        setBirthdaySaved(true);
        setTimeout(() => setBirthdaySaved(false), 2000);
      }
    } finally {
      setSavingBirthday(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/customer/auth");
  }

  /**
   * ONE write path for a display name, shared with the composer's first-post
   * prompt.
   *
   * This used to update auth metadata ONLY, while every surface that shows you
   * to other people renders `customer_profiles.display_name`. Renaming yourself
   * here therefore changed nothing anyone else could see — and the profile
   * backfill does not rescue it, because backfill only fills a field that is
   * still empty. A rename is not a fill.
   */
  async function saveName() {
    const chosen = nameInput.trim();
    if (!chosen) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: chosen } });
    if (!error) {
      await fetch("/api/customer/creator-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: chosen }),
      });
      setUser((u: { user_metadata?: Record<string, unknown> } | null) => ({
        ...(u ?? {}),
        user_metadata: { ...(u?.user_metadata ?? {}), full_name: chosen },
      }));
      setEditingName(false);
    }
    setSavingName(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5 MB."); return; }
    setUploadingAvatar(true);
    try {
      // Strip EXIF/GPS before the photo leaves the device.
      const clean = await stripImageMetadata(file);
      const ext = clean.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, clean, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      // Same reasoning as saveName: the profile row is what other people see.
      await fetch("/api/customer/creator-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });
      setUser((u: any) => ({ ...u, user_metadata: { ...u.user_metadata, avatar_url: avatarUrl } }));
    } catch (err: any) {
      alert(err?.message ?? "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // Called from the confirmation sheet — window.confirm is unreliable in the
  // Capacitor WKWebView, so the two-tap gate lives in the sheet instead.
  async function deleteAccount() {
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

  useEffect(() => {
    // The toggle reflects the real OS permission state, not an assumption.
    checkPushPermission().then((p) => setNotifEnabled(p === "granted"));
  }, []);

  async function togglePushNotifications() {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (!notifEnabled) {
        // Explicit opt-in: request permission, register only on grant. A
        // prior denial cannot be re-prompted by iOS, so the toggle stays off.
        const ok = await requestPushPermission();
        setNotifEnabled(ok);
      } else {
        // iOS has no programmatic revoke; the toggle reflects the OS state,
        // which the user changes in Settings.
        setNotifEnabled(false);
      }
    } catch {}
  }

  async function toggleEmailNotif() {
    const next = !emailNotif;
    setEmailNotif(next);
    await supabase.auth.updateUser({ data: { email_notif: next } });
  }

  async function updateCreatorProfile(updates: Record<string, unknown>) {
    if (!creatorProfile) return;
    const prev = creatorProfile;
    setCreatorProfile({ ...creatorProfile, ...updates } as typeof creatorProfile);
    try {
      const res = await fetch("/api/customer/creator-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) setCreatorProfile(prev);
    } catch {
      setCreatorProfile(prev);
    }
  }

  async function saveBio() {
    setSavingBio(true);
    await updateCreatorProfile({ bio: bioInput.trim() });
    setSavingBio(false);
    setEditingBio(false);
  }

  async function toggleNotifPref(key: keyof typeof notifPrefs) {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next); // optimistic
    try {
      const res = await fetch("/api/customer/notification-prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!res.ok) setNotifPrefs(notifPrefs);
    } catch {
      setNotifPrefs(notifPrefs);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-subtle border-t-ink" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-subtle bg-surface-raised">
          <User className="h-7 w-7 text-muted" />
        </div>
        <p className="font-display text-lg font-semibold tracking-tight text-primary mt-5">Not signed in</p>
        <button
          onClick={() => router.push("/customer/auth")}
          className="text-sm font-medium text-inverse mt-8 rounded-card bg-primary px-8 py-4 transition-all active:opacity-80"
        >
          SIGN IN
        </button>
      </div>
    );
  }

  const isPrivateRelay = user.email?.endsWith("@privaterelay.appleid.com") ?? false;
  const name = user.user_metadata?.full_name ?? (isPrivateRelay ? "Customer" : (user.email?.split("@")[0] ?? "Customer"));
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const readyCards = memberships.filter(m => m.visits >= m.reward_goal);
  const totalVisits = memberships.reduce((s, m) => s + m.visits, 0);
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="flex min-h-full flex-col bg-surface pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <button
          onClick={() => router.push("/customer/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-subtle bg-surface-raised"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-primary" />
        </button>
        <h1 className="font-display text-xl font-semibold tracking-tight text-primary">Settings</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-subtle transition-opacity active:opacity-70"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-raised">
                <span className="text-xl font-medium text-muted">{initials}</span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-subtle border-t-ink" />
              </div>
            )}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-subtle bg-surface-raised transition-colors active:bg-subtle"
          >
            <Camera className="h-3.5 w-3.5 text-muted" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {editingName ? (
          <div className="mt-4 flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
              className="font-display text-lg font-semibold tracking-tight text-primary rounded-ctl border border-subtle bg-surface-raised px-3 py-1.5 outline-none focus:border-muted text-center"
              placeholder="Your name"
              maxLength={50}
            />
            <button onClick={saveName} disabled={savingName} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary disabled:opacity-40">
              <Check className="h-3.5 w-3.5 text-black" />
            </button>
            <button onClick={() => setEditingName(false)} className="flex h-7 w-7 items-center justify-center rounded-full border border-subtle">
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(name === "Customer" ? "" : name); setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="mt-4 flex items-center gap-1.5 group"
          >
            <p className="font-display text-lg font-semibold tracking-tight text-primary">{name}</p>
            <Pencil className="h-3.5 w-3.5 text-muted group-active:text-muted" />
          </button>
        )}
        {!isPrivateRelay && (
          <p className="text-sm text-secondary mt-1">{user.email}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mx-5 mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "STORES", value: memberships.length },
          { label: "STAMPS", value: totalVisits },
          { label: "READY", value: readyCards.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-card border border-subtle bg-surface-raised py-4">
            <p className="font-display text-xl font-semibold tracking-tight text-primary">{value}</p>
            <p className="text-2xs font-semibold uppercase tracking-caps text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Birthday */}
      <div className="mx-5 mb-8">
        <SectionLabel title="Birthday" />
        <div className="rounded-card border border-subtle bg-surface-raised p-5">
          <p className="text-xs text-muted leading-relaxed">
            Add your birthday to get a treat from the shops you visit. Month and day only — no year.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value === "" ? "" : Number(e.target.value))}
              className="text-base text-primary flex-1 rounded-ctl border border-subtle bg-surface-raised px-4 py-3 outline-none focus:border-subtle"
            >
              <option value="">Month</option>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value === "" ? "" : Number(e.target.value))}
              className="text-base text-primary w-24 rounded-ctl border border-subtle bg-surface-raised px-4 py-3 outline-none focus:border-subtle"
            >
              <option value="">Day</option>
              {Array.from({ length: birthMonth === "" ? 31 : [31,29,31,30,31,30,31,31,30,31,30,31][(birthMonth as number) - 1] }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <button
            onClick={saveBirthday}
            disabled={savingBirthday || birthMonth === "" || birthDay === ""}
            className="text-base text-primary mt-4 w-full rounded-ctl border border-subtle py-3 font-medium transition-colors active:bg-black/20 disabled:opacity-40"
          >
            {savingBirthday ? "Saving…" : birthdaySaved ? "Saved" : "Save birthday"}
          </button>
        </div>
      </div>

      {/* Rewards ready */}
      {readyCards.length > 0 && (
        <div className="mx-5 mb-6">
          <SectionLabel title="Rewards ready" />
          <div className="overflow-hidden rounded-card border border-subtle">
            {readyCards.map((m, i) => (
              <button
                key={m.shop_slug}
                onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                className={`flex w-full items-center gap-3 px-5 py-3.5 text-left active:bg-surface-raised ${i > 0 ? "border-t border-subtle/60" : ""}`}
              >
                <Trophy className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                <p className="text-base text-primary flex-1 font-normal">{m.shop_name}</p>
                <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* My loyalty cards (collapsible) */}
      {memberships.length > 0 && (
        <div className="mx-5 mb-8">
          <button
            onClick={() => setShowCards(v => !v)}
            className="flex w-full items-center justify-between mb-2"
          >
            <SectionLabel title={`My cards (${memberships.length})`} />
            <ChevronDown className={`h-4 w-4 text-muted mr-5 transition-transform duration-200 ${showCards ? "rotate-180" : ""}`} />
          </button>
          {showCards && (
            <div className="overflow-hidden rounded-card border border-subtle">
              {memberships.map((m, i) => {
                const isReady = m.visits >= m.reward_goal;
                const isPoints = m.reward_mode === "points";
                const pct = m.reward_goal > 0 ? Math.min((m.visits / m.reward_goal) * 100, 100) : 0;
                return (
                  <button
                    key={m.shop_slug}
                    onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                    className={`flex w-full items-center gap-4 px-4 py-3.5 text-left active:bg-surface-raised ${i > 0 ? "border-t border-subtle/60" : ""}`}
                  >
                    {m.logo_url ? (
                      <img src={m.logo_url} alt={m.shop_name} className="h-10 w-10 shrink-0 rounded-ctl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl border border-subtle bg-surface-raised">
                        <span className="text-sm font-medium text-muted">{m.shop_name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-primary font-medium truncate">{m.shop_name}</p>
                      {isPoints ? (
                        <div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-surface-raised">
                          <div
                            className={`h-full rounded-full ${isReady ? "bg-primary" : "bg-subtle"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      ) : (
                        <div className="mt-1.5 flex gap-1">
                          {Array.from({ length: Math.min(m.reward_goal, 10) }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 rounded-full ${idx < m.visits ? "bg-primary" : "bg-subtle"}`}
                              style={{ width: `${Math.min(100 / Math.min(m.reward_goal, 10), 24)}px` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isReady && <span className="rounded-full bg-primary px-2 py-0.5 text-2xs font-semibold uppercase tracking-caps text-inverse">Ready</span>}
                      <span className="text-xs text-muted">
                        {m.visits}/{m.reward_goal}{isPoints ? " pts" : ""}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ACCOUNT ── */}
      <div className="mb-6">
        <SectionLabel title="Account" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={User}
            label="Display name"
            value={name}
            onClick={() => { setNameInput(name === "Customer" ? "" : name); setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Camera}
            label="Profile photo"
            onClick={() => fileRef.current?.click()}
          />
          {!isPrivateRelay && (
            <>
              <div className="border-t border-subtle/60" />
              <SettingsRow
                icon={Mail}
                label="Email"
                value={user.email}
                chevron={false}
              />
            </>
          )}
        </div>
      </div>

      {/* ── APPEARANCE ── */}
      <div className="mb-6">
        <SectionLabel title="Appearance" />
        <div className="mx-5 flex rounded-card border border-subtle bg-surface-raised p-1">
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 rounded-ctl py-3 text-sm font-medium transition-all ${
                theme === t ? "bg-primary text-inverse" : "text-muted"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      <div className="mb-6">
        <SectionLabel title="Notifications" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={Bell}
            label="Push notifications"
            chevron={false}
            rightNode={<Toggle enabled={notifEnabled} onToggle={togglePushNotifications} />}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Mail}
            label="Email notifications"
            chevron={false}
            rightNode={<Toggle enabled={emailNotif} onToggle={toggleEmailNotif} />}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Bell}
            label="Drops from followed stores"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_drops} onToggle={() => toggleNotifPref("notify_drops")} />}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Trophy}
            label="Reward expiry reminders"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_reward_expiry} onToggle={() => toggleNotifPref("notify_reward_expiry")} />}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Info}
            label="New places nearby"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_new_nearby} onToggle={() => toggleNotifPref("notify_new_nearby")} />}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={User}
            label="New followers"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_new_follower} onToggle={() => toggleNotifPref("notify_new_follower")} />}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={MessageSquare}
            label="Likes and comments"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_post_engagement} onToggle={() => toggleNotifPref("notify_post_engagement")} />}
          />
        </div>
      </div>

      {/* ── CREATOR ── */}
      <div className="mb-6">
        <SectionLabel title="Creator" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={Sparkles}
            label="Become a Creator"
            chevron={false}
            rightNode={
              <Toggle
                enabled={creatorProfile?.is_creator ?? false}
                onToggle={() => updateCreatorProfile({ is_creator: !(creatorProfile?.is_creator ?? false) })}
              />
            }
          />
          {creatorProfile?.is_creator && (
            <>
              <div className="border-t border-subtle/60" />
              <SettingsRow
                icon={User}
                label="View public profile"
                onClick={() => router.push(`/customer/creator/${creatorProfile.id}`)}
              />
              <div className="border-t border-subtle/60" />
              <SettingsRow
                icon={Pencil}
                label="Bio"
                value={creatorProfile.bio ? creatorProfile.bio.slice(0, 24) + (creatorProfile.bio.length > 24 ? "…" : "") : "Add a bio"}
                onClick={() => { setBioInput(creatorProfile.bio ?? ""); setEditingBio(true); }}
              />
              {editingBio && (
                <div className="border-t border-subtle/60 px-5 py-4">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell people what you love about your local spots…"
                    rows={3}
                    maxLength={500}
                    className="text-base text-primary w-full resize-none rounded-ctl border border-subtle bg-surface-raised px-3 py-2.5 font-normal outline-none placeholder:"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBio(false)}
                      className="text-xs font-semibold uppercase tracking-caps text-muted rounded-full border border-subtle px-4 py-2"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="text-sm font-medium text-inverse rounded-full bg-primary px-4 py-2 disabled:opacity-40"
                    >
                      {savingBio ? "SAVING…" : "SAVE"}
                    </button>
                  </div>
                </div>
              )}
              <div className="border-t border-subtle/60" />
              <SettingsRow
                icon={Eye}
                label="Show me on leaderboards"
                chevron={false}
                rightNode={
                  <Toggle
                    enabled={creatorProfile.show_on_leaderboard}
                    onToggle={() => updateCreatorProfile({ show_on_leaderboard: !creatorProfile.show_on_leaderboard })}
                  />
                }
              />
            </>
          )}
        </div>
      </div>

      {/* ── SUPPORT ── */}
      <div className="mb-6">
        <SectionLabel title="Safety" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={Ban}
            label="Blocked accounts"
            value={String(blocked.length)}
            onClick={() => setShowBlocked((v) => !v)}
          />
          {showBlocked && (
            <div className="border-t border-subtle/60 px-5 py-4">
              {blocked.length === 0 ? (
                <p className="text-sm text-secondary font-normal">
                  You haven&rsquo;t blocked anyone.
                </p>
              ) : (
                <div className="space-y-2">
                  {blocked.map((b) => (
                    <div key={b.profile_id ?? b.display_name} className="flex items-center gap-3">
                      {b.avatar_url ? (
                        <img src={b.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-subtle">
                          <span className="text-xs text-muted font-medium">
                            {b.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <p className="text-base text-primary flex-1 truncate font-normal">{b.display_name}</p>
                      {b.profile_id && (
                        <button
                          onClick={() => unblock(b.profile_id!)}
                          className="text-2xs font-semibold uppercase tracking-caps text-muted rounded-full border border-subtle px-3.5 py-1.5 active:"
                        >
                          UNBLOCK
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={FileText}
            label="Content policy"
            onClick={() => window.open("https://www.ventzon.com/content-policy", "_blank")}
          />
        </div>
      </div>

      {/* ── SUPPORT ── */}
      <div className="mb-6">
        <SectionLabel title="Support" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={HelpCircle}
            label="Help & FAQ"
            onClick={() => window.open("https://www.ventzon.com/help", "_blank")}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={MessageSquare}
            label="Contact support"
            onClick={() => window.open("mailto:support@ventzon.com", "_self")}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Share2}
            label="Share Ventzon"
            onClick={shareApp}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Star}
            label="Rate the app"
            onClick={() => window.open(APP_STORE_URL + "?action=write-review", "_blank")}
          />
        </div>
      </div>

      {/* ── LEGAL ── */}
      <div className="mb-6">
        <SectionLabel title="Legal" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={FileText}
            label="Terms of Service"
            onClick={() => window.open("https://www.ventzon.com/terms", "_blank")}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Shield}
            label="Privacy Policy"
            onClick={() => window.open("https://www.ventzon.com/privacy", "_blank")}
          />
          <div className="border-t border-subtle/60" />
          {/* ODbL requires OpenStreetMap to be credited wherever its data is
              shown. The map and place pages carry the credit inline; this is
              the page they lean on, and the only place the licence is named. */}
          <SettingsRow
            icon={Map}
            label="Data & licences"
            onClick={() => window.open("https://www.ventzon.com/data-attribution", "_blank")}
          />
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div className="mb-6">
        <SectionLabel title="About" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={Info}
            label="Version"
            value={APP_VERSION}
            chevron={false}
          />
        </div>
      </div>

      {/* ── SIGN OUT / DELETE ── */}
      <div className="mb-2">
        <SectionLabel title="Session" />
        <div className="overflow-hidden rounded-card border border-subtle mx-5">
          <SettingsRow
            icon={LogOut}
            label="Sign out"
            onClick={signOut}
          />
          <div className="border-t border-subtle/60" />
          <SettingsRow
            icon={Trash2}
            label={deletingAccount ? "Deleting account…" : "Delete account"}
            onClick={() => setConfirmingDelete(true)}
            destructive
          />
        </div>
      </div>

      {/* Delete-account confirmation — two-tap gate. window.confirm is
          unreliable in the native webview, so the sheet is the confirm. */}
      {confirmingDelete && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60"
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="elevation-2 w-full max-w-md rounded-t-sheet bg-surface px-5 pb-10 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-caps text-muted">
                Delete account
              </p>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="-mr-2.5 p-2.5 text-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="font-display text-lg font-semibold tracking-tight text-primary mt-4">
              This can&apos;t be undone.
            </p>
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              Deleting your account permanently removes your posts, comments,
              likes, saved places, followers, check-ins, and rewards. This
              cannot be undone.
            </p>

            <button
              onClick={deleteAccount}
              disabled={deletingAccount}
              className="mt-6 w-full rounded-ctl bg-danger py-3.5 text-sm font-medium text-on-danger disabled:opacity-40"
            >
              {deletingAccount ? "DELETING…" : "DELETE ACCOUNT"}
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              disabled={deletingAccount}
              className="text-xs font-semibold uppercase tracking-caps text-muted mt-3 w-full py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-caps text-subtle">VENTZON</p>
      </div>
    </div>
  );
}
