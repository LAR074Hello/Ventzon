"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  LogOut, User, ChevronRight, Trophy, Share2, Bell,
  Trash2, Pencil, Check, X, Camera, Mail, HelpCircle, FileText,
  Shield, Star, MessageSquare, Info, ChevronDown,
} from "lucide-react";

type Membership = {
  shop_slug: string;
  shop_name: string;
  deal_title: string | null;
  reward_goal: number;
  visits: number;
  logo_url: string | null;
};

const APP_VERSION = "1.0.0";
const APP_STORE_URL = "https://apps.apple.com/app/id6763768638";

function SectionLabel({ title }: { title: string }) {
  return (
    <p className="mb-2 px-5 text-[11px] font-medium tracking-[0.12em] text-[#555]">
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
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors active:bg-[#0d0d0d] disabled:cursor-default"
    >
      {Icon && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${destructive ? "bg-red-950/30" : "bg-[#1a1a1a]"}`}>
          <Icon className={`h-4 w-4 ${destructive ? "text-red-500/70" : "text-[#888]"}`} strokeWidth={1.5} />
        </div>
      )}
      <span className={`flex-1 text-[14px] font-normal ${destructive ? "text-red-500/80" : "text-[#d0d0d0]"}`}>
        {label}
      </span>
      {rightNode}
      {value && !rightNode && <span className="shrink-0 max-w-[140px] truncate text-[13px] font-light text-[#555]">{value}</span>}
      {chevron && onClick && !rightNode && (
        <ChevronRight className="h-4 w-4 shrink-0 text-[#333]" />
      )}
    </button>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${enabled ? "bg-[#ededed]" : "bg-[#2a2a2a]"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-black shadow transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
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
      }
      setLoading(false);
    }
    load();
  }, []);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1f1f1f] bg-[#0d0d0d]">
          <User className="h-7 w-7 text-[#444]" />
        </div>
        <p className="mt-5 text-[16px] font-semibold text-[#f5f5f5]">Not signed in</p>
        <button
          onClick={() => router.push("/customer/auth")}
          className="mt-8 rounded-2xl bg-[#ededed] px-8 py-4 text-[12px] font-medium tracking-[0.1em] text-black transition-all active:bg-[#d0d0d0]"
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
    <div className="flex min-h-full flex-col bg-black pb-10">

      {/* Header */}
      <div className="px-5 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 20px) + 16px)" }}>
        <h1 className="text-[22px] font-semibold text-[#f5f5f5]">Profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center py-8">
        <div className="relative">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-[#2a2a2a] transition-opacity active:opacity-70"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]">
                <span className="text-xl font-medium text-[#888]">{initials}</span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
              </div>
            )}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] transition-colors active:bg-[#222]"
          >
            <Camera className="h-3.5 w-3.5 text-[#aaa]" />
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
              className="rounded-xl border border-[#333] bg-[#0d0d0d] px-3 py-1.5 text-[16px] font-medium text-[#f5f5f5] outline-none focus:border-[#555] text-center"
              placeholder="Your name"
              maxLength={50}
            />
            <button onClick={saveName} disabled={savingName} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ededed] disabled:opacity-40">
              <Check className="h-3.5 w-3.5 text-black" />
            </button>
            <button onClick={() => setEditingName(false)} className="flex h-7 w-7 items-center justify-center rounded-full border border-[#333]">
              <X className="h-3.5 w-3.5 text-[#555]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNameInput(name === "Customer" ? "" : name); setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="mt-4 flex items-center gap-1.5 group"
          >
            <p className="text-[18px] font-semibold text-[#f5f5f5]">{name}</p>
            <Pencil className="h-3.5 w-3.5 text-[#444] group-active:text-[#666]" />
          </button>
        )}
        {!isPrivateRelay && (
          <p className="mt-1 text-[13px] font-light text-[#555]">{user.email}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mx-5 mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "STORES", value: memberships.length },
          { label: "STAMPS", value: totalVisits },
          { label: "READY", value: readyCards.length },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] py-4">
            <p className="text-[22px] font-semibold text-[#f5f5f5]">{value}</p>
            <p className="mt-1 text-[9px] font-medium tracking-[0.15em] text-[#555]">{label}</p>
          </div>
        ))}
      </div>

      {/* Rewards ready */}
      {readyCards.length > 0 && (
        <div className="mx-5 mb-6">
          <SectionLabel title="Rewards ready" />
          <div className="overflow-hidden rounded-2xl border border-[#1f1f1f]">
            {readyCards.map((m, i) => (
              <button
                key={m.shop_slug}
                onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                className={`flex w-full items-center gap-3 px-5 py-3.5 text-left active:bg-[#0d0d0d] ${i > 0 ? "border-t border-[#161616]" : ""}`}
              >
                <Trophy className="h-4 w-4 shrink-0 text-yellow-500" strokeWidth={1.5} />
                <p className="flex-1 text-[14px] font-normal text-[#d0d0d0]">{m.shop_name}</p>
                <ChevronRight className="h-4 w-4 text-[#333]" />
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
            <ChevronDown className={`h-4 w-4 text-[#444] mr-5 transition-transform duration-200 ${showCards ? "rotate-180" : ""}`} />
          </button>
          {showCards && (
            <div className="overflow-hidden rounded-2xl border border-[#1f1f1f]">
              {memberships.map((m, i) => {
                const isReady = m.visits >= m.reward_goal;
                return (
                  <button
                    key={m.shop_slug}
                    onClick={() => router.push(`/customer/shop/${m.shop_slug}`)}
                    className={`flex w-full items-center gap-4 px-4 py-3.5 text-left active:bg-[#0d0d0d] ${i > 0 ? "border-t border-[#161616]" : ""}`}
                  >
                    {m.logo_url ? (
                      <img src={m.logo_url} alt={m.shop_name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1f1f1f] bg-[#111]">
                        <span className="text-sm font-medium text-[#555]">{m.shop_name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#d0d0d0] truncate">{m.shop_name}</p>
                      <div className="mt-1.5 flex gap-1">
                        {Array.from({ length: Math.min(m.reward_goal, 10) }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full ${idx < m.visits ? isReady ? "bg-yellow-400" : "bg-[#ededed]" : "bg-[#1a1a1a]"}`}
                            style={{ width: `${Math.min(100 / Math.min(m.reward_goal, 10), 24)}px` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isReady && <span className="text-[10px] font-medium text-yellow-500">READY</span>}
                      <span className="text-[12px] font-light text-[#555]">{m.visits}/{m.reward_goal}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#333]" />
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
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] mx-5">
          <SettingsRow
            icon={User}
            label="Display name"
            value={name}
            onClick={() => { setNameInput(name === "Customer" ? "" : name); setEditingName(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
          <div className="border-t border-[#161616]" />
          <SettingsRow
            icon={Camera}
            label="Profile photo"
            onClick={() => fileRef.current?.click()}
          />
          {!isPrivateRelay && (
            <>
              <div className="border-t border-[#161616]" />
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

      {/* ── NOTIFICATIONS ── */}
      <div className="mb-6">
        <SectionLabel title="Notifications" />
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] mx-5">
          <SettingsRow
            icon={Bell}
            label="Push notifications"
            chevron={false}
            rightNode={<Toggle enabled={notifEnabled} onToggle={togglePushNotifications} />}
          />
          <div className="border-t border-[#161616]" />
          <SettingsRow
            icon={Mail}
            label="Email notifications"
            chevron={false}
            rightNode={<Toggle enabled={emailNotif} onToggle={toggleEmailNotif} />}
          />
        </div>
      </div>

      {/* ── SUPPORT ── */}
      <div className="mb-6">
        <SectionLabel title="Support" />
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] mx-5">
          <SettingsRow
            icon={HelpCircle}
            label="Help & FAQ"
            onClick={() => window.open("https://www.ventzon.com/help", "_blank")}
          />
          <div className="border-t border-[#161616]" />
          <SettingsRow
            icon={MessageSquare}
            label="Contact support"
            onClick={() => window.open("mailto:support@ventzon.com", "_self")}
          />
          <div className="border-t border-[#161616]" />
          <SettingsRow
            icon={Share2}
            label="Share Ventzon"
            onClick={shareApp}
          />
          <div className="border-t border-[#161616]" />
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
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] mx-5">
          <SettingsRow
            icon={FileText}
            label="Terms of Service"
            onClick={() => window.open("https://www.ventzon.com/terms", "_blank")}
          />
          <div className="border-t border-[#161616]" />
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
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] mx-5">
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
        <div className="overflow-hidden rounded-2xl border border-[#1f1f1f] mx-5">
          <SettingsRow
            icon={LogOut}
            label="Sign out"
            onClick={signOut}
          />
          <div className="border-t border-[#161616]" />
          <SettingsRow
            icon={Trash2}
            label={deletingAccount ? "Deleting account…" : "Delete account"}
            onClick={deleteAccount}
            destructive
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[11px] font-medium tracking-[0.2em] text-[#222]">VENTZON</p>
      </div>
    </div>
  );
}
