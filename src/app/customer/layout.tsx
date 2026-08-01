"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Trophy, User, ScanLine, Map, Bell, Plus } from "lucide-react";
import Onboarding, { useOnboarding } from "./components/Onboarding";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// Home (Discover) · Map · [scan] · Rewards · Notifications · Profile
const tabs = [
  { href: "/customer/explore", label: "Home", icon: Home },
  { href: "/customer/map", label: "Map", icon: Map },
  { href: "/customer/home", label: "Rewards", icon: Trophy },
  { href: "/customer/notifications", label: "Alerts", icon: Bell },
  { href: "/customer/profile", label: "Profile", icon: User },
];

/**
 * Registers for push ONLY if permission has already been granted.
 *
 * The requestPermissions() call was removed deliberately. It fired on first
 * launch, which spent an OS-level permission prompt — the kind you only get to
 * ask once — before the user had done anything or had any reason to say yes.
 * The first sixty seconds already needs a location prompt to make posting work;
 * a notification prompt competing with it makes both more likely to be denied.
 *
 * checkPermissions() is non-interactive: it reads the current state without
 * prompting. So an existing grant still registers, and nothing is asked.
 *
 * POST-BETA: ask for notifications from a settings toggle, or after the user's
 * first post, where the reason to accept is obvious.
 */
/**
 * Sets the native status bar to dark text on our light surface.
 *
 * Capacitor's Style enum names the BACKGROUND, not the text:
 *   Style.Dark  = "Light text for dark backgrounds."
 *   Style.Light = "Dark text for light backgrounds."
 * capacitor.config.ts says 'Dark', which produced white glyphs on a
 * near-white bar — the clock and battery were barely legible on device.
 *
 * Set at RUNTIME rather than by fixing the config, because config values are
 * compiled into the binary and would need another archive, upload and review.
 * The app is a remote wrapper on production, so this ships the moment the web
 * deploy lands. Info.plist sets UIViewControllerBasedStatusBarAppearance=true,
 * which hands control to this plugin, so the runtime call is authoritative.
 * (The apple-mobile-web-app-status-bar-style meta tag governs Safari's
 * standalone PWA only and does not apply here.)
 *
 * PRE-LAUNCH: correct capacitor.config.ts to 'Light' too, so a fresh install
 * is right before this code runs. Until then this is the fix that ships.
 */
async function applyNativeStatusBarStyle() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // Plugin missing or web context — nothing to do.
  }
}

async function registerPushNotifications(userId: string) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive !== "granted") return;
    const platform = Capacitor.getPlatform(); // "ios" | "android"
    await PushNotifications.register();
    PushNotifications.addListener("registration", async ({ value: token }) => {
      await fetch("/api/customer/device-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform, user_id: userId }),
      });
    });
  } catch {}
}

const APP_STORE_URL = "https://apps.apple.com/app/id6763768638";

function AppStoreBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-subtle bg-surface-raised px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-surface ring-1 ring-line">
        <span className="text-xs font-semibold uppercase tracking-caps text-primary">V</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base text-primary font-medium">Ventzon</p>
        <p className="text-xs text-muted">Get the app for the best experience</p>
      </div>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-inverse shrink-0 rounded-full bg-primary px-4 py-1.5 transition-colors duration-200 hover:opacity-80"
      >
        GET
      </a>
      <button
        onClick={onDismiss}
        className="shrink-0 text-muted transition-colors duration-200 hover:text-primary"
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
  const [unreadAlerts, setUnreadAlerts] = useState(0);
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

  // Runs for signed-out users too — the status bar is wrong on every screen,
  // not just authenticated ones.
  useEffect(() => {
    applyNativeStatusBarStyle();
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
        fetch("/api/customer/notifications")
          .then(r => (r.ok ? r.json() : null))
          .then(d => setUnreadAlerts(d?.unread ?? 0))
          .catch(() => {});
      }
    });
  }, []);

  // The Alerts page fires this once it marks everything read.
  useEffect(() => {
    const clear = () => setUnreadAlerts(0);
    window.addEventListener("ventzon:alerts-read", clear);
    return () => window.removeEventListener("ventzon:alerts-read", clear);
  }, []);

  const isAuthPage = pathname === "/customer/auth";
  const isScanPage = pathname === "/customer/scan";
  const hideNav = isAuthPage || isScanPage;

  function dismissBanner() {
    sessionStorage.setItem("ventzon_banner_dismissed", "1");
    setShowBanner(false);
  }

  return (
    <div className="customer-app flex flex-col bg-surface" style={{ minHeight: "100dvh" }}>
      {showBanner && <AppStoreBanner onDismiss={dismissBanner} />}
      {showOnboarding && <Onboarding onFinish={finishOnboarding} />}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: hideNav ? 0 : "80px" }}>
        {children}
      </div>

      {!hideNav && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-subtle bg-surface/90 backdrop-blur-md"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center px-2 py-2">
            {/* Left tabs: Home, Map */}
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
                      className={`h-5 w-5 transition-colors duration-200 ${active ? "text-primary" : "text-muted"}`}
                      strokeWidth={active ? 1.5 : 1}
                    />
                    {showBadge && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <span className="text-2xs font-semibold text-inverse">{readyCount}</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-2xs font-medium uppercase tracking-caps transition-colors duration-200 ${active ? "text-primary" : "text-muted"}`}>
                    {label.toUpperCase()}
                  </span>
                </button>
              );
            })}

            {/* Centre POST button.
                This was Scan. Scan points a camera at a merchant QR code, and
                there are no merchants — it was the most prominent control in
                the app and it did nothing. Posting is the one action the
                product needs from a new user, and it had no affordance in the
                nav at all. Scan moves to the Rewards tab, where it belongs
                once merchants exist. */}
            <button
              onClick={() => router.push("/customer/profile?compose=1")}
              aria-label="Post"
              className="flex flex-1 flex-col items-center gap-1 py-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                <Plus className="h-7 w-7 text-inverse" strokeWidth={2} />
              </div>
            </button>

            {/* Right tabs: Rewards, Alerts, Profile */}
            {tabs.slice(2).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname?.startsWith(href + "/");
              const showBadge = href === "/customer/home" && readyCount > 0;
              const alertCount = href === "/customer/notifications" ? unreadAlerts : 0;
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="flex flex-1 flex-col items-center gap-1 py-1"
                >
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${active ? "text-primary" : "text-muted"}`}
                      strokeWidth={active ? 1.5 : 1}
                    />
                    {showBadge && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                        <span className="text-2xs font-semibold text-inverse">{readyCount}</span>
                      </div>
                    )}
                    {alertCount > 0 && (
                      <div className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1">
                        <span className="text-2xs font-semibold text-inverse">
                          {alertCount > 9 ? "9+" : alertCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`text-2xs font-medium uppercase tracking-caps transition-colors duration-200 ${active ? "text-primary" : "text-muted"}`}>
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
