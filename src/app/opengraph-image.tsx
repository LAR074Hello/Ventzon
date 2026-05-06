import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ventzon — Loyalty Rewards for Local Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#111111",
            border: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 200, color: "#ededed", letterSpacing: "-0.02em" }}>V</span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f5f5f5",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          Ventzon
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            fontWeight: 300,
            color: "#888888",
            letterSpacing: "0.01em",
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Loyalty rewards for local businesses
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {["No hardware", "No setup fees", "Free for customers"].map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#555555",
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#333" }} />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
