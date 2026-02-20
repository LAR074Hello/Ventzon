"use client";

import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        {/* Logo — swap the text for an <Image> when you have an SVG */}
        <Link
          href="/"
          className="text-[11px] font-light tracking-[0.45em] text-[#ededed] transition-opacity duration-300 hover:opacity-70"
        >
          {/*
            To use a custom SVG logo, replace the span below with:
            <Image src="/logo.svg" alt="Ventzon" width={100} height={24} priority />
          */}
          <span>VENTZON</span>
        </Link>

        {/* Nav links — hidden on mobile, minimal on desktop */}
        <nav className="hidden items-center gap-10 md:flex">
          <Link
            href="/how-it-works"
            className="text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors duration-300 hover:text-[#ededed]"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors duration-300 hover:text-[#ededed]"
          >
            Pricing
          </Link>
          <Link
            href="/merchant/dashboard"
            className="text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors duration-300 hover:text-[#ededed]"
          >
            Merchant
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors duration-300 hover:text-[#ededed]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-[#333] px-5 py-2 text-[11px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-300 hover:border-[#666] hover:bg-white/5"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
