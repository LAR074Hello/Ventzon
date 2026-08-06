/**
 * Caps on what a post's media may be, checked BEFORE the metadata strip.
 *
 * Order matters: rejecting a 90-second 4K clip should not first spend several
 * seconds reading it into memory to strip metadata from a file that is about to
 * be thrown away. The strip is the expensive step, so the cheap checks run
 * first.
 *
 * Two limits, because either alone lets the other through: 30 seconds of 4K
 * clears 50 MB comfortably, and 50 MB of low-bitrate footage runs far past
 * half a minute. Whichever is exceeded first rejects, and the message says
 * WHICH —
 * "too big" when the real problem is length sends someone off to compress a
 * video that will still be too long.
 */

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 30;

const mb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "");

function formatDuration(seconds: number): string {
  const whole = Math.round(seconds);
  if (whole < 60) return `${whole} seconds`;
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Duration from a local file, without decoding it.
 *
 * Returns null when the browser cannot tell us — a codec it will not parse, a
 * metadata load that errors, or one that simply never fires. **Unknown does not
 * mean rejected.** A video whose duration cannot be read is far more likely to
 * be an unusual container than a 40-minute recording, and the size cap still
 * applies to it. Blocking a legitimate post because a metadata event did not
 * arrive is the wrong trade in a product whose entire problem is getting people
 * to post at all.
 */
export function readVideoDuration(file: File, timeoutMs = 4000): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const d = video.duration;
      finish(Number.isFinite(d) && d > 0 ? d : null);
    };
    video.onerror = () => finish(null);
    video.src = url;
  });
}

export type LimitResult = { ok: true } | { ok: false; reason: string };

export async function checkMediaLimits(file: File): Promise<LimitResult> {
  // Size first: it is free, and it is the one that is always knowable.
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason:
        `That file is ${mb(file.size)} MB and the limit is ${mb(MAX_UPLOAD_BYTES)} MB. ` +
        `Try a shorter clip, or record at a lower resolution.`,
    };
  }

  if (!file.type.startsWith("video/")) return { ok: true };

  const seconds = await readVideoDuration(file);
  if (seconds !== null && seconds > MAX_VIDEO_SECONDS) {
    return {
      ok: false,
      reason:
        `That video is ${formatDuration(seconds)} and the limit is ` +
        `${MAX_VIDEO_SECONDS} seconds. Trim it and try again.`,
    };
  }

  return { ok: true };
}
