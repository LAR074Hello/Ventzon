"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { X, Zap, RotateCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { performCheckin } from "@/lib/checkin";
import { acquireBackCameraStream, isPermissionDeniedError } from "@/lib/camera";

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

  // Resolved once, before any scan, so a decoded QR can be checked in on.
  const emailRef = useRef<string | null>(null);
  // ?shop=<slug> — set when the user came from a store's "Check in" button.
  // It enables the no-camera fallback: check in without scanning.
  const [originShop, setOriginShop] = useState<string | null>(null);

  const [state, setState] = useState<ScanState>("scanning");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [checkinBusy, setCheckinBusy] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // Signed-in customer email + the origin shop (if any), read once.
  useEffect(() => {
    try {
      setOriginShop(new URLSearchParams(window.location.search).get("shop"));
    } catch {}
    createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        emailRef.current = data.session?.user?.email?.toLowerCase() ?? null;
        if (!data.session) {
          router.replace("/customer/auth?redirect=/customer/scan");
        }
      });
  }, [router]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  /**
   * A QR decoded. Stop the camera, check in via the shared hardened handler,
   * then land on the shop page. `?checked_in=1` makes the shop page show the
   * stamp animation; it is omitted when the check-in failed so the page never
   * claims a success that did not happen.
   */
  const onCode = useCallback(
    async (slug: string) => {
      stopCamera();
      setState("success");
      let checkedIn = false;
      if (emailRef.current) {
        try {
          const res = await performCheckin({ shopSlug: slug, email: emailRef.current });
          checkedIn = res?.status !== "already_checked_in";
        } catch (err: any) {
          console.error("[scan] check-in failed for", slug, err?.message ?? err);
        }
      }
      router.push(`/customer/shop/${slug}${checkedIn ? "?checked_in=1" : ""}`);
    },
    [router, stopCamera]
  );

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
        onCode(slug);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onCode]);

  /**
   * Camera startup — rear camera first.
   *
   * iOS will open the FRONT camera and ignore a post-hoc
   * `applyConstraints({ facingMode: "environment" })` — the physical camera
   * never switches. The rear camera must be requested in the getUserMedia
   * call itself. `acquireBackCameraStream` (src/lib/camera.ts) walks that
   * ladder: exact environment → ideal environment → explicit rear deviceId
   * from enumerateDevices() → `{ video: true }` as a last resort. The call is
   * wrapped so a synchronous conversion throw cannot escape the effect, and
   * the real error (name + message) is logged for diagnosis.
   */
  const startCamera = useCallback(async () => {
    try {
      const stream = await acquireBackCameraStream();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");
      rafRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      console.error("[scan] getUserMedia failed", {
        name: err?.name,
        message: err?.message,
        error: err,
      });
      const denied = isPermissionDeniedError(err);
      setState(denied ? "permission-denied" : "error");
      if (!denied) setErrorMsg(err?.message ?? String(err));
    }
  }, [tick]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera, cameraAttempt]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch {}
  }

  /** No-camera fallback for viewers who came from a store's Check-in button. */
  async function checkInWithoutCamera() {
    const slug = originShop;
    if (!slug || !emailRef.current || checkinBusy) return;
    setCheckinBusy(true);
    try {
      await performCheckin({ shopSlug: slug, email: emailRef.current });
      router.push(`/customer/shop/${slug}?checked_in=1`);
    } catch (err: any) {
      console.error("[scan] check-in without camera failed", err?.message ?? err);
      setErrorMsg(err?.message ?? "Check-in failed — please try again.");
    } finally {
      setCheckinBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
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
            <div className="absolute inset-0 flex items-center justify-center rounded-card bg-emerald-500/20">
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
        <p className="text-xs font-semibold uppercase tracking-caps text-white /80">SCAN QR CODE</p>
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
            <p className="font-display text-lg font-semibold tracking-tight text-white /90">Point at a Ventzon QR code</p>
            <p className="text-sm text-white mt-2 /40">Found at participating stores</p>
          </>
        )}
        {state === "success" && (
          <p className="font-display text-lg font-semibold tracking-tight text-primary">Opening store…</p>
        )}
        {state === "permission-denied" && (
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-white /90">Camera access required</p>
            <p className="text-sm text-white mt-2 /50">
              Go to Settings → Ventzon → Camera and enable access
            </p>
            {originShop && (
              <button
                onClick={checkInWithoutCamera}
                disabled={checkinBusy}
                className="mt-5 rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white active:bg-white/10 disabled:opacity-40"
              >
                {checkinBusy ? "Checking in…" : "Check in without camera"}
              </button>
            )}
          </div>
        )}
        {state === "error" && (
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-white /90">Couldn&rsquo;t start the camera</p>
            {errorMsg && <p className="text-sm text-white mt-2 /50">{errorMsg}</p>}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setCameraAttempt((n) => n + 1)}
                className="flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white active:bg-white/10"
              >
                <RotateCw className="h-4 w-4" /> Try again
              </button>
              {originShop && (
                <button
                  onClick={checkInWithoutCamera}
                  disabled={checkinBusy}
                  className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium text-white active:bg-white/10 disabled:opacity-40"
                >
                  {checkinBusy ? "Checking in…" : "Check in without camera"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
