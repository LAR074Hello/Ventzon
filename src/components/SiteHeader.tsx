"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/app", label: "Customer app" },
  { href: "/merchant-dashboard", label: "For shops" },
  { href: "/pricing", label: "Pricing" },
];

// Header "Open the app" CTA — the iOS App Store listing, opened in a new tab.
const APP_STORE_URL = "https://apps.apple.com/us/app/ventzon/id6763768638";

type Identity = { name: string | null; email: string | null };

function toIdentity(
  user: { email?: string | null; user_metadata?: unknown } | null
): Identity | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = typeof meta.full_name === "string" ? meta.full_name : null;
  return { name, email: user.email ?? null };
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Signed-in state, read with the same Supabase browser client the rest of
  // the site uses. "loading" is the neutral pre-resolution placeholder.
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    const id = window.setTimeout(() => setOpen(false), 0);
    return () => window.clearTimeout(id);
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

  // Resolve the signed-in identity from the existing Supabase session and keep
  // it in sync with auth changes.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Cheap local read first — when there's no session at all we can skip
        // the network getUser call (marketing pages, logged-out visitors).
        const { data: sessionData } = await supabase.auth.getSession();
        if (!mounted) return;
        if (!sessionData.session) {
          setIdentity(null);
          setAuthState("out");
          return;
        }
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setIdentity(toIdentity(data.user));
        setAuthState(data.user ? "in" : "out");
      } catch {
        if (mounted) setAuthState("out");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setIdentity(toIdentity(session?.user ?? null));
        setAuthState(session?.user ? "in" : "out");
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    setUserMenuOpen(false);
    setOpen(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // State is reset below regardless of network/auth hiccups.
    }
    setIdentity(null);
    setAuthState("out");
    router.refresh();
  }

  const identityLabel = identity?.name || identity?.email || "";

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
            {authState === "loading" && (
              <span className="hidden text-[13px] text-fog-500 sm:block">
                …
              </span>
            )}
            {authState === "out" && (
              <Link
                href="/login"
                className="hidden text-[13px] font-normal tracking-[0.08em] text-fog-300 transition-colors duration-300 hover:text-fog-100 sm:block"
              >
                Sign in
              </Link>
            )}
            {authState === "in" && identity && (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex max-w-[220px] items-center gap-1.5 text-[13px] font-normal tracking-[0.08em] text-fog-300 transition-colors duration-300 hover:text-fog-100"
                >
                  <span className="truncate">Signed in as {identityLabel}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {userMenuOpen && (
                  <>
                    {/* Click-outside close */}
                    <button
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setUserMenuOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-white/10 bg-night-900 py-1.5 shadow-warm-lg">
                      <div className="border-b border-white/10 px-4 py-2.5">
                        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-fog-500">
                          Signed in as
                        </p>
                        <p className="mt-1 truncate text-[13px] text-fog-100">
                          {identityLabel}
                        </p>
                      </div>
                      <Link
                        href="/merchant/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-[13px] text-fog-300 transition-colors duration-200 hover:bg-white/5 hover:text-fog-100"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] text-fog-300 transition-colors duration-200 hover:bg-white/5 hover:text-fog-100"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full bg-maroon px-6 py-2.5 text-[13px] font-medium tracking-[0.12em] text-white transition-all duration-300 ease-luxe hover:bg-maroon-hover active:scale-[0.97] sm:inline-flex"
            >
              Open the app
            </a>

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

          {/* Mobile auth / account */}
          <div
            className={`mt-12 transition-all duration-500 ${
              open
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            style={{
              transitionDelay: open ? `${150 + navLinks.length * 75}ms` : "0ms",
            }}
          >
            {authState === "in" && identity ? (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-fog-500">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-[15px] font-normal text-fog-100">
                  {identityLabel}
                </p>
                <div className="mt-5 flex items-center gap-6">
                  <Link
                    href="/merchant/dashboard"
                    onClick={() => setOpen(false)}
                    className="text-[14px] font-medium text-fog-300 transition-colors duration-300 hover:text-fog-100"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-[14px] font-medium text-fog-300 transition-colors duration-300 hover:text-fog-100"
                  >
                    Sign out
                  </button>
                </div>
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex rounded-full bg-maroon px-6 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:bg-maroon-hover"
                >
                  Open the app
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {authState === "loading" ? (
                  <span className="text-[14px] text-fog-500">…</span>
                ) : (
                  <Link
                    href="/login"
                    className="text-[14px] font-medium text-fog-300 transition-colors duration-300 hover:text-fog-100"
                  >
                    Sign in
                  </Link>
                )}
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-maroon px-6 py-2.5 text-[14px] font-medium text-white transition-all duration-300 hover:bg-maroon-hover"
                >
                  Open the app
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

