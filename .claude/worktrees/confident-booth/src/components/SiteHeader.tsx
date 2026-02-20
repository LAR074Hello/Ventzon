"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-sm tracking-[0.35em] text-neutral-300">
          VENTZON
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/how-it-works" className="text-sm text-neutral-300 hover:text-white">
            How it works
          </Link>
          <Link href="/pricing" className="text-sm text-neutral-300 hover:text-white">
            Pricing
          </Link>
          <Link href="/merchant" className="text-sm text-neutral-300 hover:text-white">
            Merchant
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-600"
          >
            Login
          </Link>
          <Link
            href="/start"
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}