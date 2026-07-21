/**
 * Strip EXIF (including GPS) from an image before upload.
 *
 * Photos taken on a phone carry the exact coordinates where they were
 * shot — for a local-discovery app that often means someone's home.
 * Re-encoding through a canvas keeps only pixels: every metadata block
 * is dropped, because the browser writes a fresh file.
 *
 * Videos are returned untouched (browsers can't rewrite container
 * metadata client-side) — see the caller's note.
 */
export async function stripImageMetadata(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  // Nothing to strip in an SVG raster sense, and canvas would rasterize it.
  if (file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    // Cap the long edge — full-resolution phone photos are 4-6 MB for no
    // visible gain in a feed, and the resize is free here.
    const MAX_EDGE = 2048;
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // If anything fails, fall back to the original file rather than
    // blocking the post — but the caller should prefer this path.
    return file;
  }
}
