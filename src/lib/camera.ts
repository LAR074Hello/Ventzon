/**
 * Camera acquisition for the QR scanner.
 *
 * iOS WKWebView/Safari will happily open the FRONT camera and then ignore a
 * post-hoc `track.applyConstraints({ facingMode: "environment" })` — the
 * physical camera never switches. The fix is to request the rear camera in
 * the getUserMedia call itself, with a fallback ladder that ends in whatever
 * the platform provides rather than an uncaught error:
 *
 *   1. { facingMode: { exact: "environment" } }   — rear camera, or fail
 *   2. { facingMode: { ideal: "environment" } }   — rear camera if available
 *   3. explicit rear deviceId from enumerateDevices()
 *   4. { video: true }                            — whatever the platform gives
 *
 * A permission denial (NotAllowedError) short-circuits the ladder so the
 * caller can show the "camera permission" state immediately instead of
 * burning the remaining rungs.
 */

function isPermissionDenied(err: any): boolean {
  return (
    err?.name === "NotAllowedError" ||
    err?.name === "PermissionDeniedError" ||
    err?.code === 1
  );
}

/** True when err is a camera-permission denial (NotAllowedError et al). */
export function isPermissionDeniedError(err: any): boolean {
  return isPermissionDenied(err);
}

function stopStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/**
 * Best-effort "is this the front camera?" check.
 *
 * `track.getSettings().facingMode` is authoritative where supported; WebKit
 * sometimes leaves it undefined, so we fall back to the track's label.
 * Unknown/empty labels are treated as NOT front so the ladder never loops.
 */
export async function isFrontFacing(stream: MediaStream): Promise<boolean> {
  const track = stream.getVideoTracks()[0];
  if (!track) return false;
  try {
    const facingMode = track.getSettings().facingMode;
    if (facingMode === "user") return true;
    if (facingMode === "environment" || facingMode === "left" || facingMode === "right") {
      return false;
    }
  } catch {
    // getSettings() unsupported — fall through to label heuristics.
  }
  return /front|user/i.test(track.label || "");
}

/**
 * Acquire a stream from the rear camera, walking the ladder until the
 * platform says yes. Throws only on permission denial or when no camera
 * exists at all (which surfaces as `{ video: true }` failing).
 */
export async function acquireBackCameraStream(): Promise<MediaStream> {
  // Rung 1 — exact rear camera.
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false,
    });
  } catch (err: any) {
    if (isPermissionDenied(err)) throw err;
    console.warn("[scan] exact environment unavailable", err?.name, err?.message);
  }

  // Rung 2 — ideal rear camera. Honored in the INITIAL getUserMedia call on
  // iOS (unlike a post-hoc applyConstraints), so this usually lands the rear
  // camera. If it still resolves to the front camera, stop it and continue.
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    if (!(await isFrontFacing(stream))) return stream;
    stopStream(stream);
  } catch (err: any) {
    if (isPermissionDenied(err)) throw err;
    console.warn("[scan] ideal environment unavailable", err?.name, err?.message);
  }

  // Rung 3 — pick the rear videoinput explicitly. When labels are empty
  // (common in a bare WKWebView) the LAST videoinput is usually the main
  // rear camera on iPhone.
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    const target =
      cams.find((d) => /back|rear|environment/i.test(d.label)) ?? cams[cams.length - 1];
    if (target?.deviceId) {
      return await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: target.deviceId } },
        audio: false,
      });
    }
  } catch (err: any) {
    if (isPermissionDenied(err)) throw err;
    console.warn("[scan] deviceId targeting unavailable", err?.name, err?.message);
  }

  // Rung 4 — whatever the platform gives us.
  return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
}
