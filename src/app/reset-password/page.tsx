"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase redirects here with a hash fragment containing the access token.
  // The browser client picks it up automatically via onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      }
    );

    // Also check if we already have a session (e.g. hash was already processed)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setErr("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/merchant/dashboard"), 2000);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-white">
      <h1 className="text-3xl font-semibold">Set new password</h1>

      {success ? (
        <div className="mt-8 rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-4 py-4 text-sm text-emerald-200">
          Password updated! Redirecting to your dashboard...
        </div>
      ) : !ready ? (
        <div className="mt-8 text-sm text-neutral-400">
          Loading... If this takes more than a few seconds, try clicking the
          reset link in your email again.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-white placeholder:text-neutral-500"
            placeholder="New password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-white placeholder:text-neutral-500"
            placeholder="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </main>
  );
}
