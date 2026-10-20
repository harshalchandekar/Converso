import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Vocalutor — Talk to an AI tutor out loud";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#18181b",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "#FE5933",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            V
          </div>
          <span
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            Vocalutor
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h1
            style={{
              fontSize: "64px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.15,
              margin: 0,
              maxWidth: "960px",
            }}
          >
            Talk to an AI tutor out loud.
          </h1>
          <p
            style={{
              fontSize: "28px",
              color: "#a1a1aa",
              lineHeight: 1.4,
              margin: 0,
              maxWidth: "840px",
            }}
          >
            Pick a subject, start a voice session, and learn by conversation instead of reading.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              backgroundColor: "#27272a",
              color: "#f4f4f5",
              padding: "10px 20px",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            🎙️ Real-time Voice
          </div>
          <div
            style={{
              backgroundColor: "#27272a",
              color: "#f4f4f5",
              padding: "10px 20px",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            🧠 AI Recaps & Quizzes
          </div>
          <div
            style={{
              backgroundColor: "#27272a",
              color: "#f4f4f5",
              padding: "10px 20px",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            📊 Learning Analytics
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
