import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, ROBOTO } from "../lib/brand";
import { EASE } from "../lib/ease";
import { ALPHA_PATH, ALPHA_TRANSLATE, ALPHA_VIEWBOX } from "../lib/alphaLogoPath";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Two-segment level meter. `level` 1 fills the first segment in blue,
 * level 2 additionally fills the second one in orange.
 */
export const LevelBar: React.FC<{
  readonly level: 1 | 2;
  readonly start: number;
  readonly dur: number;
  readonly segW?: number;
}> = ({ level, start, dur, segW = 170 }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [start - 6, start + 2], [0, 1], { ...clamp, easing: EASE.out });
  const fill = interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: EASE.out });
  const segH = 8;
  const gap = 14;
  const seg = (color: string, amount: number, track: string) => (
    <div style={{ position: "relative", width: segW, height: segH, background: track, borderRadius: segH / 2, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${amount * 100}%`, background: color, borderRadius: segH / 2 }} />
    </div>
  );
  // level 1 always reads 1/2; level 2 flips from 1/2 to 2/2 as its segment fills
  const label = level === 1 || fill > 0.5 ? `${level}/2` : "1/2";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, opacity: appear }}>
      <div style={{ display: "flex", gap }}>
        {seg(C.bannerBlue, level === 1 ? fill : 1, "rgba(255,255,255,0.16)")}
        {seg(C.action, level === 2 ? fill : 0, "rgba(255,255,255,0.16)")}
      </div>
      <span
        style={{
          fontFamily: ROBOTO,
          fontWeight: 500,
          fontSize: 32,
          letterSpacing: "0.14em",
          color: C.border,
          fontVariantNumeric: "tabular-nums",
          width: 70,
        }}
      >
        {label}
      </span>
    </div>
  );
};

/** The α from the official Sony α mark, sized to sit on the text baseline. */
export const AlphaGlyph: React.FC<{ readonly fontSize: number; readonly color?: string }> = ({
  fontSize,
  color = "#FFFFFF",
}) => {
  const h = fontSize * 0.74;
  const w = (h * ALPHA_VIEWBOX.width) / ALPHA_VIEWBOX.height;
  return (
    <svg
      viewBox={`${ALPHA_VIEWBOX.x} ${ALPHA_VIEWBOX.y} ${ALPHA_VIEWBOX.width} ${ALPHA_VIEWBOX.height}`}
      width={w}
      height={h}
      style={{ display: "inline-block", verticalAlign: "baseline", marginRight: fontSize * 0.05, overflow: "visible" }}
      aria-hidden
    >
      <g transform={`translate(${ALPHA_TRANSLATE.x},${ALPHA_TRANSLATE.y})`}>
        <path d={ALPHA_PATH} fill={color} />
      </g>
    </svg>
  );
};

/** Sony-style product line: units and suffixes set smaller than the figures. */
export const Small: React.FC<{ readonly children: React.ReactNode; readonly k?: number }> = ({ children, k = 0.72 }) => (
  <span style={{ fontSize: `${k}em` }}>{children}</span>
);
