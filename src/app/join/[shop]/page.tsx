"use client";

import { useMemo, useState } from "react";

export default function JoinShopPage({
  params,
}: {
  params: { shop: string };
}) {
  const shopSlug = useMemo(
    () => String(params?.shop ?? "").trim().toLowerCase(),
    [params]
  );

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string>("");

  const cleanedDigits = useMemo(() => phone.replace(/[^\d]/g, ""), [phone]);
  const isValid = cleanedDigits.length >= 10;

  async function onJoin() {
    setError("");
    if (!shopSlug) {
      setError("Missing shop.");
      return;
    }
    if (!isValid) {
      setError("Enter a valid phone number.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // your /signup route expects: phone + shop_slug
        body: JSON.stringify({ phone: cleanedDigits, shop_slug: shopSlug }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(json?.error ?? "Failed to join");

      // success page
      setStatus("success");
    } catch (e: any) {
      setError(e?.message ?? "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  // Nice formatting while typing (optional)
  function onPhoneChange(v: string) {
    // keep raw, but limit length so it doesn’t get insane
    const next = v.slice(0, 24);
    setPhone(next);
  }

  const titleShopName = useMemo(() => {
    if (!shopSlug) return "Ventzon Rewards";
    // turn "govans-groceries" into "Govans Groceries"
    return shopSlug
      .split("-")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");
  }, [shopSlug]);

  if (!shopSlug) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-xl px-6 py-16">
          <div className="text-xs tracking-[0.35em] text-neutral-400">
            VENTZON REWARDS
          </div>
          <h1 className="mt-3 text-3xl font-semibold">Missing shop</h1>
          <p className="mt-3 text-neutral-300">
            Open a link like <span className="font-mono">/join/govans-groceries</span>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* subtle premium glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-200px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-neutral-800 blur-3xl" />
        <div className="absolute right-[-220px] top-[140px] h-[520px] w-[520px] rounded-full bg-neutral-900 blur-3xl" />
        <div className="absolute left-[-220px] bottom-[80px] h-[520px] w-[520px] rounded-full bg-neutral-900 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-6 py-14">
        <div className="w-full">
          <div className="mb-8 text-center">
            <div className="text-xs tracking-[0.35em] text-neutral-400">
              VENTZON REWARDS
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              {titleShopName}
            </h1>
            <p className="mt-2 text-neutral-300">
              Join rewards with your phone number.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            {status === "success" ? (
              <div className="py-10 text-center">
                <div className="text-2xl font-semibold">You’re in ✅</div>
                <p className="mt-2 text-neutral-300">
                  You joined <span className="font-medium">{titleShopName}</span> rewards.
                </p>
                <p className="mt-3 text-sm text-neutral-500">
                  Next: we’ll connect SMS + points tracking.
                </p>

                <div className="mt-8 flex justify-center gap-2">
                  <a
                    href={`/join/${shopSlug}`}
                    className="rounded-xl border border-neutral-800 px-4 py-2 text-sm hover:bg-neutral-900"
                  >
                    Back
                  </a>
                </div>
              </div>
            ) : (
              <>
                <label className="block text-sm text-neutral-300">
                  Phone number
                </label>

                <input
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  inputMode="tel"
                  placeholder="Enter your phone number"
                  className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
                />

                <button
                  onClick={onJoin}
                  disabled={loading || !isValid}
                  className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Joining…" : "Join Rewards"}
                </button>

                {error ? (
                  <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <div className="mt-4 text-center text-xs text-neutral-500">
                  No spam. You can opt out anytime.
                </div>

                <div className="mt-3 text-center text-xs text-neutral-600">
                  Shop link: <span className="font-mono">/join/{shopSlug}</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-neutral-600">
            Powered by Ventzon
          </div>
        </div>
      </div>
    </main>
  );
}