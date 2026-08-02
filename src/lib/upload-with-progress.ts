/**
 * Storage upload with real progress and a working cancel.
 *
 * WHY NOT `supabase.storage.upload()`. The installed storage-js (2.99.2)
 * accepts `cacheControl, contentType, upsert, duplex, metadata, headers` and
 * nothing else — no progress callback, no AbortSignal. `fetch` cannot report
 * request upload progress either. XMLHttpRequest is the only browser API that
 * exposes `upload.onprogress`, and it is the only one with an `abort()` that
 * actually stops bytes leaving the device. This is not a preference.
 *
 * THE WIRE FORMAT IS COPIED FROM storage-js, NOT GUESSED. For a Blob/File in a
 * browser it POSTs multipart to `{url}/object/{bucket}/{path}` with a
 * `cacheControl` field and the file appended under the EMPTY-STRING field name
 * (`body.append("", file)`), plus `x-upsert`. That empty field name is load
 * bearing and looks like a bug; it is what the server expects.
 *
 * Content-Type is deliberately not set — the browser must generate the
 * multipart boundary itself.
 */

export type UploadOutcome =
  | { ok: true }
  | { ok: false; canceled: true }
  | { ok: false; canceled: false; error: string };

export type RunningUpload = {
  done: Promise<UploadOutcome>;
  /** Stops the request in flight. Resolves `done` with canceled: true. */
  cancel: () => void;
};

export function uploadWithProgress(opts: {
  /** Project URL, e.g. https://ref.supabase.co */
  supabaseUrl: string;
  bucket: string;
  path: string;
  file: File;
  /** The signed-in user's access token — RLS applies exactly as it does to the SDK. */
  accessToken: string;
  anonKey: string;
  upsert?: boolean;
  cacheControl?: string;
  /** 0..1. Fires only while bytes are actually moving. */
  onProgress?: (fraction: number) => void;
}): RunningUpload {
  const xhr = new XMLHttpRequest();
  let canceled = false;

  const done = new Promise<UploadOutcome>((resolve) => {
    const endpoint =
      `${opts.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/` +
      `${opts.bucket}/${opts.path}`;

    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${opts.accessToken}`);
    xhr.setRequestHeader("apikey", opts.anonKey);
    xhr.setRequestHeader("x-upsert", String(opts.upsert ?? true));

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      opts.onProgress?.(Math.min(1, e.loaded / e.total));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        opts.onProgress?.(1);
        resolve({ ok: true });
        return;
      }
      let message = `Upload failed (HTTP ${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        if (parsed?.message) message = parsed.message;
      } catch {
        /* a non-JSON body is not worth surfacing raw */
      }
      resolve({ ok: false, canceled: false, error: message });
    };

    // A cancel lands here too, so `canceled` disambiguates rather than
    // reporting a deliberate stop as a network failure.
    xhr.onerror = () =>
      resolve(
        canceled
          ? { ok: false, canceled: true }
          : { ok: false, canceled: false, error: "Network error during upload" }
      );
    xhr.onabort = () => resolve({ ok: false, canceled: true });
    xhr.ontimeout = () =>
      resolve({ ok: false, canceled: false, error: "Upload timed out" });

    const body = new FormData();
    body.append("cacheControl", opts.cacheControl ?? "3600");
    body.append("", opts.file);
    xhr.send(body);
  });

  return {
    done,
    cancel: () => {
      canceled = true;
      xhr.abort();
    },
  };
}
