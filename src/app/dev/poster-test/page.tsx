"use client";

import { useState } from "react";
import { capturePosterFrame } from "@/lib/poster-frame";

/**
 * WebKit probe for poster-frame capture. Dev-only route.
 *
 * The metadata strip already taught us that "it works on my machine" is not a
 * finding on this platform: a canvas + MediaRecorder re-encode was rejected
 * because iOS Safari does not implement `captureStream()`, and that would have
 * failed silently on exactly the devices the beta runs on.
 *
 * `drawImage(video, …)` is a different API with a different history, so it very
 * likely works — but "very likely" is what the last one looked like too. This
 * page runs the real capture on the real engine and reports what happened.
 */
export default function PosterTestPage() {
  const [log, setLog] = useState<string[]>([]);
  const [poster, setPoster] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const say = (s: string) => setLog((l) => [...l, s]);

  async function run(file: File) {
    setBusy(true);
    setPoster(null);
    setLog([]);
    say(`file: ${file.name} ${(file.size / 1024 / 1024).toFixed(1)} MB ${file.type || "(no type)"}`);
    const t0 = performance.now();
    try {
      const result = await capturePosterFrame(file);
      const ms = Math.round(performance.now() - t0);
      if (!result) {
        say(`RESULT: null after ${ms} ms — capture unavailable on this engine`);
      } else {
        say(`RESULT: OK in ${ms} ms`);
        say(`poster: ${(result.blob.size / 1024).toFixed(0)} KB, ${result.width}x${result.height}`);
        setPoster(URL.createObjectURL(result.blob));
      }
    } catch (e) {
      const err = e as { name?: string; message?: string };
      say(`THREW: ${err?.name ?? "Error"} — ${err?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6 font-mono text-sm">
      <h1 className="mb-1 text-lg font-semibold">Poster frame — WebKit probe</h1>
      <p className="mb-4 text-xs opacity-70">
        Pick a video. This runs the real capturePosterFrame() used by the composer.
      </p>

      <input
        type="file"
        accept="video/*"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) run(f);
        }}
        className="mb-4 block w-full"
      />

      <button
        disabled={busy}
        onClick={async () => {
          const res = await fetch("/dev-fixtures/probe.mp4");
          if (!res.ok) return say(`no bundled fixture (HTTP ${res.status})`);
          run(new File([await res.blob()], "probe.mp4", { type: "video/mp4" }));
        }}
        className="mb-4 rounded border px-3 py-2"
      >
        Use bundled fixture
      </button>

      <pre className="whitespace-pre-wrap rounded bg-black/5 p-3 text-xs">
        {log.join("\n") || "(no run yet)"}
      </pre>

      {poster && (
        <div className="mt-4">
          <p className="mb-1 text-xs opacity-70">captured poster:</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from canvas.toBlob cannot go through next/image */}
          <img src={poster} alt="captured poster frame" className="w-full rounded border" />
        </div>
      )}
    </main>
  );
}
