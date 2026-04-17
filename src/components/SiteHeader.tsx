"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/merchant/dashboard", label: "Merchant" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith("/customer")) return null;

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-70"
          >
            <div className="h-7 w-7 overflow-hidden rounded-full bg-black ring-1 ring-[#333]">
              <Image
                src="/logo.png"
                alt="Ventzon"
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="text-[11px] font-light tracking-[0.45em] text-[#ededed]">
              VENTZON
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors duration-300 hover:text-[#ededed]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hidden text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors duration-300 hover:text-[#ededed] sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden rounded-full border border-[#333] px-5 py-2 text-[11px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:border-[#666] hover:bg-white/5 sm:inline-flex"
            >
              Get started
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="relative flex h-8 w-8 items-center justify-center md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <div className="flex w-[18px] flex-col items-end gap-[5px]">
                <span
                  className={`block h-[1px] bg-[#ededed] transition-all duration-300 ease-out ${
                    open ? "w-[18px] translate-y-[3px] rotate-45" : "w-[18px]"
                  }`}
                />
                <span
                  className={`block h-[1px] bg-[#ededed] transition-all duration-300 ease-out ${
                    open ? "w-[18px] -translate-y-[3px] -rotate-45" : "w-[12px]"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-500 md:hidden ${
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
                className={`block border-t border-[#161616] py-6 text-2xl font-extralight tracking-[-0.01em] text-white transition-all duration-500 hover:text-[#888] ${
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
            <div className="border-t border-[#161616]" />
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
              className="text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors duration-300 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-[#333] px-6 py-2.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:border-[#666] hover:bg-white/5"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
