"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function CheckEmailBanner() {
  const params = useSearchParams();
  if (params.get("checkEmail") !== "1") return null;
  return (
    <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-200">
      Check your email to confirm your account, then log in.
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setErr(error.message);

    router.push("/merchant");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <input
        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3"
        placeholder="Email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3"
        placeholder="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {err && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-red-200">
          {err}
        </div>
      )}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-white py-3 font-medium text-black disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16 text-white">
      <h1 className="text-3xl font-semibold">Log in</h1>

      <Suspense>
        <CheckEmailBanner />
      </Suspense>

      <LoginForm />
    </main>
  );
}
