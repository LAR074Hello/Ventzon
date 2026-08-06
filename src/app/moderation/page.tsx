"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Preview = {
  text: string | null;
  media_url: string | null;
  author_email: string | null;
  author_profile_id: string | null;
  author_display_name: string | null;
  gone: boolean;
};

type Report = {
  id: string;
  reporter_email: string;
  target_type: "post" | "comment" | "profile";
  target_id: string;
  reason: string;
  created_at: string;
  preview: Preview;
};

type Banned = {
  id: string;
  email: string;
  display_name: string | null;
  banned_at: string;
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [banned, setBanned] = useState<Banned[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/moderation");
    if (res.status === 403) {
      setDenied(true);
      setLoading(false);
      return;
    }
    const data = await res.json().catch(() => null);
    if (!data?.reports) {
      setError("Failed to load the queue.");
      setLoading(false);
      return;
    }
    setReports(data.reports);
    setBanned(data.banned ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(key: string, body: unknown) {
    setBusy(key);
    setError(null);
    const res = await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok || !data?.ok) {
      setError(data?.hint ?? data?.error ?? "Action failed.");
      return;
    }
    await load();
  }

  if (denied) {
    return (
      <main className="min-h-screen bg-black px-6 pt-24 text-center text-[#ededed]">
        <p className="text-[11px] font-light tracking-[0.5em] text-[#555]">403</p>
        <h1 className="mt-4 text-2xl font-extralight">Not authorized</h1>
        <p className="mt-3 text-sm font-light text-[#666]">This page is only for Ventzon admins.</p>
        <Link href="/" className="mt-8 inline-block text-sm font-light text-[#999] underline underline-offset-4">
          &larr; Back
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 sm:px-8 py-20 text-[#ededed]">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-light tracking-[0.4em] text-[#888]">MODERATION</p>
            <h1 className="mt-3 text-3xl font-extralight">Report queue</h1>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-full border border-[#333] px-5 py-2 text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors hover:border-[#666] disabled:opacity-40"
          >
            {loading ? "…" : "REFRESH"}
          </button>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-[13px] font-light text-red-300/80">
            {error}
          </p>
        )}

        {/* Open reports */}
        <section className="mt-10">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#555]">
            OPEN REPORTS &middot; {reports.length}
          </p>
          {!loading && reports.length === 0 ? (
            <p className="mt-6 text-sm font-light text-[#555]">Nothing open. Good.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#1a1a1a] bg-[#080808] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-light uppercase tracking-[0.15em] text-[#555]">
                      {r.target_type} &middot; {r.reason} &middot; {timeAgo(r.created_at)}
                    </p>
                    <p className="text-[11px] font-light text-[#444]">by {r.reporter_email}</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-[#0f0f0f] p-3">
                    {r.preview.gone ? (
                      <p className="text-sm font-light text-[#555]">Content already gone.</p>
                    ) : (
                      <>
                        <p className="text-sm font-light text-[#ededed]">
                          {r.preview.text ?? `[${r.target_type} with media]`}
                        </p>
                        <p className="mt-1 text-xs font-light text-[#666]">
                          author: {r.preview.author_display_name ?? r.preview.author_email ?? "unknown"}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => act(`dismiss-${r.id}`, { action: "dismiss", report_id: r.id })}
                      disabled={busy !== null}
                      className="rounded-full border border-[#333] px-4 py-1.5 text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors hover:border-[#666] disabled:opacity-40"
                    >
                      DISMISS
                    </button>
                    {r.target_type === "post" && (
                      <button
                        onClick={() => act(`remove-${r.id}`, { action: "remove_post", post_id: r.target_id })}
                        disabled={busy !== null}
                        className="rounded-full border border-red-900/50 px-4 py-1.5 text-[11px] font-light tracking-[0.15em] text-red-300/80 transition-colors hover:border-red-500 disabled:opacity-40"
                      >
                        REMOVE POST
                      </button>
                    )}
                    {r.target_type === "comment" && (
                      <button
                        onClick={() => act(`remove-${r.id}`, { action: "remove_comment", comment_id: r.target_id })}
                        disabled={busy !== null}
                        className="rounded-full border border-red-900/50 px-4 py-1.5 text-[11px] font-light tracking-[0.15em] text-red-300/80 transition-colors hover:border-red-500 disabled:opacity-40"
                      >
                        REMOVE COMMENT
                      </button>
                    )}
                    {r.preview.author_profile_id && (
                      <button
                        onClick={() => act(`ban-${r.id}`, { action: "ban", profile_id: r.preview.author_profile_id })}
                        disabled={busy !== null}
                        className="rounded-full border border-red-900/50 px-4 py-1.5 text-[11px] font-light tracking-[0.15em] text-red-400 transition-colors hover:border-red-500 disabled:opacity-40"
                      >
                        BAN AUTHOR
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* Banned users */}
        <section className="mt-14">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#555]">
            BANNED &middot; {banned.length}
          </p>
          {!loading && banned.length === 0 ? (
            <p className="mt-6 text-sm font-light text-[#555]">No one banned.</p>
          ) : (
            <div className="mt-6 space-y-2">
              {banned.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-light text-[#ededed]">{b.display_name ?? b.email}</p>
                    <p className="text-xs font-light text-[#666]">
                      {b.email} &middot; banned {timeAgo(b.banned_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => act(`unban-${b.id}`, { action: "unban", profile_id: b.id })}
                    disabled={busy !== null}
                    className="rounded-full border border-[#333] px-4 py-1.5 text-[11px] font-light tracking-[0.15em] text-[#999] transition-colors hover:border-[#666] disabled:opacity-40"
                  >
                    UNBAN
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="mt-16 text-center text-[11px] font-light text-[#444]">
          Removing content is immediate and permanent. Banning hides all of a
          user&rsquo;s content until they are unbanned.
        </p>
      </div>
    </main>
  );
}

