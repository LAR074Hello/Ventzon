"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

const SHOP_PRESETS: Record<
  string,
  { displayName: string; dealText: string; minPurchase: number; maxPerDay: number }
> = {};

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ShopJoinPage({ params }: { params?: { shop?: string } }) {
  // NOTE: In some Next.js setups, `params` may not populate for a client page.
  // We fall back to `useParams()` so the slug always comes from the URL.
  const routeParams = useParams() as { shop?: string | string[] };

  const rawShop =
    (params?.shop as string | undefined) ??
    (Array.isArray(routeParams?.shop)
      ? routeParams.shop[0]
      : (routeParams?.shop as string | undefined));

  const shopSlug = (rawShop || "").toLowerCase().trim();

  const shop = useMemo(() => {
    return (
      SHOP_PRESETS[shopSlug] || {
        displayName: toTitleCase(shopSlug) || "Rewards",
        dealText: "Buy 5, get 1 free.",
        minPurchase: 3,
        maxPerDay: 1,
      }
    );
  }, [shopSlug]);

  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function cleanPhone(input: string) {
    return input.replace(/[^\d]/g, "");
  }

  async function handleSubmit() {
    setError("");

    // If someone hits /join (no slug), this prevents a confusing API error.
    if (!shopSlug) {
      setError("Missing shop link. Use a link like /join/govans-groceries");
      return;
    }

    const digits = cleanPhone(phone);

    if (digits.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits,
          shop_slug: shopSlug,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 360 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
            You’re in ✅
          </h1>
          <p style={{ marginBottom: 10 }}>
            You joined <b>{shop.displayName}</b> rewards.
          </p>
          <p style={{ color: "#666", fontSize: 13 }}>
            Next: we’ll connect SMS + points tracking.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: 360 }}>
        <div style={{ marginBottom: 14, fontSize: 12, color: "#666" }}>
          Ventzon Rewards
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {shop.displayName}
        </h1>

        <p style={{ marginBottom: 18 }}>{shop.dealText}</p>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="Enter your phone number"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        {error ? (
          <div style={{ color: "#b00020", fontSize: 13, marginBottom: 10 }}>
            {error}
          </div>
        ) : null}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            backgroundColor: "black",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Joining..." : "Join Rewards"}
        </button>

        <p
          style={{
            fontSize: 12,
            marginTop: 14,
            color: "#666",
            lineHeight: 1.4,
          }}
        >
          Rules: max {shop.maxPerDay} reward/day. ${shop.minPurchase}+ minimum
          purchase.
        </p>

        <p style={{ fontSize: 12, marginTop: 10, color: "#666" }}>
          Shop link:{" "}
          <span style={{ fontFamily: "monospace" }}>/join/{shopSlug || "(missing)"}</span>
        </p>
      </div>
    </main>
  );
}