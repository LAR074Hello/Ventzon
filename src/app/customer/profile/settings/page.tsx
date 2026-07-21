"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  LogOut, User, ChevronRight, Trophy, Share2, Bell,
  Trash2, Pencil, Check, X, Camera, Mail, HelpCircle, FileText,
  Shield, Star, MessageSquare, Info, ChevronDown, Sparkles, Eye,
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

function SectionLabel({ title }: { title: string }) {
  return (
    <p className="mb-2 px-5 text-[11px] font-medium tracking-[0.12em] text-muted">
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
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl ${destructive ? "bg-danger/10" : "bg-surface"}`}>
          <Icon className={`h-4 w-4 ${destructive ? "text-danger" : "text-muted"}`} strokeWidth={1.5} />
        </div>
      )}
      <span className={`flex-1 text-[14px] font-normal ${destructive ? "text-danger" : "text-ink"}`}>
        {label}
      </span>
      {rightNode}
      {value && !rightNode && <span className="shrink-0 max-w-[140px] truncate text-[13px] font-light text-muted">{value}</span>}
      {chevron && onClick && !rightNode && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      )}
    </>
  );
  return (
    <Wrapper
      {...(onClick ? { onClick } : {})}
      className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors active:bg-surface"
    >
      {content}
    </Wrapper>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${enabled ? "bg-ink" : "bg-line"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
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
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [birthMonth, setBirthMonth] = useState<number | "">("");
  const [birthDay, setBirthDay] = useState<number | "">("");
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [birthdaySaved, setBirthdaySaved] = useState(false);
  const [theme, setThemeState] = useState<"system" | "light" | "dark">("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem("ventzon_theme");
      if (t === "light" || t === "dark") setThemeState(t);
    } catch {}
  }, []);

  function setTheme(t: "system" | "light" | "dark") {
    setThemeState(t);
    try {
      if (t === "system") localStorage.removeItem("ventzon_theme");
      else localStorage.setItem("ventzon_theme", t);
      const light = t === "light" || (t === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
      document.documentElement.classList.toggle("vz-light", light);
    } catch {}
  }

  const [notifPrefs, setNotifPrefs] = useState({
    notify_drops: true,
    notify_reward_expiry: true,
    notify_new_nearby: true,
    notify_new_follower: true,
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

  async function saveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } });
    if (!error) {
      setUser((u: any) => ({ ...u, user_metadata: { ...u.user_metadata, full_name: nameInput.trim() } }));
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
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      setUser((u: any) => ({ ...u, user_metadata: { ...u.user_metadata, avatar_url: avatarUrl } }));
    } catch (err: any) {
      alert(err?.message ?? "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently remove all your loyalty cards and rewards. This cannot be undone."
    );
    if (!confirmed) return;
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

  async function togglePushNotifications() {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      if (!notifEnabled) {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
        setNotifEnabled(true);
      } else {
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
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
          <User className="h-7 w-7 text-muted" />
        </div>
        <p className="mt-5 text-[16px] font-semibold text-ink">Not signed in</p>
        <button
          onClick={() => router.push("/customer/auth")}
          className="mt-8 rounded-card bg-ink px-8 py-4 text-[12px] font-medium tracking-[0.1em] text-black transition-all active:opacity-80"
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
    <div className="flex min-h-full flex-col bg-bg pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <button
          onClick={() => router.push("/customer/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-ink" />
        </button>
        <h1 className="font-display text-[22px] font-semibold text-ink">Settings</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-line transition-opacity active:opacity-70"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface">
                <span className="text-xl font-medium text-muted">{initials}</span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink" />
              </div>
            )}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface transition-colors active:bg-line"
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
              className="rounded-ctl border border-line bg-surface px-3 py-1.5 text-[16px] font-medium text-ink outline-none focus:border-muted text-center"
              placeholder="Your name"
              maxLength={50}
            />
            <button onClick={saveName} disabled={savingName} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink disabled:opacity-40">
              <Check className="h-3.5 w-3.5 text-black" />
            </button>
            <button onClick={() => setEditingName(false)} className="flex h-7 w-7 items-center justify-center rounded-full border border-line">
              <X className="h-3.5 w-3.5 text-muted" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(name === "Customer" ? "" : name); setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="mt-4 flex items-center gap-1.5 group"
          >
            <p className="text-[18px] font-semibold text-ink">{name}</p>
            <Pencil className="h-3.5 w-3.5 text-muted group-active:text-muted" />
          </button>
        )}
        {!isPrivateRelay && (
          <p className="mt-1 text-[13px] font-light text-muted">{user.email}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mx-5 mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "STORES", value: memberships.length },
          { label: "STAMPS", value: totalVisits },
          { label: "READY", value: readyCards.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-card border border-line bg-surface py-4">
            <p className="text-[22px] font-semibold text-ink">{value}</p>
            <p className="mt-1 text-[9px] font-medium tracking-[0.15em] text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Birthday */}
      <div className="mx-5 mb-8">
        <SectionLabel title="Birthday" />
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-[12px] font-light leading-relaxed text-muted">
            Add your birthday to get a treat from the shops you visit. Month and day only — no year.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value === "" ? "" : Number(e.target.value))}
              className="flex-1 rounded-ctl border border-line bg-surface px-4 py-3 text-[14px] font-light text-ink outline-none focus:border-line"
            >
              <option value="">Month</option>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-24 rounded-ctl border border-line bg-surface px-4 py-3 text-[14px] font-light text-ink outline-none focus:border-line"
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
            className="mt-4 w-full rounded-ctl border border-line py-3 text-[13px] font-medium text-ink transition-colors active:bg-black/20 disabled:opacity-40"
          >
            {savingBirthday ? "Saving…" : birthdaySaved ? "Saved ✓" : "Save birthday"}
          </button>
        </div>
      </div>

      {/* Rewards ready */}
      {readyCards.length > 0 && (
        <div className="mx-5 mb-6">
          <SectionLabel title="Rewards ready" />
          <div className="overflow-hidden rounded-card border border-line">
            {readyCards.map((m, i) => (
              <button
                key={m.shop_slug}
                onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                className={`flex w-full items-center gap-3 px-5 py-3.5 text-left active:bg-surface ${i > 0 ? "border-t border-line/60" : ""}`}
              >
                <Trophy className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
                <p className="flex-1 text-[14px] font-normal text-ink">{m.shop_name}</p>
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
            <div className="overflow-hidden rounded-card border border-line">
              {memberships.map((m, i) => {
                const isReady = m.visits >= m.reward_goal;
                const isPoints = m.reward_mode === "points";
                const pct = m.reward_goal > 0 ? Math.min((m.visits / m.reward_goal) * 100, 100) : 0;
                return (
                  <button
                    key={m.shop_slug}
                    onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                    className={`flex w-full items-center gap-4 px-4 py-3.5 text-left active:bg-surface ${i > 0 ? "border-t border-line/60" : ""}`}
                  >
                    {m.logo_url ? (
                      <img src={m.logo_url} alt={m.shop_name} className="h-10 w-10 shrink-0 rounded-ctl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl border border-line bg-surface">
                        <span className="text-sm font-medium text-muted">{m.shop_name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-ink truncate">{m.shop_name}</p>
                      {isPoints ? (
                        <div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-surface">
                          <div
                            className={`h-full rounded-full ${isReady ? "bg-accent" : "bg-ink"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      ) : (
                        <div className="mt-1.5 flex gap-1">
                          {Array.from({ length: Math.min(m.reward_goal, 10) }).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 rounded-full ${idx < m.visits ? isReady ? "bg-accent" : "bg-ink" : "bg-surface"}`}
                              style={{ width: `${Math.min(100 / Math.min(m.reward_goal, 10), 24)}px` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isReady && <span className="text-[10px] font-medium text-accent">READY</span>}
                      <span className="text-[12px] font-light text-muted">
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
        <div className="overflow-hidden rounded-card border border-line mx-5">
          <SettingsRow
            icon={User}
            label="Display name"
            value={name}
            onClick={() => { setNameInput(name === "Customer" ? "" : name); setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Camera}
            label="Profile photo"
            onClick={() => fileRef.current?.click()}
          />
          {!isPrivateRelay && (
            <>
              <div className="border-t border-line/60" />
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
        <div className="mx-5 flex rounded-card border border-line bg-surface p-1">
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 rounded-ctl py-2.5 text-[11px] font-medium tracking-[0.08em] transition-all ${
                theme === t ? "bg-ink text-bg" : "text-muted"
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
        <div className="overflow-hidden rounded-card border border-line mx-5">
          <SettingsRow
            icon={Bell}
            label="Push notifications"
            chevron={false}
            rightNode={<Toggle enabled={notifEnabled} onToggle={togglePushNotifications} />}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Mail}
            label="Email notifications"
            chevron={false}
            rightNode={<Toggle enabled={emailNotif} onToggle={toggleEmailNotif} />}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Bell}
            label="Drops from followed stores"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_drops} onToggle={() => toggleNotifPref("notify_drops")} />}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Trophy}
            label="Reward expiry reminders"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_reward_expiry} onToggle={() => toggleNotifPref("notify_reward_expiry")} />}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Info}
            label="New places nearby"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_new_nearby} onToggle={() => toggleNotifPref("notify_new_nearby")} />}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={User}
            label="New followers"
            chevron={false}
            rightNode={<Toggle enabled={notifPrefs.notify_new_follower} onToggle={() => toggleNotifPref("notify_new_follower")} />}
          />
        </div>
      </div>

      {/* ── CREATOR ── */}
      <div className="mb-6">
        <SectionLabel title="Creator" />
        <div className="overflow-hidden rounded-card border border-line mx-5">
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
              <div className="border-t border-line/60" />
              <SettingsRow
                icon={User}
                label="View public profile"
                onClick={() => router.push(`/customer/creator/${creatorProfile.id}`)}
              />
              <div className="border-t border-line/60" />
              <SettingsRow
                icon={Pencil}
                label="Bio"
                value={creatorProfile.bio ? creatorProfile.bio.slice(0, 24) + (creatorProfile.bio.length > 24 ? "…" : "") : "Add a bio"}
                onClick={() => { setBioInput(creatorProfile.bio ?? ""); setEditingBio(true); }}
              />
              {editingBio && (
                <div className="border-t border-line/60 px-5 py-4">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Tell people what you love about your local spots…"
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-ctl border border-line bg-surface px-3 py-2.5 text-[13px] font-normal text-ink outline-none placeholder:text-muted"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingBio(false)}
                      className="rounded-full border border-line px-4 py-2 text-[11px] font-medium tracking-[0.1em] text-muted"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="rounded-full bg-ink px-4 py-2 text-[11px] font-medium tracking-[0.1em] text-black disabled:opacity-40"
                    >
                      {savingBio ? "SAVING…" : "SAVE"}
                    </button>
                  </div>
                </div>
              )}
              <div className="border-t border-line/60" />
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
        <SectionLabel title="Support" />
        <div className="overflow-hidden rounded-card border border-line mx-5">
          <SettingsRow
            icon={HelpCircle}
            label="Help & FAQ"
            onClick={() => window.open("https://www.ventzon.com/help", "_blank")}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={MessageSquare}
            label="Contact support"
            onClick={() => window.open("mailto:support@ventzon.com", "_self")}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Share2}
            label="Share Ventzon"
            onClick={shareApp}
          />
          <div className="border-t border-line/60" />
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
        <div className="overflow-hidden rounded-card border border-line mx-5">
          <SettingsRow
            icon={FileText}
            label="Terms of Service"
            onClick={() => window.open("https://www.ventzon.com/terms", "_blank")}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Shield}
            label="Privacy Policy"
            onClick={() => window.open("https://www.ventzon.com/privacy", "_blank")}
          />
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div className="mb-6">
        <SectionLabel title="About" />
        <div className="overflow-hidden rounded-card border border-line mx-5">
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
        <div className="overflow-hidden rounded-card border border-line mx-5">
          <SettingsRow
            icon={LogOut}
            label="Sign out"
            onClick={signOut}
          />
          <div className="border-t border-line/60" />
          <SettingsRow
            icon={Trash2}
            label={deletingAccount ? "Deleting account…" : "Delete account"}
            onClick={deleteAccount}
            destructive
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[11px] font-medium tracking-[0.2em] text-line">VENTZON</p>
      </div>
    </div>
  );
}
