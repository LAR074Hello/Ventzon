"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreHorizontal, Flag, Ban, X } from "lucide-react";

const REASONS = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "other", label: "Something else" },
] as const;

/**
 * Shared report/block menu (App Store UGC requirement). Renders a "⋯"
 * trigger; the sheet offers Report (with reasons) and Block. Reported
 * content is hidden immediately pending review; blocking is mutual
 * invisibility and severs follows.
 */
export default function SafetyMenu({
  targetType,
  targetId,
  blockProfileId,
  targetName,
  onDone,
  compact = false,
}: {
  targetType: "post" | "comment" | "profile";
  targetId: string;
  blockProfileId?: string | null;
  targetName?: string;
  onDone?: (action: "reported" | "blocked") => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "report" | "done-report" | "done-block">("menu");
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setMode("menu");
  }

  async function authFetch(url: string, body: unknown): Promise<boolean> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      router.push(`/customer/auth?redirect=${encodeURIComponent(pathname ?? "/customer/explore")}`);
      return false;
    }
    return res.ok;
  }

  async function report(reason: string) {
    if (busy) return;
    setBusy(true);
    const ok = await authFetch("/api/customer/report", {
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    setBusy(false);
    if (ok) {
      setMode("done-report");
      onDone?.("reported");
    }
  }

  async function block() {
    if (busy || !blockProfileId) return;
    setBusy(true);
    const ok = await authFetch("/api/customer/blocks", {
      profile_id: blockProfileId,
      block: true,
    });
    setBusy(false);
    if (ok) {
      setMode("done-block");
      onDone?.("blocked");
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={compact ? "p-1 text-muted active:text-ink" : "flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"}
        aria-label="More options"
      >
        <MoreHorizontal className={compact ? "h-4 w-4" : "h-4 w-4 text-muted"} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-black/60"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-t-sheet border-t border-line bg-surface px-5 pb-10 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-muted">
                {mode === "report" ? "WHY ARE YOU REPORTING THIS?" : (targetName ?? targetType).toUpperCase()}
              </p>
              <button onClick={close} className="p-1 text-muted" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {mode === "menu" && (
              <div className="space-y-2">
                <button
                  onClick={() => setMode("report")}
                  className="flex w-full items-center gap-3 rounded-ctl border border-line px-4 py-3.5 text-left text-[14px] font-medium text-ink active:bg-black/10"
                >
                  <Flag className="h-4 w-4 text-muted" />
                  Report {targetType}
                </button>
                {blockProfileId && (
                  <button
                    onClick={block}
                    disabled={busy}
                    className="flex w-full items-center gap-3 rounded-ctl border border-danger/30 px-4 py-3.5 text-left text-[14px] font-medium text-danger active:bg-danger/10 disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" />
                    Block {targetName ?? "this account"}
                  </button>
                )}
              </div>
            )}

            {mode === "report" && (
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => report(r.id)}
                    disabled={busy}
                    className="w-full rounded-ctl border border-line px-4 py-3.5 text-left text-[14px] font-medium text-ink active:bg-black/10 disabled:opacity-50"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {mode === "done-report" && (
              <div className="py-4 text-center">
                <p className="text-[15px] font-semibold text-ink">Thanks — report received</p>
                <p className="mt-2 text-[13px] font-normal leading-relaxed text-muted">
                  This content is hidden while we review it, usually within 24 hours.
                </p>
                <button onClick={close} className="mt-5 rounded-full bg-ink px-6 py-2.5 text-[12px] font-semibold tracking-[0.1em] text-bg">
                  DONE
                </button>
              </div>
            )}

            {mode === "done-block" && (
              <div className="py-4 text-center">
                <p className="text-[15px] font-semibold text-ink">Blocked</p>
                <p className="mt-2 text-[13px] font-normal leading-relaxed text-muted">
                  You won&rsquo;t see each other&rsquo;s posts, comments, or profiles.
                  Unblock any time in Settings.
                </p>
                <button onClick={close} className="mt-5 rounded-full bg-ink px-6 py-2.5 text-[12px] font-semibold tracking-[0.1em] text-bg">
                  DONE
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
