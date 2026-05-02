"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/* ── Mock data ── */
const DEMO_SHOP = {
  name: "Sunrise Coffee",
  deal_title: "Free medium coffee after 8 visits",
  deal_details: "Any handcrafted drink, hot or iced",
};

type DemoResult = {
  status: "progress" | "reward";
  visits: number;
  goal: number;
  remaining: number;
  message: string;
};

/* ── Helpers ── */
function formatPhoneDisplay(value: string) {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

/* ── Progress dots ── */
function ProgressDots({ visits, goal }: { visits: number; goal: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: goal }).map((_, i) => (
        <div
          key={i}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500 ${
            i < visits
              ? "bg-[#ededed]"
              : "border border-[#333] bg-transparent"
          }`}
        >
          {i < visits && <Check className="h-3 w-3 text-black" />}
        </div>
      ))}
    </div>
  );
}

export default function DemoPage() {
  const [contactMethod, setContactMethod] = useState<"phone" | "email">("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [emailRaw, setEmailRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [scenario, setScenario] = useState<"progress" | "reward">("progress");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));

    if (scenario === "reward") {
      setResult({
        status: "reward",
        visits: 8,
        goal: 8,
        remaining: 0,
        message: "🎉 You earned a free coffee!",
      });
    } else {
      setResult({
        status: "progress",
        visits: 5,
        goal: 8,
        remaining: 3,
        message: "Checked in! 3 more visits to go.",
      });
    }

    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen flex-col bg-black">
      {/* Demo banner */}
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-center">
        <p className="text-[11px] font-light tracking-[0.15em] text-[#888]">
          DEMO &mdash; THIS IS A SAMPLE CUSTOMER EXPERIENCE
        </p>
        <p className="mt-1 text-[11px] font-light text-[#555]">
          No real data is sent. This shows what customers see when they check in via the app or QR code.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 pt-16 pb-8">
        {/* Logo placeholder */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
          <span className="text-2xl font-extralight text-[#555]">S</span>
        </div>

        {/* Shop name */}
        <h1 className="mt-5 text-[13px] font-light tracking-[0.3em] text-[#ededed]">
          {DEMO_SHOP.name.toUpperCase()}
        </h1>

        {/* Deal info */}
        {!result && (
          <div className="mt-6 rounded-lg border border-[#1a1a1a] px-5 py-3.5 text-center">
            <p className="text-[13px] font-light text-[#888]">
              {DEMO_SHOP.deal_title}
            </p>
            <p className="mt-1 text-[12px] font-light text-[#555]">
              {DEMO_SHOP.deal_details}
            </p>
          </div>
        )}

        {/* Scenario toggle (demo only) */}
        {!result && (
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScenario("progress")}
              className={`rounded-full px-4 py-1.5 text-[10px] font-light tracking-[0.1em] transition-all ${
                scenario === "progress"
                  ? "border border-[#ededed] text-[#ededed]"
                  : "border border-[#333] text-[#555]"
              }`}
            >
              PROGRESS
            </button>
            <button
              type="button"
              onClick={() => setScenario("reward")}
              className={`rounded-full px-4 py-1.5 text-[10px] font-light tracking-[0.1em] transition-all ${
                scenario === "reward"
                  ? "border border-emerald-500/50 text-emerald-400"
                  : "border border-[#333] text-[#555]"
              }`}
            >
              REWARD
            </button>
          </div>
        )}

        {/* ── Result state ── */}
        {result ? (
          <div className="mt-10 w-full max-w-sm animate-fade-in opacity-0">
            <div className="rounded-xl border border-[#1a1a1a] p-8 text-center">
              {result.status === "reward" ? (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
                  <span className="font-mono text-[18px] font-light text-[#ededed]">
                    {result.visits}
                  </span>
                </div>
              )}

              <p className="mt-5 text-[16px] font-extralight text-[#ededed]">
                {result.message}
              </p>

              <div className="mt-6">
                <ProgressDots visits={result.visits} goal={result.goal} />
              </div>

              <p className="mt-5 text-[12px] font-light tracking-[0.1em] text-[#555]">
                {result.visits}/{result.goal} visits
                {result.remaining > 0 && (
                  <span>
                    {" "}&middot;{" "}
                    {result.remaining} to go
                  </span>
                )}
              </p>

              {result.status === "reward" && (
                <div className="mt-6 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3.5">
                  <p className="text-[12px] font-light tracking-[0.15em] text-emerald-300/80">
                    SHOW THIS TO THE CASHIER TO REDEEM
                  </p>
                </div>
              )}

              {result.status !== "reward" && (
                <p className="mt-4 text-[11px] font-light text-[#444]">
                  1 check-in per day &middot; Progress resets after redeem
                </p>
              )}

              <button
                onClick={() => {
                  setResult(null);
                  setPhoneRaw("");
                  setEmailRaw("");
                }}
                className="mt-8 w-full rounded-full border border-[#ededed] py-3.5 text-[12px] font-light tracking-[0.15em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ── Check-in form ── */
          <form
            onSubmit={onSubmit}
            className="mt-10 w-full max-w-sm animate-fade-in opacity-0 anim-delay-200"
          >
            <div className="mb-6 flex items-center justify-center gap-1 rounded-full border border-[#1a1a1a] p-1">
              <button
                type="button"
                onClick={() => setContactMethod("phone")}
                className={`flex-1 rounded-full py-2.5 text-[11px] font-light tracking-[0.15em] transition-all duration-300 ${
                  contactMethod === "phone"
                    ? "bg-[#ededed] text-black"
                    : "text-[#555] hover:text-[#ededed]"
                }`}
              >
                PHONE
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("email")}
                className={`flex-1 rounded-full py-2.5 text-[11px] font-light tracking-[0.15em] transition-all duration-300 ${
                  contactMethod === "email"
                    ? "bg-[#ededed] text-black"
                    : "text-[#555] hover:text-[#ededed]"
                }`}
              >
                EMAIL
              </button>
            </div>

            <div>
              {contactMethod === "phone" ? (
                <>
                  <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
                    PHONE NUMBER
                  </label>
                  <input
                    type="tel"
                    value={phoneRaw}
                    onChange={(e) =>
                      setPhoneRaw(formatPhoneDisplay(e.target.value))
                    }
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-center text-[18px] font-light tracking-[0.05em] text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
                    disabled={submitting}
                  />
                </>
              ) : (
                <>
                  <label className="mb-2 block text-[11px] font-light tracking-[0.2em] text-[#555]">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={emailRaw}
                    onChange={(e) => setEmailRaw(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-4 text-center text-[18px] font-light tracking-[0.05em] text-[#ededed] outline-none transition-colors duration-300 placeholder:text-[#333] hover:border-[#333] focus:border-[#444]"
                    disabled={submitting}
                  />
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || (contactMethod === "phone" ? !phoneRaw.trim() : !emailRaw.trim())}
              className="mt-6 w-full rounded-full border border-[#ededed] py-4 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-500 hover:bg-[#ededed] hover:text-black disabled:opacity-30"
            >
              {submitting ? "CHECKING IN\u2026" : "CHECK IN"}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 pb-8 pt-4">
        <p className="text-center text-[11px] font-light leading-relaxed text-[#444]">
          By checking in you agree to receive reward notifications.
          <br />
          {"Unsubscribe or disable notifications anytime."}
        </p>
      </div>

      {/* How it works */}
      <div className="border-t border-[#1a1a1a] px-6 py-10">
        <div className="mx-auto max-w-lg">
          <h2 className="text-center text-[11px] font-light tracking-[0.3em] text-[#555]">
            HOW VENTZON WORKS
          </h2>

          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-[#1a1a1a] p-5">
              <p className="text-[12px] font-light tracking-[0.1em] text-[#ededed]">
                1. SCAN &amp; CHECK IN
              </p>
              <p className="mt-2 text-[12px] font-light text-[#555]">
                Customers scan a QR code at the register and enter their phone number or email to check in.
              </p>
            </div>

            <div className="rounded-lg border border-[#1a1a1a] p-5">
              <p className="text-[12px] font-light tracking-[0.1em] text-[#ededed]">
                2. TRACK PROGRESS
              </p>
              <p className="mt-2 text-[12px] font-light text-[#555]">
                Stamps accumulate with each check-in. Customers can view their progress in the Ventzon app or on the check-in page.
              </p>
            </div>

            <div className="rounded-lg border border-[#1a1a1a] p-5">
              <p className="text-[12px] font-light tracking-[0.1em] text-[#ededed]">
                3. EARN REWARDS
              </p>
              <p className="mt-2 text-[12px] font-light text-[#555]">
                When the visit goal is reached, the customer unlocks their reward in the app and shows it to the cashier to redeem.
              </p>
            </div>

            <div className="rounded-lg border border-[#1a1a1a] p-5">
              <p className="text-[12px] font-light tracking-[0.1em] text-[#ededed]">
                4. PUSH NOTIFICATIONS
              </p>
              <p className="mt-2 text-[12px] font-light text-[#555]">
                App users receive push notifications when they earn rewards or are one visit away. No SMS required.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-5">
            <p className="text-[11px] font-light tracking-[0.1em] text-[#888]">
              SAMPLE PUSH NOTIFICATIONS
            </p>
            <div className="mt-3 space-y-3">
              <div className="rounded-md bg-[#111] px-3 py-2.5">
                <p className="text-[12px] font-light text-[#ededed]">
                  &ldquo;Almost there! Just 1 more visit to earn your reward at Sunrise Coffee.&rdquo;
                </p>
              </div>
              <div className="rounded-md bg-[#111] px-3 py-2.5">
                <p className="text-[12px] font-light text-[#ededed]">
                  &ldquo;🏆 Reward earned! You've earned your reward at Sunrise Coffee. Show the app at the register.&rdquo;
                </p>
              </div>
              <div className="rounded-md bg-[#111] px-3 py-2.5">
                <p className="text-[12px] font-light text-[#ededed]">
                  &ldquo;Email: Check-in confirmed at Sunrise Coffee ✅ You're at 5/8 stamps. 3 more to go!&rdquo;
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] font-light text-[#444]">
            Questions? Contact{" "}
            <a
              href="mailto:support@ventzon.com"
              className="text-[#888] underline decoration-[#333] underline-offset-2 transition-colors hover:text-[#ededed]"
            >
              support@ventzon.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
