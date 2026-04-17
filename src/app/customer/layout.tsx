"use client";

import { usePathname, useRouter } from "next/navigation";
import { Compass, CreditCard, User } from "lucide-react";

const tabs = [
  { href: "/customer/explore", label: "Explore", icon: Compass },
  { href: "/customer/home", label: "My Cards", icon: CreditCard },
  { href: "/customer/profile", label: "Profile", icon: User },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/customer/auth";

  return (
    <div className="flex flex-col bg-black" style={{ minHeight: "100dvh" }}>
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: isAuthPage ? 0 : "80px" }}>
        {children}
      </div>

      {!isAuthPage && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a1a1a] bg-black/90 backdrop-blur-md"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around px-2 py-3">
            {tabs.map(({ href, label, icon: Icon }) => {
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
                  <span
                    className={`text-[10px] font-light tracking-[0.15em] transition-colors duration-200 ${active ? "text-[#ededed]" : "text-[#444]"}`}
                  >
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
