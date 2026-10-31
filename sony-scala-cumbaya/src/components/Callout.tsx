import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE } from "../lib/ease";
import { GM_EMBLEM_PATH, GM_G_PATH, GM_MASTER_PATH, GM_VIEWBOX_FULL } from "../lib/gmasterPaths";

type P = { readonly x: number; readonly y: number };
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Infographic leader: a dot that lands with a pulse, then a thin line that
 * draws itself along `points` (screen px). Drawn in one full-frame SVG.
 */
export const Leader: React.FC<{
  readonly points: readonly P[];
  readonly dotAt: number;
  readonly lineAt: number;
  readonly lineDur: number;
  readonly exitAt: number;
  readonly showDot?: boolean;
  readonly color?: string;
}> = ({ points, dotAt, lineAt, lineDur, exitAt, showDot = true, color = "#FFFFFF" }) => {
  const frame = useCurrentFrame();
  const total = points.slice(1).reduce((acc, p, i) => acc + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
  const drawn = interpolate(frame, [lineAt, lineAt + lineDur], [0, total], { ...clamp, easing: EASE.out });
  const dotIn = interpolate(frame, [dotAt, dotAt + 6], [0, 1], { ...clamp, easing: EASE.back });
  const pulse = interpolate(frame, [dotAt + 1, dotAt + 16], [0, 1], { ...clamp, easing: EASE.out });
  const out = interpolate(frame, [exitAt, exitAt + 7], [1, 0], { ...clamp, easing: EASE.in });
  if (frame < dotAt - 1 || out <= 0) return null;
  const d = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  const o = points[0];
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: out }} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.9}
        strokeLinecap="round"
        strokeDasharray={`${total} ${total}`}
        strokeDashoffset={total - drawn}
      />
      {showDot ? (
        <>
          <circle cx={o.x} cy={o.y} r={8 + 26 * pulse} fill="none" stroke={color} strokeWidth={2} opacity={(1 - pulse) * 0.8} />
          <circle cx={o.x} cy={o.y} r={8 * dotIn} fill={color} />
          <circle cx={o.x} cy={o.y} r={3.2 * dotIn} fill="#000000" opacity={0.35} />
        </>
      ) : null}
    </svg>
  );
};

/** G MASTER lockup (reconstructed vector) revealed by a left-to-right
 * clip-path wipe, then a specular glint confined to the seal's own shape. */
export const GMasterSeal: React.FC<{
  readonly width: number;
  readonly wipeAt: number;
  readonly wipeDur: number;
  readonly glintAt: number;
}> = ({ width, wipeAt, wipeDur, glintAt }) => {
  const frame = useCurrentFrame();
  const height = (width * GM_VIEWBOX_FULL.height) / GM_VIEWBOX_FULL.width;
  const wipe = interpolate(frame, [wipeAt, wipeAt + wipeDur], [100, 0], { ...clamp, easing: EASE.inOut });
  const vb = `${GM_VIEWBOX_FULL.x} ${GM_VIEWBOX_FULL.y} ${GM_VIEWBOX_FULL.width} ${GM_VIEWBOX_FULL.height}`;
  const art = (glint: boolean) => (
    <svg viewBox={vb} width={width} height={height} style={{ display: "block" }}>
      <path d={GM_EMBLEM_PATH} fill={glint ? "#FFD2B0" : "#CD4902"} />
      <path d={GM_G_PATH} fill="#FFFFFF" />
      <path d={GM_MASTER_PATH} fill="#FFFFFF" />
    </svg>
  );
  const gp = interpolate(frame, [glintAt, glintAt + 14], [-30, 130], { ...clamp, easing: EASE.inOut });
  const band = `linear-gradient(110deg, transparent ${gp - 10}%, #000 ${gp}%, transparent ${gp + 10}%)`;
  const glintOn = frame >= glintAt - 1 && frame <= glintAt + 15;
  return (
    <div style={{ position: "relative", width, height, clipPath: `inset(-20% ${wipe}% -20% 0)` }}>
      {art(false)}
      {glintOn ? (
        <>
          <div style={{ position: "absolute", inset: 0, maskImage: band, WebkitMaskImage: band, mixBlendMode: "screen", opacity: 0.75 }}>
            {art(true)}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              maskImage: band,
              WebkitMaskImage: band,
              mixBlendMode: "screen",
              opacity: 0.35,
              filter: "blur(10px)",
            }}
          >
            {art(true)}
          </div>
        </>
      ) : null}
    </div>
  );
};
