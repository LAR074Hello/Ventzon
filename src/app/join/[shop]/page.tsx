"use client";

import { useMemo, useState } from "react";

const SHOP_PRESETS: Record<
  string,
  { displayName: string; dealText: string; minPurchase: number; maxPerDay: number }
> = {
  "brewed-awakenings": {
    displayName: "Brewed Awakenings",
    dealText: "Buy 5 coffees, get 1 free.",
    minPurchase: 3,
    maxPerDay: 1,
  },
  "govans-tobacco": {
    displayName: "Govans Tobacco & Groceries",
    dealText: "Buy 5 visits, get 1 free.",
    minPurchase: 3,
    maxPerDay: 1,
  },
};

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ShopJoinPage({ params }: { params: { shop: string } }) {
  const shopSlug = (params.shop || "").toLowerCase();

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

  function cleanPhone(input: string) {
    return input.replace(/[^\d]/g, "");
  }

  function handleSubmit() {
    setError("");

    const digits = cleanPhone(phone);

    if (digits.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    // For now, we’re not saving it anywhere.
    // Next step will be: store to Supabase + send SMS.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360 }}>
        <div style={{ marginBottom: 14, fontSize: 12, color: "#666" }}>
          Ventzon Rewards
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {shop.displayName}
        </h1>

        <p style={{ marginBottom: 18 }}>
          {shop.dealText}
        </p>

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
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            backgroundColor: "black",
            color: "white",
            cursor: "pointer",
          }}
        >
          Join Rewards
        </button>

        <p style={{ fontSize: 12, marginTop: 14, color: "#666", lineHeight: 1.4 }}>
          Rules: max {shop.maxPerDay} reward/day. ${shop.minPurchase}+ minimum purchase.
        </p>

        <p style={{ fontSize: 12, marginTop: 10, color: "#666" }}>
          Shop link: <span style={{ fontFamily: "monospace" }}>/join/{shopSlug}</span>
        </p>
      </div>
    </main>
  );
}