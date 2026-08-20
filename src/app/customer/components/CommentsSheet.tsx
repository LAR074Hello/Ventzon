"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Send, AlertCircle, RotateCw, Trash2 } from "lucide-react";
import Avatar from "./Avatar";
import SafetyMenu from "./SafetyMenu";

export type SheetComment = {
  id: string;
  body: string;
  created_at: string;
  is_own: boolean;
  author: {
    profile_id: string | null;
    linkable?: boolean;
    display_name: string;
    avatar_url: string | null;
  };
  /** Client-only, for optimistic rows. Absent means it came from the server. */
  status?: "sending" | "failed";
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * The height the sheet may actually occupy.
 *
 * `100vh` does NOT shrink when the iOS keyboard opens — the layout viewport
 * stays full height while the VISUAL viewport shrinks behind the keyboard. A
 * sheet sized to vh therefore extends under the keyboard, taking its docked
 * composer with it, which is precisely how sheet-based comments end up with an
 * unreachable input.
 *
 * `visualViewport` is the reliable signal on iOS Safari;
 * `env(keyboard-inset-height)` is not supported there. Falls back to
 * innerHeight where visualViewport is absent.
 */
function useViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const read = () => setHeight(vv ? vv.height : window.innerHeight);
    read();
    if (!vv) {
      window.addEventListener("resize", read);
      return () => window.removeEventListener("resize", read);
    }
    vv.addEventListener("resize", read);
    // iOS scrolls the visual viewport when the keyboard opens; without this the
    // sheet is the right SIZE but in the wrong PLACE.
    vv.addEventListener("scroll", read);
    return () => {
      vv.removeEventListener("resize", read);
      vv.removeEventListener("scroll", read);
    };
  }, []);

  return height;
}

