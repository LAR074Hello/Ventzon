"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Shown on /merchant/dashboard?checkout=success when the webhook that creates
 * the shop may still be a moment behind Stripe's redirect. Polls for the new
 * shop, then lets the dashboard resolver continue (0→create, 1→shop, N→list).
 */
export default function PendingPayment() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    async function check() {
      if (cancelled) return;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled && user) {
          const { data: shops } = await supabase
            .from("shops")
            .select("slug")
            .eq("user_id", user.id)
            .limit(1);
          if (!cancelled && shops && shops.length > 0) {
            window.location.replace("/merchant/dashboard");
            return;
          }
        }
      } catch {
        // Network/auth blip — keep polling.
      }
      tries += 1;
      if (cancelled) return;
      if (tries >= 25) {
        setTimedOut(true);
        return;
      }
      pollId = window.setTimeout(check, 2000);
    }

    let pollId: number;
    pollId = window.setTimeout(check, 800);

    return () => {
      cancelled = true;
      window.clearTimeout(pollId);
    };
  }, [supabase]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      {!timedOut ? (
        <>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-subtle border-t-strong" />
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-primary">
            Confirming your payment…
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your shop is being created. This usually takes a few seconds —
            you&rsquo;ll be taken to your dashboard automatically.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold tracking-tight text-primary">
            Still confirming your payment
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            It&rsquo;s taking longer than usual. If you completed checkout, your
            shop will appear shortly — or you can start again below.
          </p>
          <Link
            href="/get-started"
            className="mt-6 inline-flex items-center rounded-lg bg-merchant px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-merchant-hover"
          >
            Back to onboarding
          </Link>
        </>
      )}
    </div>
  );
}
