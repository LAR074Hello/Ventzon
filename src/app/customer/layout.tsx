"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Compass, CreditCard, User, ScanLine } from "lucide-react";
import Onboarding, { useOnboarding } from "./components/Onboarding";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const tabs = [
  { href: "/customer/explore", label: "Explore", icon: Compass },
  { href: "/customer/home", label: "My Cards", icon: CreditCard },
  { href: "/customer/profile", label: "Profile", icon: User },
];

async function registerPushNotifications() {
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
        body: JSON.stringify({ token, platform: "ios" }),
      });
    });
  } catch {}
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { show: showOnboarding, finish: finishOnboarding } = useOnboarding();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) registerPushNotifications();
    });
  }, []);

  const isAuthPage = pathname === "/customer/auth";
  const isScanPage = pathname === "/customer/scan";
  const hideNav = isAuthPage || isScanPage;

  return (
    <div className="customer-app flex flex-col bg-black" style={{ minHeight: "100dvh" }}>
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
