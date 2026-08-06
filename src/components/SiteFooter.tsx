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
          <div className="h-6 w-6 overflow-hidden rounded-full bg-cream-card ring-1 ring-black/10">
            <Image
              src="/logo.png"
              alt="Ventzon"
              width={24}
              height={24}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[11px] font-medium tracking-[0.4em] text-taupe">
            VENTZON
          </span>
        </Link>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-taupe">
          <Link
            href="/how-it-works"
            className="transition-colors duration-300 hover:text-ink-warm"
          >
            How it works
          </Link>
          <Link
            href="/help"
            className="transition-colors duration-300 hover:text-ink-warm"
          >
            Help
          </Link>
          <Link
            href="/careers"
            className="transition-colors duration-300 hover:text-ink-warm"
          >
            Careers
          </Link>
          <Link
            href="/customer/explore"
            className="transition-colors duration-300 hover:text-ink-warm"
          >
            Open app
          </Link>
          <Link
            href="/privacy-policy"
            className="transition-colors duration-300 hover:text-ink-warm"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="transition-colors duration-300 hover:text-ink-warm"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

