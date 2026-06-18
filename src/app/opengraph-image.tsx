import { ImageResponse } from "next/og";

// Branded 1200×630 share image for the homepage (og:image + twitter:image).
export const alt = "The Jesus Boot Camp — 90-Day Discipleship Training";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
          backgroundColor: "#F5F0E8",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#C9A84C",
            fontWeight: 700,
            marginBottom: 28,
          }}
        >
          90-Day Discipleship Training
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            lineHeight: 1.05,
            fontWeight: 700,
            color: "#1A1A1A",
            textAlign: "center",
          }}
        >
          The Jesus Boot Camp
        </div>
        <div style={{ width: 120, height: 4, backgroundColor: "#C9A84C", margin: "40px 0" }} />
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#5C5C5C",
            textAlign: "center",
          }}
        >
          First 3 sessions free · then $25/month
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#1A1A1A",
            fontWeight: 700,
          }}
        >
          jesusbootcamp.org
        </div>
      </div>
    ),
    { ...size }
  );
}
