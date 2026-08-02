/**
 * Capture a still from a video, client-side, for use as its poster.
 *
 * WHY. Video tiles render blank until they decode — worse on Chrome, which
 * will not play the `video/quicktime` an iPhone records at all, so an Android
 * or desktop viewer currently sees an empty rectangle where a post should be.
 * A poster turns that into a picture. It is also what makes the feed look like
 * a feed on first paint rather than a grid of holes.
 *
 * WHY THIS IS ALLOWED TO FAIL. A poster is an enhancement to a post, never a
 * gate in front of one — the same rule GPS check-in follows. Every failure path
 * returns `null` and the post publishes without a poster. Nothing here throws
 * into the submit path.
 *
 * WEBKIT NOTES, learned the hard way on this platform:
 *  - `muted` + `playsInline` are required or iOS refuses to decode without a
 *    user gesture, and `drawImage` then paints a blank frame.
 *  - Seek slightly INTO the clip. Frame zero of a phone video is very often
 *    black or a lens-adjusting blur; a poster taken there looks broken.
 *  - `blob:` URLs are same-origin, so the canvas is not tainted and `toBlob`
 *    is allowed. A remote URL would silently fail here instead.
 *  - Everything is wrapped in a timeout: on WebKit a `seeked` event that never
 *    arrives is a real outcome, and hanging the composer is not acceptable.
 */

export type PosterFrame = { blob: Blob; width: number; height: number };

/** Long edge of the captured poster. Enough for a full-bleed feed card. */
const MAX_EDGE = 1080;
const STEP_TIMEOUT_MS = 6000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout: ${label}`)), ms)
    ),
  ]);
}

function once(el: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const bad = () => {
      cleanup();
      reject(new Error(`${event}: media error`));
    };
    const cleanup = () => {
      el.removeEventListener(event, ok);
      el.removeEventListener("error", bad);
    };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", bad, { once: true });
  });
}

export async function capturePosterFrame(file: File): Promise<PosterFrame | null> {
  if (!file.type.startsWith("video/")) return null;
  if (typeof document === "undefined") return null;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  // Kept out of the layout but still rendered — a `display:none` video is
  // allowed to skip decoding entirely on some engines.
  video.style.cssText =
    "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
  document.body.appendChild(video);

  const cleanup = () => {
    video.removeAttribute("src");
    video.load();
    video.remove();
    URL.revokeObjectURL(url);
  };

  try {
    video.src = url;
    await withTimeout(once(video, "loadedmetadata"), STEP_TIMEOUT_MS, "loadedmetadata");

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    // A tenth of the way in, capped at one second. Far enough past a black
    // opening frame, early enough to still be the shot the poster should show.
    const target = duration > 0 ? Math.min(1, duration * 0.1) : 0;

    if (target > 0) {
      video.currentTime = target;
      // A seek that never completes is survivable — fall through and draw
      // whatever frame is decoded rather than giving up the poster entirely.
      await withTimeout(once(video, "seeked"), STEP_TIMEOUT_MS, "seeked").catch(() => {});
    } else {
      await withTimeout(once(video, "loadeddata"), STEP_TIMEOUT_MS, "loadeddata").catch(() => {});
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;

    const scale = Math.min(1, MAX_EDGE / Math.max(vw, vh));
    const width = Math.round(vw * scale);
    const height = Math.round(vh * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await withTimeout(
      new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
      ),
      STEP_TIMEOUT_MS,
      "toBlob"
    );
    if (!blob) return null;

    return { blob, width, height };
  } catch {
    // Any failure at all: no poster, post still publishes.
    return null;
  } finally {
    cleanup();
  }
}
