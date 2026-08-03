"use client";

import { useEffect, useState } from "react";
import CommentsSheet, { type SheetComment } from "../../customer/components/CommentsSheet";

/* Fixed at module load, outside the component: a clock read during render is
   impure, and the exact timestamps are irrelevant to what this probe tests. */
const SAMPLE: SheetComment[] = Array.from({ length: 14 }, (_, i) => ({
  id: `c${i}`,
  body:
    i % 3 === 0
      ? "Went last week on your recommendation — the corner table is genuinely the good one."
      : `Comment number ${i + 1}, long enough to make the list scroll.`,
  created_at: new Date(1785600000000 - i * 3600_000).toISOString(),
  is_own: false,
  author: {
    profile_id: `p${i}`,
    display_name: ["Mara Ellison", "Devon Park", "Ilse Bergman", "Ray Okonkwo"][i % 4],
    avatar_url: null,
  },
}));

/**
 * Keyboard probe for the comments sheet. Dev-only route.
 *
 * The thing that needs checking on a REAL iPhone is not whether the sheet
 * renders — it is whether the composer is still reachable with the keyboard up.
 * `100vh` does not shrink when iOS raises the keyboard, so a sheet sized to it
 * extends underneath and takes the docked input with it. This page shows the
 * live viewport numbers next to the sheet so the failure is visible as numbers
 * rather than as a vague "it feels wrong".
 *
 * WHAT GOOD LOOKS LIKE, with the keyboard open:
 *   · visual < layout   — the keyboard is being reported at all
 *   · the input stays visible above the keyboard
 *   · the list scrolls behind it and never carries it away
 */
export default function CommentsTestPage() {
  const [open, setOpen] = useState(false);
  const [vv, setVv] = useState<{ h: number; top: number } | null>(null);
  const [layout, setLayout] = useState(0);

  useEffect(() => {
    const read = () => {
      setLayout(window.innerHeight);
      const v = window.visualViewport;
      setVv(v ? { h: Math.round(v.height), top: Math.round(v.offsetTop) } : null);
    };
    read();
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    window.visualViewport?.addEventListener("scroll", read);
    return () => {
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("scroll", read);
    };
  }, []);


  return (
    <main className="mx-auto max-w-lg p-6 font-mono text-sm">
      <h1 className="mb-1 text-lg font-semibold">Comments sheet — keyboard probe</h1>
      <p className="mb-4 text-xs opacity-70">
        Open the sheet, tap the input, and check the input is still visible.
      </p>

      <pre className="mb-4 whitespace-pre-wrap rounded bg-black/5 p-3 text-xs">
        {[
          `layout  (innerHeight): ${layout}`,
          `visual  (viewport.h) : ${vv ? vv.h : "unsupported"}`,
          `visual offsetTop     : ${vv ? vv.top : "—"}`,
          `keyboard inferred    : ${vv ? Math.max(0, layout - vv.h) : "—"}px`,
        ].join("\n")}
      </pre>

      <button onClick={() => setOpen(true)} className="rounded border px-3 py-2">
        Open comments sheet
      </button>

      {open && (
        <CommentsSheet
          postId="dev-probe"
          initialComments={SAMPLE}
          onClose={() => setOpen(false)}
        />
      )}
    </main>
  );
}
