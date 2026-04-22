import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="px-8 pb-12 pt-16">
      <div className="luxury-divider mx-auto mb-10 max-w-xs" />
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity duration-300 hover:opacity-70"
        >
          <div className="h-6 w-6 overflow-hidden rounded-full bg-black ring-1 ring-[#333]">
            <Image
              src="/logo.png"
              alt="Ventzon"
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[11px] font-light tracking-[0.4em] text-[#444]">
            VENTZON
          </span>
        </Link>
        <div className="flex gap-8 text-[12px] font-light tracking-[0.1em] text-[#444]">
          <Link
            href="/how-it-works"
            className="transition-colors duration-300 hover:text-[#999]"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="transition-colors duration-300 hover:text-[#999]"
          >
            Pricing
          </Link>
          <Link
            href="/careers"
            className="transition-colors duration-300 hover:text-[#999]"
          >
            Careers
          </Link>
          <Link
            href="/privacy-policy"
            className="transition-colors duration-300 hover:text-[#999]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="transition-colors duration-300 hover:text-[#999]"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
