"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// @ts-ignore - some installs of qrcode.react ship without TS types; runtime is fine
import { QRCodeCanvas } from "qrcode.react";

export default function PrintCardPage() {
  const params = useParams();
  const shopSlug = String(params?.shop ?? "").toLowerCase();

  const [shopName, setShopName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = `https://www.ventzon.com/join/${shopSlug}`;

  useEffect(() => {
    if (!shopSlug) return;

    fetch(`/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.settings?.shop_name) {
          setShopName(data.settings.shop_name);
        } else {
          setError("Shop not found");
        }
      })
      .catch(() => setError("Failed to load shop"))
      .finally(() => setLoading(false));
  }, [shopSlug]);

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
                <QRCodeCanvas value={joinUrl} size={160} />
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
