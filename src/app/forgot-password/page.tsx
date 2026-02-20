"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const origin = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${origin}/reset-password` }
    );

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-white">
      <h1 className="text-3xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-neutral-400">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {sent ? (
        <div className="mt-8 rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-4 py-4 text-sm text-emerald-200">
          Check your email for a password reset link. It may take a minute to arrive.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-white placeholder:text-neutral-500"
            placeholder="Email"
            autoComplete="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {err && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white py-3 font-medium text-black disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <div className="mt-6 text-sm text-neutral-500">
        <Link href="/login" className="underline hover:text-neutral-300">
          Back to login
        </Link>
      </div>
    </main>
  );
}
