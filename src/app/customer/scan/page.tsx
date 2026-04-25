"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { X, Zap } from "lucide-react";

type ScanState = "scanning" | "success" | "error" | "permission-denied";

function parseShopSlug(raw: string): string | null {
  try {
    const url = new URL(raw);
    // matches /join/{slug} or /customer/shop/{slug}
    const joinMatch = url.pathname.match(/\/join\/([^/?#]+)/);
    if (joinMatch) return joinMatch[1];
    const shopMatch = url.pathname.match(/\/customer\/shop\/([^/?#]+)/);
    if (shopMatch) return shopMatch[1];
  } catch {
    // not a URL — might be a raw slug
    if (/^[a-z0-9-]+$/.test(raw)) return raw;
  }
  return null;
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [state, setState] = useState<ScanState>("scanning");
  const [torchOn, setTorchOn] = useState(false);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code) {
      const slug = parseShopSlug(code.data);
      if (slug) {
        stopCamera();
        setState("success");
        setTimeout(() => router.push(`/customer/shop/${slug}`), 600);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [router, stopCamera]);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!mounted) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          rafRef.current = requestAnimationFrame(tick);
        }
      })
      .catch(() => {
        if (mounted) setState("permission-denied");
      });
    return () => {
      mounted = false;
      stopCamera();
    };
  }, [tick, stopCamera]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {}
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Hidden video + canvas for processing */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera fill */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
      </div>

      {/* Dark overlay with cutout via box-shadow trick */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative"
          style={{
            width: 260,
            height: 260,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
            borderRadius: 16,
          }}
        >
          {/* Corner markers */}
          {[
            "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
            "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
            "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
            "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-8 h-8 border-white ${cls}`} />
          ))}

          {/* Scan line */}
          {state === "scanning" && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-white/60 animate-scan" />
          )}

          {/* Success overlay */}
          {state === "success" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-500/20">
              <div className="h-14 w-14 flex items-center justify-center rounded-full bg-emerald-500">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5" style={{ paddingTop: 12 }}>
        <button
          onClick={() => { stopCamera(); router.back(); }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <p className="text-[13px] font-light tracking-[0.2em] text-white/80">SCAN QR CODE</p>
        <button
          onClick={toggleTorch}
          className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm ${torchOn ? "bg-white/90" : "bg-black/40"}`}
        >
          <Zap className={`h-4 w-4 ${torchOn ? "text-black" : "text-white"}`} />
        </button>
      </div>

      {/* Bottom text */}
      <div className="relative z-10 mt-auto pb-10 px-8 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}>
        {state === "scanning" && (
          <>
            <p className="text-[15px] font-light text-white/90">Point at a Ventzon QR code</p>
            <p className="mt-2 text-[12px] font-light text-white/40">Found at participating stores</p>
          </>
        )}
        {state === "success" && (
          <p className="text-[15px] font-light text-emerald-400">Opening store…</p>
        )}
        {state === "permission-denied" && (
          <div>
            <p className="text-[15px] font-light text-white/90">Camera access required</p>
            <p className="mt-2 text-[12px] font-light text-white/50">
              Go to Settings → Ventzon → Camera and enable access
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
