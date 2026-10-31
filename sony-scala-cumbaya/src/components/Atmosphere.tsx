import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { H, W } from "../lib/brand";

/** Soft light pool behind a product. Colour/intensity are driven by the scene. */
export const LightPool: React.FC<{
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly rgb: readonly [number, number, number];
  readonly intensity: number;
  readonly core?: number; // 0..1 extra white-ish core
}> = ({ cx, cy, rx, ry, rgb, intensity, core = 0.25 }) => {
  if (intensity <= 0.001) return null;
  // Gaussian falloff sampled in 12 stops; the centre is tinted towards white.
  const stops = Array.from({ length: 13 }, (_, i) => {
    const r01 = i / 12;
    const a = 0.5 * Math.exp(-((r01 / 0.42) ** 2)) * (1 - r01 ** 6);
    const w = core * Math.exp(-((r01 / 0.18) ** 2));
    const col = rgb.map((c) => Math.round(c + (255 - c) * w));
    return `rgba(${col.join(",")},${a.toFixed(4)}) ${(r01 * 100).toFixed(1)}%`;
  });
  return (
    <div
      style={{
        position: "absolute",
        left: cx - rx,
        top: cy - ry,
        width: rx * 2,
        height: ry * 2,
        borderRadius: "50%",
        opacity: intensity,
        background: `radial-gradient(closest-side, ${stops.join(", ")})`,
      }}
    />
  );
};

/** Very subtle drifting bokeh. */
export const Bokeh: React.FC<{
  readonly rgb: readonly [number, number, number];
  readonly intensity: number;
  readonly seed: string;
  readonly count?: number;
}> = ({ rgb, intensity, seed, count = 9 }) => {
  const frame = useCurrentFrame();
  if (intensity <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity: intensity }}>
      {Array.from({ length: count }).map((_, i) => {
        const x0 = random(`${seed}x${i}`) * W;
        const y0 = random(`${seed}y${i}`) * H;
        const size = 70 + random(`${seed}s${i}`) * 170;
        const vx = (random(`${seed}vx${i}`) - 0.5) * 0.9;
        const vy = -0.25 - random(`${seed}vy${i}`) * 0.6;
        const a = 0.35 + random(`${seed}a${i}`) * 0.65;
        const tw = 0.75 + 0.25 * Math.sin(frame / (18 + i * 3) + i);
        const [r, g, b] = rgb;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x0 + vx * frame - size / 2,
              top: y0 + vy * frame - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              opacity: a * tw,
              background: `radial-gradient(closest-side, rgba(${r},${g},${b},0.09) 0%, rgba(${r},${g},${b},0.10) 62%, rgba(${r},${g},${b},0.12) 80%, rgba(${r},${g},${b},0) 100%)`,
              filter: "blur(7px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ readonly strength?: number }> = ({ strength = 0.62 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,${strength * 0.55}) 80%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** Animated film grain (feTurbulence, new seed every frame). Soft-light keeps
 * pure black black while dithering the light falloffs (no H.264 banding). */
export const Grain: React.FC<{ readonly opacity?: number }> = ({ opacity = 0.32 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity, pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ display: "block" }} aria-hidden>
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves={2} seed={frame} stitchTiles="stitch" />
          {/* monochrome luminance, alpha forced to 1 (turbulence alpha is noisy too) */}
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"
          />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.9" intercept="-0.45" />
            <feFuncG type="linear" slope="1.9" intercept="-0.45" />
            <feFuncB type="linear" slope="1.9" intercept="-0.45" />
          </feComponentTransfer>
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Camera flash: near-instant white peak, exponential decay, warm bloom. */
export const Flash: React.FC<{ readonly at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -4 || t > 18) return null;
  const rise = interpolate(t, [-3, -1, 0], [0, 0.45, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const decay = t <= 0 ? 1 : Math.exp(-t / 2.1);
  const o = t <= 0 ? rise : decay;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: o * 0.96 }} />
      <AbsoluteFill
        style={{
          opacity: Math.min(1, o * 1.4),
          background: "radial-gradient(ellipse 70% 45% at 50% 42%, rgba(255,250,240,0.9) 0%, rgba(255,240,220,0.35) 45%, rgba(255,240,220,0) 75%)",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
