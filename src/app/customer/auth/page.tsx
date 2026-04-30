"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Suspense } from "react";
import { Capacitor } from "@capacitor/core";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") ?? "/customer/home";

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(redirectTo);
    });

    if (Capacitor.isNativePlatform()) {
      Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
      ]).then(([{ App }, { Browser }]) => {
        const listener = App.addListener("appUrlOpen", async ({ url }) => {
          if (url.includes("auth/callback")) {
            const urlObj = new URL(url);
            const code = urlObj.searchParams.get("code");
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
            }
            await Browser.close();
            router.replace(redirectTo);
          }
        });
        return () => { listener.then((l) => l.remove()); };
      });
    }
  }, []);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setErr("Passwords don't match");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/customer/auth/callback`,
          },
        });
        if (error) throw error;
        setInfo("Check your email for a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        router.replace(redirectTo);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/customer/auth/callback`,
        }
      );
      if (error) throw error;
      setInfo("Password reset link sent — check your email.");
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setErr(null);
    setLoading(true);
    try {
      const isNative = Capacitor.isNativePlatform();
      const callbackUrl = isNative
        ? "com.ventzon.app://auth/callback"
        : `${window.location.origin}/customer/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: isNative,
        },
      });
      if (error) throw error;

      if (isNative && data.url) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url, windowName: "_self" });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  async function handleApple() {
    setErr(null);
    setLoading(true);
    try {
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const result = await SignInWithApple.authorize({
        clientId: "com.ventzon.app",
        redirectURI: "com.ventzon.app://auth/callback",
        scopes: "email name",
      });
      const { identityToken, givenName, familyName } = result.response;
      if (!identityToken) throw new Error("No identity token returned from Apple");

      const fullName = [givenName, familyName].filter(Boolean).join(" ") || undefined;

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });
      if (error) throw error;
      // Apple only provides the name on the very first sign-in
      if (fullName) {
        await supabase.auth.updateUser({ data: { full_name: fullName } });
      }
      router.replace(redirectTo);
    } catch (e: any) {
      if (e?.message?.includes("cancelled") || e?.message?.includes("canceled") || e?.code === "1001") {
        setLoading(false);
        return;
      }
      setErr(e?.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Top branding area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-8">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-2xl font-extralight tracking-tight text-[#ededed]">V</span>
          </div>
          <p className="mt-4 text-[11px] font-light tracking-[0.5em] text-[#ededed]">VENTZON</p>
          <p className="mt-2 text-[13px] font-light text-[#444]">Unbridled Loyalty</p>
        </div>

        <div className="w-full max-w-sm">

          {/* ── FORGOT PASSWORD MODE ── */}
          {mode === "forgot" ? (
            <>
              <p className="mb-6 text-center text-[13px] font-light text-[#555]">
                Enter your email and we&apos;ll send a reset link
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#2a2a2a]"
                />
                {err && (
                  <div className="rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3.5 text-[13px] font-light text-red-300/80">
                    {err}
                  </div>
                )}
                {info && (
                  <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/20 px-4 py-3.5 text-[13px] font-light text-emerald-300/80">
                    {info}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-light tracking-[0.2em] text-black transition-all duration-200 active:bg-[#d0d0d0] disabled:opacity-40"
                >
                  {loading ? "…" : "SEND RESET LINK"}
                </button>
              </form>
              <button
                onClick={() => { setMode("signin"); setErr(null); setInfo(null); }}
                className="mt-5 w-full text-center text-[12px] font-light text-[#444] transition-colors active:text-[#888]"
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              <p className="mb-6 text-center text-[13px] font-light text-[#555]">
                {mode === "signin" ? "Sign in to track your rewards" : "Create your rewards account"}
              </p>

              {/* Apple — only shown on native iOS */}
              {isNative && (
                <>
                  <button
                    onClick={handleApple}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#ededed] py-4 text-[14px] font-light text-black transition-colors duration-200 active:bg-[#d0d0d0] disabled:opacity-40"
                  >
                    <AppleIcon />
                    Continue with Apple
                  </button>
                  <div className="mt-3" />
                </>
              )}

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0a0a0a] py-4 text-[14px] font-light text-[#ededed] transition-colors duration-200 active:bg-[#111] disabled:opacity-40"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#1a1a1a]" />
                <span className="text-[11px] font-light tracking-[0.2em] text-[#333]">OR</span>
                <div className="h-px flex-1 bg-[#1a1a1a]" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === "signup" && (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#2a2a2a]"
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#2a2a2a]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={6}
                  className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#2a2a2a]"
                />
                {mode === "signup" && (
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className="w-full rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-[14px] font-light text-[#ededed] outline-none placeholder:text-[#333] focus:border-[#2a2a2a]"
                  />
                )}

                {err && (
                  <div className="rounded-2xl border border-red-900/30 bg-red-950/20 px-4 py-3.5 text-[13px] font-light text-red-300/80">
                    {err}
                  </div>
                )}
                {info && (
                  <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/20 px-4 py-3.5 text-[13px] font-light text-emerald-300/80">
                    {info}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#ededed] py-4 text-[13px] font-light tracking-[0.2em] text-black transition-all duration-200 active:bg-[#d0d0d0] disabled:opacity-40"
                >
                  {loading ? "…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
                </button>
              </form>

              {mode === "signin" && (
                <button
                  onClick={() => { setMode("forgot"); setErr(null); setInfo(null); }}
                  className="mt-3 w-full text-center text-[12px] font-light text-[#333] transition-colors active:text-[#555]"
                >
                  Forgot password?
                </button>
              )}

              <button
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setInfo(null); setConfirmPassword(""); }}
                className="mt-4 w-full text-center text-[12px] font-light text-[#444] transition-colors active:text-[#888]"
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <p className="text-[11px] font-light text-[#222]">
          By continuing you agree to our{" "}
          <a href="https://www.ventzon.com/terms" className="underline decoration-[#333] underline-offset-2">Terms</a>
          {" "}and{" "}
          <a href="https://www.ventzon.com/privacy" className="underline decoration-[#333] underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M12.27 0c.07.9-.26 1.79-.77 2.45-.52.68-1.34 1.21-2.17 1.15-.09-.85.28-1.74.77-2.36C10.62.58 11.48.07 12.27 0zm2.96 6.37c-.1.06-1.9 1.09-1.88 3.25.02 2.57 2.26 3.43 2.28 3.44-.02.07-.35 1.22-1.17 2.38-.71 1.02-1.46 2.03-2.6 2.05-1.11.02-1.47-.66-2.75-.66-1.27 0-1.67.64-2.73.68-1.1.04-1.93-1.1-2.65-2.11C2.1 13.3.97 10.32 1.99 8.27c.5-.99 1.4-1.62 2.37-1.63.99-.02 1.92.66 2.53.66.6 0 1.73-.82 2.92-.7.5.02 1.89.2 2.79 1.52l-.37.25z" fill="black"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.148 17.64 11.9 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
