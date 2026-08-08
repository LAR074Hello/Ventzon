"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/app", label: "Customer app" },
  { href: "/merchant-dashboard", label: "For shops" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide the marketing header on app surfaces (customer, rep, merchant)
  // and on the /dev reference surfaces, which must render the token
  // system unobstructed by marketing chrome. Note: /merchant-dashboard is
  // a MARKETING page (the merchant showcase) and must keep the header —
  // only /merchant and /merchant/* are app surfaces.
  const hidden =
    pathname?.startsWith("/customer") ||
    pathname?.startsWith("/rep") ||
    pathname === "/merchant" ||
    pathname?.startsWith("/merchant/") ||
    pathname?.startsWith("/dev") ||
    // Share surfaces carry their own minimal header; the marketing chrome
    // is still un-retokenized and would land inconsistently on them.
    pathname?.startsWith("/p/") ||
    pathname?.startsWith("/place/");

  // The header stays visible everywhere. On the landing page it starts
  // transparent over the hero video (so the film reads through) and
  // solidifies to the frosted surface once the hero has been scrolled past.
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Early return must come AFTER all hooks so the hook count is stable
  // across renders (a conditional return before hooks throws React #300).
  if (hidden) return null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          solid ? "bg-night-950/90 backdrop-blur-xl" : "bg-night-950/70 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-70"
          >
            <div className="h-7 w-7 overflow-hidden rounded-full bg-night-800 ring-1 ring-white/15">
              <Image
                src="/logo.png"
                alt="Ventzon"
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[11px] font-medium tracking-[0.45em] text-fog-100">
              VENTZON
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-normal tracking-[0.08em] text-fog-300 transition-colors duration-300 hover:text-fog-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hidden text-[13px] font-normal tracking-[0.08em] text-fog-300 transition-colors duration-300 hover:text-fog-100 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/customer/explore"
              className="hidden rounded-full bg-maroon px-6 py-2.5 text-[13px] font-medium tracking-[0.12em] text-white transition-all duration-300 ease-luxe hover:bg-maroon-hover active:scale-[0.97] sm:inline-flex"
            >
              Open the app
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="relative flex h-8 w-8 items-center justify-center md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <div className="flex w-[18px] flex-col items-end gap-[5px]">
                <span
                  className={`block h-[2px] rounded-full bg-ink-warm transition-all duration-300 ease-out ${
                    open ? "w-[18px] translate-y-[3.5px] rotate-45" : "w-[18px]"
                  }`}
                />
                <span
                  className={`block h-[2px] rounded-full bg-ink-warm transition-all duration-300 ease-out ${
                    open ? "w-[18px] -translate-y-[3.5px] -rotate-45" : "w-[12px]"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-night-950 transition-opacity duration-500 md:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex h-full flex-col justify-center px-10">
          <nav className="space-y-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block border-t border-white/10 py-6 text-2xl font-extralight tracking-[-0.01em] text-fog-100 transition-all duration-500 hover:text-fog-300 ${
                  open
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: open ? `${150 + i * 75}ms` : "0ms",
                }}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10" />
          </nav>

          {/* Mobile auth links */}
          <div
            className={`mt-12 flex items-center gap-6 transition-all duration-500 ${
              open
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{
              transitionDelay: open ? `${150 + navLinks.length * 75}ms` : "0ms",
            }}
          >
            <Link
              href="/login"
              className="text-[14px] font-medium text-fog-300 transition-colors duration-300 hover:text-fog-100"
            >
              Sign in
            </Link>
            <Link
              href="/customer/explore"
              className="rounded-full bg-maroon px-6 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:bg-maroon-hover"
            >
              Open the app
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

