import React from "react";
import { interpolate } from "remotion";
import { ROBOTO } from "../lib/brand";
import { EASE } from "../lib/ease";

export const AF_GREEN = "#3BD16F";

type AfKey = readonly [number, number, number]; // [frame, x, y]

/** Tracking-frame position: glides smoothly between subject positions (Sony real-time tracking). */
export const afPosition = (frame: number, keys: readonly AfKey[], start: { x: number; y: number }) => {
  let x = start.x;
  let y = start.y;
  for (const [f, kx, ky] of keys) {
    if (frame <= f) break;
    const p = interpolate(frame, [f, f + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
    x = x + (kx - x) * p;
    y = y + (ky - y) * p;
  }
  return { x, y };
};

const txt: React.CSSProperties = {
  fontFamily: ROBOTO,
  fontWeight: 400,
  fontSize: 34,
  letterSpacing: "0.06em",
  color: "rgba(255,255,255,0.92)",
  fontVariantNumeric: "tabular-nums",
  textShadow: "0 0 6px rgba(0,0,0,0.6)",
};

/** Sony-style EVF overlay: exposure readouts and the green tracking frame (no retro corner brackets). */
export const Viewfinder: React.FC<{
  readonly opacity: number;
  /** Sony tracking frame: solid green rectangle; `pulse` (0..1) flashes it when focus is confirmed */
  readonly af?: { readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly pulse: number; readonly visible: boolean };
  readonly shots?: number;
}> = ({ opacity, af, shots }) => {
  if (opacity <= 0.001) return null;
  const inset = 70;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }} aria-hidden>
        {/* battery */}
        <rect x={930} y={142} width={58} height={28} rx={4} stroke="#FFF" strokeWidth={2.5} fill="none" opacity={0.9} />
        <rect x={988} y={150} width={5} height={12} fill="#FFF" opacity={0.9} />
        <rect x={935} y={147} width={44} height={18} fill="#FFF" opacity={0.9} />
        {af && af.visible ? (
          <g transform={`translate(${af.x} ${af.y})`}>
            {/* soft dark keyline so the green reads on any background */}
            <rect x={-af.w / 2} y={-af.h / 2} width={af.w} height={af.h} fill="none" stroke="#000000" strokeOpacity={0.45} strokeWidth={8} />
            <rect
              x={-af.w / 2}
              y={-af.h / 2}
              width={af.w}
              height={af.h}
              fill="none"
              stroke={AF_GREEN}
              strokeWidth={4 + 2.5 * af.pulse}
              style={{ filter: af.pulse > 0.01 ? `drop-shadow(0 0 ${10 * af.pulse}px ${AF_GREEN})` : undefined }}
            />
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: inset + 6, top: 136, ...txt }}>AF-C</div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 136, textAlign: "center", ...txt }}>
        {shots === undefined ? "" : `${String(shots).padStart(2, "0")}`}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 1080,
          top: 1738,
          display: "flex",
          justifyContent: "center",
          gap: 46,
          ...txt,
        }}
      >
        <span>1/2000</span>
        <span>F2.8</span>
        <span>ISO 100</span>
        <span>±0.0</span>
      </div>
    </div>
  );
};

/** A captured frame: product on its own light, inside a thin white print border. */
export const PhotoCard: React.FC<{
  readonly w: number;
  readonly h: number;
  readonly tint: string;
  readonly children: React.ReactNode;
}> = ({ w, h, tint, children }) => (
  <div
    style={{
      width: w,
      height: h,
      background: "#F4F4F2",
      padding: 14,
      boxSizing: "border-box",
      boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${tint} 0%, #050505 78%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);
