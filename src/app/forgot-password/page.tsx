"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <main className="flex min-h-screen items-center justify-center bg-night-950 px-6 pt-24 pb-12">
      <div className="w-full max-w-md animate-fade-in opacity-0 anim-delay-200">
        {/* Header */}
        <p className="text-[11px] font-light tracking-[0.3em] text-fog-500">
          ACCOUNT RECOVERY
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-fog-100 sm:text-5xl">
          Reset password
        </h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-fog-500">
          Enter your email and we&rsquo;ll send you a link to reset your
          password.
        </p>

        {/* Success / Form */}
        {sent ? (
          <div className="mt-10 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-5 py-5 text-[13px] font-light leading-relaxed text-emerald-300/80">
            Check your email for a password reset link. It may take a minute
            to arrive.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-fog-500">
                EMAIL
              </label>
              <input
                className="w-full rounded-lg border border-night-700 bg-night-900 px-4 py-3.5 text-[14px] font-light text-fog-100 outline-none transition-colors duration-300 placeholder:text-fog-600 hover:border-night-600 focus:border-night-600"
                placeholder="you@example.com"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {err && (
              <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3.5 text-[13px] font-light text-red-300/80">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="mt-1 w-full rounded-full border border-fog-100 py-3.5 text-[12px] font-light tracking-[0.15em] text-fog-100 transition-all duration-500 hover:bg-fog-100 hover:text-black disabled:opacity-40"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[12px] font-light tracking-[0.05em] text-fog-600 transition-colors duration-300 hover:text-fog-100"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
