"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function GetStartedPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const origin = window.location.origin;

      const signUpRes = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // After the user clicks the email confirmation link, send them back
          // through our auth callback so the session is established, then
          // forward them to onboarding.
          emailRedirectTo: `${origin}/auth/callback?next=/get-started`,
        },
      });

      if (signUpRes.error) throw signUpRes.error;

      // If no session, the user needs to confirm the email. Tell them to check
      // their inbox. After they confirm, they will be redirected back and can
      // continue onboarding.
      if (!signUpRes.data.session) {
        setError("Check your email to confirm your account, then come back here to continue.");
        return;
      }

      // 2) Create shop via API (server handles slug + membership)
      const resp = await fetch("/api/merchant/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error ?? "Failed to create shop");

      // 3) Send to pricing
      router.push(`/pricing?shop=${encodeURIComponent(json.shopSlug)}`);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 text-white">
      <div className="text-xs uppercase tracking-[0.22em] text-white/60">
        Ventzon Rewards
      </div>

      <h1 className="mt-3 text-4xl font-semibold">
        Create your merchant account
      </h1>

      <p className="mt-3 text-white/70">
        Create your login and your first shop in one step.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
      >
        <label className="text-sm text-white/70">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        />

        <label className="mt-5 block text-sm text-white/70">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        />

        <label className="mt-5 block text-sm text-white/70">Shop name</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Govans Groceries"
          required
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
        />

        {error && (
          <div className="mt-5 rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-40"
        >
          {loading ? "Creating account..." : "Continue to plans"}
        </button>

        <div className="mt-4 text-xs text-white/50">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Log in
          </a>
        </div>
      </form>
    </main>
  );
}