export default function CommentsSheet({
  postId,
  initialComments,
  isPostAuthor = false,
  onClose,
  onCountChange,
}: {
  postId: string;
  initialComments: SheetComment[];
  isPostAuthor?: boolean;
  onClose: () => void;
  onCountChange?: (n: number) => void;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<SheetComment[]>(initialComments);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // Guards a comment send while one is in flight — rapid taps must not
  // create duplicates. The ref blocks synchronously; the state drives the
  // disabled Send button.
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);

  const viewportHeight = useViewportHeight();

  const scrollToNewest = useCallback((smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Newest on open. You are arriving to read what just happened and to reply,
  // not to re-read the oldest comment on the post.
  useLayoutEffect(() => {
    scrollToNewest(false);
  }, [scrollToNewest]);

  useEffect(() => {
    onCountChange?.(comments.filter((c) => c.status !== "failed").length);
  }, [comments, onCountChange]);

  async function send(text: string, replacingId?: string) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);

    // Clock read here, in the event handler, NOT inside the state updater — an
    // updater can be replayed during render, where reading the clock is impure.
    const now = new Date().toISOString();
    const tempId = replacingId ?? `pending-${now}`;

    // OPTIMISTIC: the comment exists on screen before the network is consulted.
    // Waiting for a round trip to find out whether your own sentence was
    // accepted is the difference between a conversation and a form submission.
    setComments((prev) => {
      const optimistic: SheetComment = {
        id: tempId,
        body: text,
        created_at: now,
        is_own: true,
        author: { profile_id: null, display_name: "You", avatar_url: null },
        status: "sending",
      };
      return replacingId
        ? prev.map((c) => (c.id === replacingId ? optimistic : c))
        : [...prev, optimistic];
    });
    requestAnimationFrame(() => scrollToNewest(true));

    try {
      const res = await fetch(`/api/customer/posts/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", body: text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Reconcile against the server rather than trusting the optimistic row:
      // the server assigns the real id, and the author's display name is
      // whatever their profile actually says, not the "You" placeholder.
      const fresh = await fetch(`/api/customer/posts/${postId}`).then((r) => r.json());
      setComments(fresh.comments ?? []);
    } catch {
      // Failure is shown WHERE the comment is, with the retry attached to it.
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? { ...c, status: "failed" } : c))
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text || sendingRef.current) return;
    setDraft("");
    send(text);
  }

  // Delete a comment — the comment's author, or the post's author (the API
  // allows both, mirroring the ownership check in the DELETE route).
  async function deleteComment(id: string) {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(
        `/api/customer/posts/${postId}?comment_id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  }

  const style = viewportHeight ? { height: `${Math.round(viewportHeight * 0.82)}px` } : undefined;

  return (
    <div className="fixed inset-0 z-[1200] flex flex-col justify-end">
      <button
        aria-label="Close comments"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 motion-safe:animate-[scrim-in_var(--dur)_var(--ease)]"
      />

      {/* h-[82vh] is the pre-hydration guess; the visual-viewport value replaces
          it as soon as it is known, and again whenever the keyboard moves. */}
      <div
        style={style}
        className="relative flex h-[82vh] flex-col overflow-hidden rounded-t-sheet bg-surface motion-safe:animate-[sheet-up_var(--dur)_var(--ease)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-subtle px-5 py-3.5">
          <span className="w-8" />
          <p className="font-display text-base font-semibold text-primary">
            {comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Comments"}
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full"
          >
            <X className="h-4 w-4 text-secondary" />
          </button>
        </div>

        {/* THE ONLY SCROLLING ELEMENT. The composer below is a sibling, not the
            last row of this list, so it cannot be scrolled away from. */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {comments.length === 0 ? (
            // An invitation, not an apology. "No comments yet" reports a
            // deficiency; this asks for something, which is the same rule the
            // empty place page follows.
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-display text-lg font-semibold text-primary">
                Be the first to say something
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                Been here? Say what it&apos;s like — that&apos;s what makes this
                place worth finding.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <button
                    onClick={() =>
                      c.author.linkable &&
                      c.author.profile_id &&
                      router.push(`/customer/creator/${c.author.profile_id}`)
                    }
                    disabled={!c.author.linkable || !c.author.profile_id}
                    className={c.status === "sending" ? "opacity-60" : ""}
                    aria-label={
                      c.author.linkable && c.author.profile_id
                        ? `View ${c.author.display_name}'s profile`
                        : undefined
                    }
                  >
                    <Avatar
                      name={c.author.display_name}
                      seed={c.author.profile_id ?? c.author.display_name}
                      url={c.author.avatar_url}
                      size={28}
                    />
                  </button>
                  <div className={`min-w-0 flex-1 ${c.status === "sending" ? "opacity-60" : ""}`}>
                    <p className="text-xs text-muted">
                      <button
                        onClick={() =>
                          c.author.linkable &&
                          c.author.profile_id &&
                          router.push(`/customer/creator/${c.author.profile_id}`)
                        }
                        disabled={!c.author.linkable || !c.author.profile_id}
                        className="font-medium text-primary"
                      >
                        {c.author.display_name}
                      </button>
                      {c.status !== "sending" && c.status !== "failed" && ` · ${timeAgo(c.created_at)}`}
                    </p>
                    <p className="mt-0.5 text-base leading-relaxed text-primary">{c.body}</p>

                    {c.status === "failed" && (
                      <button
                        onClick={() => send(c.body, c.id)}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-danger"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Didn&apos;t send
                        <span className="inline-flex items-center gap-1 underline underline-offset-2">
                          <RotateCw className="h-3 w-3" />
                          Retry
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Right-side actions: delete (own comment or post author) and
                      report/block (everyone else). Failed rows keep only the
                      retry button, and in-flight rows are left untouched. */}
                  {c.status !== "failed" && (
                    <div className="flex shrink-0 items-center gap-0.5 self-start">
                      {(c.is_own || isPostAuthor) && c.status !== "sending" && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          aria-label="Delete comment"
                          className="-m-1.5 p-2.5 text-muted active:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {!c.is_own && c.status !== "sending" && (
                        <SafetyMenu
                          compact
                          targetType="comment"
                          targetId={c.id}
                          blockProfileId={c.author.profile_id}
                          targetName={c.author.display_name}
                          onDone={(a) => {
                            // A reported comment is hidden server-side; drop it
                            // locally so it leaves the sheet now. A blocked
                            // commenter takes all their comments with them.
                            if (a === "reported") {
                              setComments((prev) => prev.filter((x) => x.id !== c.id));
                            }
                            if (a === "blocked" && c.author.profile_id) {
                              setComments((prev) =>
                                prev.filter((x) => x.author.profile_id !== c.author.profile_id)
                              );
                            }
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DOCKED. Outside the scroll container, above the safe-area inset. */}
        <div className="shrink-0 border-t border-subtle bg-surface px-4 pb-[env(safe-area-inset-bottom)] pt-2.5">
          <div className="mb-2.5 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              onFocus={() => setTimeout(() => scrollToNewest(true), 250)}
              placeholder="Add a comment…"
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border border-subtle bg-surface-raised px-4 py-2.5 text-base text-primary outline-none placeholder:text-muted"
            />
            <button
              onClick={submit}
              disabled={!draft.trim() || sending}
              aria-label="Send comment"

              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
