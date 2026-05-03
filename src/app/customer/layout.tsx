"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, CreditCard, User, ScanLine } from "lucide-react";
import Onboarding, { useOnboarding } from "./components/Onboarding";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const tabs = [
  { href: "/customer/explore", label: "Explore", icon: Compass },
  { href: "/customer/home", label: "My Cards", icon: CreditCard },
  { href: "/customer/profile", label: "Profile", icon: User },
];

async function registerPushNotifications(userId: string) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== "granted") return;
    await PushNotifications.register();
    PushNotifications.addListener("registration", async ({ value: token }) => {
      await fetch("/api/customer/device-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: "ios", user_id: userId }),
      });
    });
  } catch {}
}

const APP_STORE_URL = "https://apps.apple.com/app/id6763768638";

function AppStoreBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black ring-1 ring-[#2a2a2a]">
        <span className="text-[11px] font-light tracking-[0.15em] text-[#ededed]">V</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-light text-[#ededed]">Ventzon</p>
        <p className="text-[11px] font-light text-[#555]">Get the app for the best experience</p>
      </div>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full bg-[#ededed] px-4 py-1.5 text-[11px] font-light tracking-[0.1em] text-black transition-colors duration-200 hover:bg-white"
      >
        GET
      </a>
      <button
        onClick={onDismiss}
        className="shrink-0 text-[#444] transition-colors duration-200 hover:text-[#888]"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { show: showOnboarding, finish: finishOnboarding } = useOnboarding();
  const supabase = createSupabaseBrowserClient();
  const [readyCount, setReadyCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show app store banner only on non-native (web browser) sessions
    // and only if not already dismissed this session
    try {
      const { Capacitor } = require("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        const dismissed = sessionStorage.getItem("ventzon_banner_dismissed");
        if (!dismissed) setShowBanner(true);
      }
    } catch {
      const dismissed = sessionStorage.getItem("ventzon_banner_dismissed");
      if (!dismissed) setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        registerPushNotifications(data.session.user.id);
        // Load badge count
        fetch("/api/customer/memberships").then(r => r.json()).then(d => {
          const memberships = d.memberships ?? [];
          setReadyCount(memberships.filter((m: any) => m.visits >= m.reward_goal).length);
        }).catch(() => {});
      }
    });
  }, []);

  const isAuthPage = pathname === "/customer/auth";
  const isScanPage = pathname === "/customer/scan";
  const hideNav = isAuthPage || isScanPage;

  function dismissBanner() {
    sessionStorage.setItem("ventzon_banner_dismissed", "1");
    setShowBanner(false);
  }

  return (
    <div className="customer-app flex flex-col bg-black" style={{ minHeight: "100dvh" }}>
      {showBanner && <AppStoreBanner onDismiss={dismissBanner} />}
      {showOnboarding && <Onboarding onFinish={finishOnboarding} />}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: hideNav ? 0 : "80px" }}>
        {children}
      </div>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a1a1a] bg-black/90 backdrop-blur-md"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center px-2 py-2">
            {/* Left tabs */}
            {tabs.slice(0, 2).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              const showBadge = href === "/customer/home" && readyCount > 0;
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="flex flex-1 flex-col items-center gap-1 py-1"
                >
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${active ? "text-[#ededed]" : "text-[#444]"}`}
                      strokeWidth={active ? 1.5 : 1}
                    />
                    {showBadge && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500">
                        <span className="text-[9px] font-medium text-black">{readyCount}</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-light tracking-[0.15em] transition-colors duration-200 ${active ? "text-[#ededed]" : "text-[#444]"}`}>
                    {label.toUpperCase()}
                  </span>
                </button>
              );
            })}

            {/* Center scan button */}
            <button
              onClick={() => router.push("/customer/scan")}
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#111]">
                <ScanLine className="h-4 w-4 text-[#888]" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-light tracking-[0.15em] text-[#444]">SCAN</span>
            </button>

            {/* Right tabs */}
            {tabs.slice(2).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="flex flex-1 flex-col items-center gap-1 py-1"
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-200 ${active ? "text-[#ededed]" : "text-[#444]"}`}
                    strokeWidth={active ? 1.5 : 1}
                  />
                  <span className={`text-[10px] font-light tracking-[0.15em] transition-colors duration-200 ${active ? "text-[#ededed]" : "text-[#444]"}`}>
                    {label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
