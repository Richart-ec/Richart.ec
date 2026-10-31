import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ROBOTO } from "../lib/brand";
import { EASE } from "../lib/ease";

export const AF_GREEN = "#3BD16F";

type AfKey = readonly [number, number, number]; // [frame, x, y]

/** Position of the AF box hunting between keyframes (fast eased jumps). */
export const afPosition = (frame: number, keys: readonly AfKey[], start: { x: number; y: number }) => {
  let x = start.x;
  let y = start.y;
  for (const [f, kx, ky] of keys) {
    if (frame <= f) break;
    const p = interpolate(frame, [f, f + 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
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

/** Sony-style EVF overlay: frame corners, exposure readouts and the AF box. */
export const Viewfinder: React.FC<{
  readonly opacity: number;
  readonly af?: { readonly x: number; readonly y: number; readonly size: number; readonly locked: boolean; readonly visible: boolean };
  readonly shots?: number;
}> = ({ opacity, af, shots }) => {
  const frame = useCurrentFrame();
  if (opacity <= 0.001) return null;
  const inset = 70;
  const c = 54; // corner length
  const corner = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M ${x} ${y + sy * c} L ${x} ${y} L ${x + sx * c} ${y}`} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={3} fill="none" />
  );
  const blinkRec = Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }} aria-hidden>
        {corner(inset, 220, 1, 1)}
        {corner(1080 - inset, 220, -1, 1)}
        {corner(inset, 1700, 1, -1)}
        {corner(1080 - inset, 1700, -1, -1)}
        {/* battery */}
        <rect x={930} y={142} width={58} height={28} rx={4} stroke="#FFF" strokeWidth={2.5} fill="none" opacity={0.9} />
        <rect x={988} y={150} width={5} height={12} fill="#FFF" opacity={0.9} />
        <rect x={935} y={147} width={44} height={18} fill="#FFF" opacity={0.9} />
        {af && af.visible ? (
          <g transform={`translate(${af.x} ${af.y})`}>
            {(() => {
              const h = af.size / 2;
              const k = af.size * 0.26;
              const col = af.locked ? AF_GREEN : "#FFFFFF";
              const sw = af.locked ? 5 : 3.5;
              const seg = (x: number, y: number, sx: number, sy: number) => (
                <path d={`M ${x} ${y + sy * k} L ${x} ${y} L ${x + sx * k} ${y}`} stroke={col} strokeWidth={sw} fill="none" />
              );
              return (
                <>
                  {seg(-h, -h, 1, 1)}
                  {seg(h, -h, -1, 1)}
                  {seg(-h, h, 1, -1)}
                  {seg(h, h, -1, -1)}
                  {af.locked ? <rect x={-h} y={-h} width={af.size} height={af.size} fill={AF_GREEN} opacity={0.08} /> : null}
                </>
              );
            })()}
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", left: inset + 6, top: 136, ...txt }}>AF-C</div>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 136, textAlign: "center", ...txt }}>
        <span style={{ color: blinkRec ? "#FF4B3E" : "rgba(255,75,62,0.35)" }}>●</span> {shots === undefined ? "" : `${String(shots).padStart(2, "0")}`}
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
