import { ImageResponse } from "next/og";

export const alt = "ZimplifAI — Simplifico procesos. Implanto IA.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px", color: "#e8e6e1", background: "#07080a", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", color: "#ceff00", fontSize: 28, letterSpacing: 7 }}>ZIMPLIFAI</div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 800, lineHeight: 0.95, letterSpacing: -4 }}><span>SIMPLIFICO</span><span>PROCESOS.</span><span>IMPLANTO <span style={{ color: "#ceff00", fontStyle: "italic" }}>IA.</span></span></div>
      <div style={{ display: "flex", fontSize: 26, color: "#aab0b8" }}>Automatización de procesos · IA · Software a medida</div>
    </div>,
    size,
  );
}
