"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  /* ── Password validation ── */
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setInfo(null);

    if (!passwordValid) {
      setErr("Password doesn't meet the requirements below.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords don't match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/get-started`,
      },
    });

    setLoading(false);
    if (error) return setErr(
      error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")
        ? "An account with this email already exists. Try signing in instead."
        : error.message
    );

    // If email confirmation is enabled Supabase may not return a session.
    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session) {
      setInfo(
        "Check your email to confirm your account. After confirming, you\u2019ll be redirected to continue setup."
      );
      return;
    }

    router.push("/get-started");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-md animate-fade-in opacity-0 anim-delay-200">
        {/* Header */}
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          GET STARTED
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
          Create your account
        </h1>
        <p className="mt-4 text-[15px] font-light leading-relaxed text-[#555]">
          Set up your merchant account to launch your SMS loyalty program.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
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
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <input
                className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3.5 pr-12 text-[14px] font-light text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
                placeholder="••••••••"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#444] transition-colors duration-300 hover:text-[#888]"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <p
                className={`mt-2 text-[12px] font-light ${
                  passwordsMatch
                    ? "text-emerald-400/70"
                    : "text-red-400/70"
                }`}
              >
                {passwordsMatch
                  ? "Passwords match"
                  : "Passwords don\u2019t match"}
              </p>
            )}
          </div>

          {/* Password requirements */}
          {password.length > 0 && (
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]/50 px-4 py-3.5">
              <p className="mb-2.5 text-[11px] font-light tracking-[0.15em] text-[#444]">
                PASSWORD REQUIREMENTS
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { label: "8+ characters", met: passwordChecks.length },
                  {
                    label: "Uppercase letter",
                    met: passwordChecks.uppercase,
                  },
                  {
                    label: "Lowercase letter",
                    met: passwordChecks.lowercase,
                  },
                  { label: "Number", met: passwordChecks.number },
                ].map((req) => (
                  <div
                    key={req.label}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors duration-300 ${
                        req.met ? "bg-emerald-500/20" : "bg-[#1a1a1a]"
                      }`}
                    >
                      {req.met && (
                        <Check className="h-2 w-2 text-emerald-400" />
                      )}
                    </div>
                    <span
                      className={`text-[12px] font-light transition-colors duration-300 ${
                        req.met ? "text-[#888]" : "text-[#444]"
                      }`}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {err && (
            <div className="rounded-lg border border-red-900/30 bg-red-950/20 px-4 py-3.5 text-[13px] font-light text-red-300/80">
              {err}
            </div>
          )}

          {/* Info (email confirmation) */}
          {info && (
            <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-5 py-4 text-[13px] font-light leading-relaxed text-emerald-300/80">
              {info}
            </div>
          )}

          {/* Submit */}
          <button
            disabled={loading || !!info}
            className="mt-1 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[12px] font-light tracking-[0.05em] text-[#444] transition-colors duration-300 hover:text-[#ededed]"
          >
            Already have an account? Sign in
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}
