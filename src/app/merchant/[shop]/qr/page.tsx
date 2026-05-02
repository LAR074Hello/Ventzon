"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// @ts-ignore
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Maximize2, Download } from "lucide-react";
import { useRef } from "react";

export default function MerchantQRPage() {
  const params = useParams();
  const router = useRouter();
  const shopSlug = String(params?.shop ?? "").toLowerCase();
  const [shopName, setShopName] = useState<string | null>(null);
  const [dealTitle, setDealTitle] = useState<string | null>(null);
  const [rewardGoal, setRewardGoal] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const joinUrl = `https://www.ventzon.com/join/${shopSlug}`;
  const qrRef = useRef<HTMLDivElement>(null);

  function downloadQR() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${shopSlug}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  useEffect(() => {
    fetch(`/api/join/settings?shop_slug=${encodeURIComponent(shopSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setShopName(data.settings.shop_name ?? shopSlug);
          setDealTitle(data.settings.deal_title ?? null);
          setRewardGoal(data.settings.reward_goal ?? 5);
        }
      })
      .finally(() => setLoading(false));
  }, [shopSlug]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-black px-8 py-8 select-none">
      {/* Top bar */}
      <div className="flex w-full max-w-md items-center justify-between">
        {!fullscreen && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors hover:text-[#888]"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK
          </button>
        )}
        <div className={fullscreen ? "w-full flex justify-end" : ""}>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 text-[12px] font-light tracking-[0.15em] text-[#555] transition-colors hover:text-[#888]"
          >
            <Maximize2 className="h-4 w-4" />
            {fullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center text-center">
        {/* Store name */}
        <p className="text-[11px] font-light tracking-[0.4em] text-[#444] mb-3">SCAN TO JOIN</p>
        <h1 className="text-[32px] font-extralight tracking-[-0.02em] text-white leading-tight mb-2">
          {shopName}
        </h1>
        {dealTitle && (
          <p className="text-[15px] font-light text-[#555] mb-8">{dealTitle}</p>
        )}

        {/* QR code */}
        <div ref={qrRef} className="rounded-3xl bg-white p-6 shadow-2xl mb-8">
          <QRCodeCanvas
            value={joinUrl}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
          />
        </div>

        {/* URL */}
        <p className="text-[12px] font-light tracking-[0.1em] text-[#333]">
          ventzon.com/join/{shopSlug}
        </p>
      </div>

      {/* Bottom: reward info */}
      <div className="flex w-full max-w-md flex-col items-center gap-4">
        {/* Stamp dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: rewardGoal }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-3 rounded-full border border-[#333] bg-transparent"
            />
          ))}
        </div>
        <p className="text-[12px] font-light text-[#444]">
          Collect {rewardGoal} stamps to earn your reward
        </p>
        <button
          onClick={downloadQR}
          className="flex items-center gap-2 text-[11px] font-light tracking-[0.15em] text-[#555] transition-colors hover:text-[#888]"
        >
          <Download className="h-3 w-3" />
          DOWNLOAD PNG
        </button>
        <p className="text-[10px] font-light tracking-[0.2em] text-[#2a2a2a]">POWERED BY VENTZON</p>
      </div>
    </div>
  );
}
