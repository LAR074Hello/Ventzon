"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Eye, EyeOff, Check } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase redirects here with a hash fragment containing the access token.
  // The browser client picks it up automatically via onAuthStateChange.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (e.g. hash was already processed)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  /* ── Password validation ── */
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirm && confirm.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!passwordValid) {
      setErr("Password doesn\u2019t meet the requirements below.");
      return;
    }

    if (password !== confirm) {
      setErr("Passwords don\u2019t match.");
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
    <main className="flex min-h-screen items-center justify-center bg-black px-6 pt-24 pb-12">
      <div className="w-full max-w-md animate-fade-in opacity-0 anim-delay-200">
        {/* Header */}
        <p className="text-[11px] font-light tracking-[0.3em] text-[#555]">
          ACCOUNT RECOVERY
        </p>
        <h1 className="mt-4 text-4xl font-extralight tracking-[-0.02em] text-[#ededed] sm:text-5xl">
          New password
        </h1>

        {/* Success state */}
        {success ? (
          <div className="mt-10 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-5 py-5 text-[13px] font-light leading-relaxed text-emerald-300/80">
            Password updated successfully. Redirecting to your dashboard…
          </div>
        ) : /* Loading state */ !ready ? (
          <p className="mt-10 text-[14px] font-light leading-relaxed text-[#555]">
            Loading… If this takes more than a few seconds, try clicking the
            reset link in your email again.
          </p>
        ) : (
          /* Form */
          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            {/* New password */}
            <div>
              <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
                NEW PASSWORD
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

            {/* Confirm password */}
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
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
              {confirm.length > 0 && (
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
                          req.met
                            ? "bg-emerald-500/20"
                            : "bg-[#1a1a1a]"
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

            {/* Submit */}
            <button
              disabled={loading}
              className="mt-1 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-40"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
