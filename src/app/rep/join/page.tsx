"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { CheckCircle } from "lucide-react";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [invite, setInvite] = useState<{ email: string; full_name: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setInviteError("No invite token found."); setLoading(false); return; }
    fetch(`/api/rep/invite?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setInviteError(d.error);
        else setInvite(d.invite);
      })
      .catch(() => setInviteError("Failed to validate invite."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setSubmitting(true);
    const res = await fetch("/api/rep/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setSubmitting(false); return; }

    // Sign in
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithPassword({ email: invite!.email, password });
    setDone(true);
    setTimeout(() => router.replace("/rep/home"), 2000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border border-[#333] border-t-[#ededed]" />
      </main>
    );
  }

  if (inviteError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-[13px] font-light text-red-400">{inviteError}</p>
        <p className="mt-3 text-[12px] font-light text-[#555]">Contact your Ventzon manager for a new invite link.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-400" />
        <h1 className="mt-5 text-[22px] font-extralight text-[#ededed]">You're in.</h1>
        <p className="mt-2 text-[13px] font-light text-[#555]">Taking you to your dashboard…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#555]">VENTZON REP PORTAL</p>
          <h1 className="mt-3 text-[28px] font-extralight text-[#ededed]">Welcome, {invite?.full_name.split(" ")[0]}</h1>
          <p className="mt-2 text-[13px] font-light text-[#555]">Set your password to activate your account</p>
        </div>

        <div className="mb-6 rounded-xl border border-[#1a1a1a] bg-[#080808] px-4 py-3">
          <p className="text-[11px] font-light tracking-[0.2em] text-[#555]">SIGNING IN AS</p>
          <p className="mt-1 text-[14px] font-light text-[#ededed]">{invite?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444] focus:border-[#555] disabled:opacity-40"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444] focus:border-[#555] disabled:opacity-40"
          />

          {error && (
            <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-[13px] font-light text-red-300/80">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-200 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
          >
            {submitting ? "ACTIVATING…" : "ACTIVATE ACCOUNT"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border border-[#333] border-t-[#ededed]" />
      </main>
    }>
      <JoinForm />
    </Suspense>
  );
}
