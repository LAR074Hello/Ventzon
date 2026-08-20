"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { flushPendingReferral, stashReferralCode } from "@/lib/referral-client";

/**
 * /invite/<code> — public referral landing.
 *
 * The code is stashed the moment the page loads, so it survives every
 * navigation in the signup/onboarding chain. Signed-out visitors get the
 * invite and a Join button; signed-in visitors get attributed immediately
 * (subject to the server-side onboarding gate) and pointed back into the app.
 */
export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = String(params?.code ?? "");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [checked, setChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!code) return;
    stashReferralCode(code);
    supabase.auth.getSession().then(({ data }) => {
      const authed = Boolean(data.session);
      setSignedIn(authed);
      if (authed) flushPendingReferral();
      setChecked(true);
    });
  }, [code, supabase]);

  return (
    <main className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-semibold tracking-tight text-primary">Ventzon</span>
      </header>

      <section className="mx-auto flex max-w-xl flex-col items-center px-5 pb-16 pt-10 text-center">
        <p className="text-2xs font-semibold uppercase tracking-caps text-muted">You&rsquo;re invited</p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-primary">
          Your friend invited you to Ventzon 👀
        </h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-secondary">
          Discover what&rsquo;s happening around you — the places people actually
          go, and who&rsquo;s really there.
        </p>

        {checked && !signedIn && (
          <button
            onClick={() => router.push("/customer/auth?redirect=/customer/explore")}
            className="mt-8 w-full max-w-xs rounded-full bg-accent py-3.5 text-sm font-medium text-on-accent"
          >
            Join Ventzon
          </button>
        )}
        {checked && signedIn && (
          <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-3">
            <p className="text-sm text-secondary">You&rsquo;re already on Ventzon.</p>
            <button
              onClick={() => router.push("/customer/explore")}
              className="w-full rounded-full bg-accent py-3.5 text-sm font-medium text-on-accent"
            >
              Open Ventzon
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
