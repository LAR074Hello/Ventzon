"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RepAuthPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    // Verify they're actually a rep
    const res = await fetch("/api/rep/profile");
    if (!res.ok) {
      await supabase.auth.signOut();
      setError("This account doesn't have rep access. Contact Luke if this is a mistake.");
      setLoading(false);
      return;
    }

    router.replace("/rep/home");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-light tracking-[0.4em] text-[#555]">VENTZON</p>
          <h1 className="mt-3 text-[28px] font-extralight text-[#ededed]">Rep Portal</h1>
          <p className="mt-2 text-[13px] font-light text-[#555]">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444] focus:border-[#555] disabled:opacity-40"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full rounded-xl border border-[#333] bg-[#0d0d0d] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#444] focus:border-[#555] disabled:opacity-40"
          />

          {error && (
            <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-[13px] font-light text-red-300/80">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-200 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
          >
            {loading ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] font-light text-[#444]">
          Don't have an account? You need an invite from Luke.
        </p>
      </div>
    </main>
  );
}
