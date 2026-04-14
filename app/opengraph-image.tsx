import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MujCRM – CRM systém pro české podnikatele a firmy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0,191,255,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            right: "100px",
            width: "600px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(123,47,255,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #00BFFF, #7B2FFF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "900",
              color: "white",
            }}
          >
            M
          </div>
          <span style={{ fontSize: "42px", fontWeight: "700", color: "white", letterSpacing: "-1px" }}>
            Muj<span style={{ color: "#00BFFF" }}>CRM</span>
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: "800",
            color: "white",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: "900px",
            marginBottom: "20px",
          }}
        >
          CRM systém pro české podnikatele
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: "24px",
            color: "rgba(237,237,237,0.55)",
            textAlign: "center",
            maxWidth: "700px",
            marginBottom: "44px",
          }}
        >
          Zákazníci, obchody a tým přehledně na jednom místě.
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: "16px" }}>
          {["7 dní zdarma", "Bez platební karty", "GDPR compliant"].map((badge) => (
            <div
              key={badge}
              style={{
                padding: "10px 22px",
                borderRadius: "50px",
                background: "rgba(0,191,255,0.1)",
                border: "1px solid rgba(0,191,255,0.25)",
                color: "#00BFFF",
                fontSize: "18px",
                fontWeight: "600",
                display: "flex",
              }}
            >
              {badge}
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            color: "rgba(237,237,237,0.25)",
            fontSize: "16px",
          }}
        >
          www.mujcrm.cz
        </div>
      </div>
    ),
    { ...size }
  );
}
