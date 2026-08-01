/**
 * Removes identifying metadata from a QuickTime/MP4 video, client-side.
 *
 * WHY THIS EXISTS
 * Photos were scrubbed of EXIF before upload; videos were not. iOS embeds
 * `com.apple.quicktime.location.ISO6709` — GPS to ~metre precision — plus
 * device make, model, software and creation date. Posts land in a PUBLIC
 * storage bucket, so anyone with the URL could extract the exact coordinates
 * a video was shot at. On a location-based social app that is a real
 * exposure, and it was live in production.
 *
 * WHY NOT RE-ENCODE
 * The obvious approach — draw frames to a canvas and re-record via
 * MediaRecorder — CANNOT WORK ON iOS SAFARI: WebKit does not implement
 * HTMLMediaElement.captureStream(), which is the only way to feed a decoded
 * video into MediaRecorder. It would fail silently on the exact platform the
 * beta runs on, and where it does work it is roughly real-time, lossy, and
 * usually drops audio.
 *
 * WHAT THIS DOES INSTEAD
 * QuickTime files are a tree of boxes (size + fourCC + payload). All of the
 * offending metadata lives under `moov` in the `meta` and `udta` boxes. We
 * overwrite those boxes IN PLACE with a `free` box of identical length and a
 * zeroed payload.
 *
 * In place, and identical length, deliberately: `moov` precedes `mdat` in
 * iOS camera output, and `stco`/`co64` inside `moov` reference sample data by
 * ABSOLUTE FILE OFFSET. Removing bytes would shift `mdat` and silently
 * corrupt playback. `free` is the spec's own padding box and every decoder
 * skips it, so the file stays byte-for-byte the same length and every offset
 * stays valid. No frame is touched, so there is no quality loss and it runs
 * in milliseconds rather than minutes.
 *
 * FAIL CLOSED
 * Every parse inconsistency throws. A video we cannot confidently strip is
 * REJECTED, never uploaded as-is — a leak that only happens on unusual files
 * is worse than one that happens always, because nobody sees it.
 */

/** Metadata containers under `moov`. Removing these removes location, make, model, software and creation date together. */
const KILL_BOXES = new Set(["meta", "udta"]);

/** Strings that must not survive. Used for the post-strip verification pass. */
const FORBIDDEN = [
  "com.apple.quicktime.location",
  "com.apple.quicktime.make",
  "com.apple.quicktime.model",
  "com.apple.quicktime.software",
  "com.apple.quicktime.creationdate",
  "©xyz", // legacy Apple location atom
];

export class VideoStripError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoStripError";
  }
}

type Box = { type: string; start: number; size: number; headerSize: number };

/** Reads the boxes in [from, to). Throws on anything malformed. */
function readBoxes(view: DataView, from: number, to: number): Box[] {
  const boxes: Box[] = [];
  let offset = from;

  while (offset < to) {
    if (to - offset < 8) {
      throw new VideoStripError(`truncated box header at ${offset}`);
    }
    let size = view.getUint32(offset);
    let headerSize = 8;
    const type = String.fromCharCode(
      view.getUint8(offset + 4), view.getUint8(offset + 5),
      view.getUint8(offset + 6), view.getUint8(offset + 7)
    );

    if (size === 1) {
      // 64-bit extended size.
      if (to - offset < 16) throw new VideoStripError(`truncated large-size box at ${offset}`);
      const hi = view.getUint32(offset + 8);
      const lo = view.getUint32(offset + 12);
      size = hi * 2 ** 32 + lo;
      headerSize = 16;
    } else if (size === 0) {
      // Extends to end of file — only legal for the last box.
      size = to - offset;
    }

    if (size < headerSize || offset + size > to) {
      throw new VideoStripError(`box '${type}' at ${offset} has implausible size ${size}`);
    }

    boxes.push({ type, start: offset, size, headerSize });
    offset += size;
  }

  if (offset !== to) {
    throw new VideoStripError(`box walk ended at ${offset}, expected ${to}`);
  }
  return boxes;
}

/** Overwrites a box with an equally-sized `free` box and a zeroed payload. */
function blankBox(bytes: Uint8Array, view: DataView, box: Box) {
  // Keep the original size field; only the type and payload change.
  view.setUint8(box.start + 4, 0x66); // f
  view.setUint8(box.start + 5, 0x72); // r
  view.setUint8(box.start + 6, 0x65); // e
  view.setUint8(box.start + 7, 0x65); // e
  bytes.fill(0, box.start + box.headerSize, box.start + box.size);
}

/**
 * Returns a new File with metadata removed.
 * Throws VideoStripError if the file cannot be parsed with confidence, or if
 * the verification pass still finds identifying keys.
 */
export async function stripVideoMetadata(file: File): Promise<File> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  const top = readBoxes(view, 0, bytes.length);
  const moov = top.find((b) => b.type === "moov");
  if (!moov) {
    throw new VideoStripError("no 'moov' box — not a QuickTime/MP4 file we recognise");
  }

  let removed = 0;
  for (const child of readBoxes(view, moov.start + moov.headerSize, moov.start + moov.size)) {
    if (KILL_BOXES.has(child.type)) {
      blankBox(bytes, view, child);
      removed++;
    }
  }

  // VERIFY BY RE-READING, not by trusting the write. Same discipline as the
  // backup restore rehearsal: an unverified strip is not a strip.
  const reparsed = readBoxes(view, 0, bytes.length);
  if (!reparsed.find((b) => b.type === "moov")) {
    throw new VideoStripError("verification failed: file no longer parses after strip");
  }

  const haystack = new TextDecoder("latin1").decode(bytes);
  const survivors = FORBIDDEN.filter((needle) => haystack.includes(needle));
  if (survivors.length > 0) {
    throw new VideoStripError(
      `verification failed: metadata still present after strip (${survivors.join(", ")})`
    );
  }

  if (bytes.length !== file.size) {
    throw new VideoStripError("verification failed: output length changed, offsets would be invalid");
  }

  return new File([bytes], file.name, {
    type: file.type,
    lastModified: Date.now(), // not the original capture time
  });
}

/** Exposed for tests. */
export const __testing = { readBoxes, FORBIDDEN, removedBoxTypes: KILL_BOXES };
