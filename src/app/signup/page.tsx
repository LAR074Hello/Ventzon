"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setInfo(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // After email confirmation, return into the app and continue onboarding.
        emailRedirectTo: `${origin}/auth/callback?next=/get-started`,
      },
    });

    setLoading(false);
    if (error) return setErr(error.message);

    // If email confirmation is enabled, Supabase may not return a session.
    // In that case, prompt the user to confirm their email.
    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session) {
      setInfo("Check your email to confirm your account. After confirming, you’ll be brought back here and can continue.");
      return;
    }

    // Otherwise, continue onboarding immediately.
    router.push("/get-started");
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-neutral-900 dark:text-white">
      <h1 className="text-3xl font-semibold">Create a merchant account</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">Use your email and a password.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
        />
        <input
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white dark:placeholder:text-neutral-500"
          placeholder="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {err && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-red-200">
            {err}
          </div>
        )}
        {info && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200">
            {info}
          </div>
        )}

        <button
          disabled={loading || !!info}
          className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </main>
  );
}