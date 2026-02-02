"use client";

import { useState } from "react";

export default function JoinLanding() {
  const [shop, setShop] = useState("");

  function go() {
    const slug = shop
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slug) return;

    window.location.href = `/join/${slug}`;
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          Join Rewards
        </h1>
        <p style={{ marginBottom: 16, color: "#666" }}>
          Enter the shop name/code from the counter sign.
        </p>

        <input
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          placeholder="Example: govans-tobacco"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={go}
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
          Continue
        </button>

        <p style={{ fontSize: 12, marginTop: 14, color: "#666" }}>
          Tip: shops will use QR codes that go directly to /join/their-shop.
        </p>
      </div>
    </main>
  );
}