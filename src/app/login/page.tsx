"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

/* ── Check-email banner (shown after signup redirect) ── */
function CheckEmailBanner() {
  const params = useSearchParams();
  if (params.get("checkEmail") !== "1") return null;
  return (
    <div className="mb-8 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-5 py-4 text-[13px] font-light leading-relaxed text-emerald-300/80">
      Check your email to confirm your account, then sign in below.
    </div>
  );
}

/* ── Login form ── */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) return setErr(error.message);

    // If the middleware redirected here with a ?redirect param, go back there
    const redirectTo = searchParams?.get("redirect") || "/merchant/dashboard";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
          EMAIL
        </label>
        <input
          className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
          placeholder="you@example.com"
          autoComplete="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password */}
      <div>
        <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
          PASSWORD
        </label>
        <div className="relative">
          <input
            className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 pr-12 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] transition-colors duration-300 hover:text-[#888]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3.5 text-[13px] font-light text-red-300/80">
          {err}
        </div>
      )}

      {/* Submit */}
      <button
        disabled={loading}
        className="mt-1 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

/* ── Page ── */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-md animate-fade-in opacity-0 anim-delay-200">
        {/* Header */}
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          SIGN IN
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
          Welcome back
        </h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-[#555]">
          Sign in to your merchant account to manage your loyalty program.
        </p>

        {/* Form */}
        <div className="mt-10">
          <Suspense>
            <CheckEmailBanner />
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            href="/forgot-password"
            className="text-[12px] font-light tracking-[0.05em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            Forgot password?
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-[12px] font-light tracking-[0.05em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            Create account
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}
