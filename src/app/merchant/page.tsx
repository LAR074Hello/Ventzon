"use client";

import { useMemo, useState } from "react";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function MerchantPage() {
  const [shopName, setShopName] = useState("");
  const slug = useMemo(() => slugify(shopName), [shopName]);

  const joinPath = slug ? `/join/${slug}` : "/join/your-shop-name";
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}${joinPath}` : joinPath;

  return (
    <main style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "60px 16px" }}>
      <div style={{ width: 720, maxWidth: "100%" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>Ventzon</div>

        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 10 }}>Merchant Setup</h1>
        <p style={{ color: "#666", marginBottom: 28 }}>
          Give customers a QR code → they join rewards in seconds.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>1) Enter your shop name</h2>

            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Example: Govans Groceries"
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                borderRadius: 10,
                border: "1px solid #ccc",
                marginBottom: 10,
              }}
            />

            <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Your shop link (this becomes your QR destination):</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, padding: 10, borderRadius: 10, border: "1px solid #eee" }}>
              {joinUrl}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => navigator.clipboard.writeText(joinUrl)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Copy Link
              </button>

              <a
                href={joinPath}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "black",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 800,
                }}
              >
                Preview Customer Page
              </a>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>2) Cashier rules (laminated sign)</h2>

            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              <b>Rule:</b> Only show the QR after a purchase of <b>$3+</b>.<br />
              <b>Limit:</b> Max <b>1 reward per customer per day</b>.<br />
              <b>How:</b> Keep the sign face-down. If purchase qualifies, flip it over and show the QR.
            </div>

            <div style={{ marginTop: 14, fontSize: 13, color: "#666" }}>
              (Next step: we’ll add real tracking + SMS so rewards can’t be faked.)
            </div>
          </div>

          <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>3) What the customer sees</h2>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              Customer scans QR → enters phone number → taps Join → sees “You’re in!”
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}