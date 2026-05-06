"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
// @ts-ignore - some installs of qrcode.react ship without TS types; runtime is fine
import { QRCodeCanvas } from "qrcode.react";

export default function PrintCardPage() {
  const params = useParams();
  const router = useRouter();
  const shopSlug = String(params?.shop ?? "").toLowerCase();

  const [shopName, setShopName] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopSlug) return;

    (async () => {
      // Auth guard — redirect to login if not signed in
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        // Fetch settings (no token needed here — server returns the join_token in response)
        const res = await fetch(
          `/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error ?? "Shop not found");
          return;
        }

        const name = data.settings?.shop_name ?? null;
        const token: string | undefined = data.join_token;

        setShopName(name);

        // Build the join URL — always include the token so the QR scan works
        const base = `https://www.ventzon.com/join/${shopSlug}`;
        setJoinUrl(token ? `${base}?t=${token}` : base);
      } catch {
        setError("Failed to load shop");
      } finally {
        setLoading(false);
      }
    })();
  }, [shopSlug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-stone-400 text-sm tracking-wider">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          /* Hide everything outside the card */
          body > *:not(#print-card-root) { display: none !important; }
          header, nav, footer { display: none !important; }

          .no-print { display: none !important; }

          @page {
            size: 4in 6in;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 p-8 gap-6">
        {/* Print button */}
        <button
          onClick={() => window.print()}
          className="no-print px-6 py-3 bg-stone-800 text-white text-sm tracking-widest rounded hover:bg-stone-700 transition-colors cursor-pointer"
        >
          PRINT CARD
        </button>

        {/* The 4×6 loyalty card */}
        <div
          id="print-card-root"
          className="bg-stone-50 shadow-lg"
          style={{ width: "384px", height: "576px" }}
        >
          <div className="h-full flex flex-col items-center justify-between p-12">
            {/* Store Name */}
            <div className="w-full text-center mt-8">
              <h1
                className="text-3xl tracking-widest text-stone-800"
                style={{ fontWeight: 300, letterSpacing: "0.2em" }}
              >
                {shopName?.toUpperCase()}
              </h1>
            </div>

            {/* QR Code + fallback URL */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div
                className="bg-white border border-stone-200 flex items-center justify-center"
                style={{ width: "180px", height: "180px" }}
              >
                {joinUrl && <QRCodeCanvas value={joinUrl} size={160} />}
              </div>
              <p
                className="text-[9px] tracking-widest text-stone-400"
                style={{ letterSpacing: "0.12em" }}
              >
                {`ventzon.com/join/${shopSlug}`}
              </p>
            </div>

            {/* Powered By Text */}
            <div className="w-full text-center mb-6">
              <p
                className="text-[10px] tracking-widest text-stone-500"
                style={{ letterSpacing: "0.15em" }}
              >
                POWERED BY VENTZON REWARDS
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
