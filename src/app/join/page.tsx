"use client";

import { useState } from "react";

export default function JoinPage() {
  const [phone, setPhone] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 320 }}>
        {!joined ? (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
              Join Rewards ☕
            </h1>

            <p style={{ marginBottom: 20 }}>
              Buy 5 coffees, get 1 free.
            </p>

            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                marginBottom: 12,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />

            <button
              onClick={() => {
                if (phone.length >= 10) {
                  setJoined(true);
                } else {
                  alert("Please enter a valid phone number");
                }
              }}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 6,
                border: "none",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Join Rewards
            </button>

            <p style={{ fontSize: 12, marginTop: 16, color: "#666" }}>
              Max 1 reward per day. $3 minimum purchase.
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
              🎉 You’re in!
            </h1>

            <p>
              You’ll earn a reward after 5 qualifying purchases.
            </p>

            <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
              Text confirmations coming soon.
            </p>
          </>
        )}
      </div>
    </main>
  );
}