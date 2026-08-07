import Link from "next/link";
import Image from "next/image";
import Divider from "@/components/Divider";

export default function SiteFooter() {
  return (
    <footer className="px-8 pb-10 pt-20">
      <Divider className="mx-auto mb-14 max-w-xs" />

      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 sm:flex-row">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
        >
          <div className="h-6 w-6 overflow-hidden rounded-full bg-night-800 ring-1 ring-white/15 transition-transform duration-500 ease-luxe group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Ventzon"
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[11px] font-medium tracking-[0.4em] text-fog-300 transition-colors duration-300 group-hover:text-fog-100">
            VENTZON
          </span>
        </Link>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-fog-300">
          <Link
            href="/how-it-works"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            How it works
          </Link>
          <Link
            href="/merchant-dashboard"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            For shops
          </Link>
          <Link
            href="/help"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            Help
          </Link>
          <Link
            href="/careers"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            Careers
          </Link>
          <Link
            href="/customer/explore"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            Open app
          </Link>
          <Link
            href="/privacy-policy"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="transition-colors duration-300 ease-luxe hover:text-fog-100"
          >
            Terms
          </Link>
        </div>
      </div>

      {/* Legal strip */}
      <div className="mx-auto mt-14 flex max-w-5xl flex-col items-center justify-between gap-2 border-t border-white/5 pt-7 text-[11px] font-light tracking-[0.14em] text-fog-600 sm:flex-row">
        <p>© 2026 VENTZON</p>
        <p className="tracking-[0.1em]">For the places you actually go.</p>
      </div>
    </footer>
  );
}

