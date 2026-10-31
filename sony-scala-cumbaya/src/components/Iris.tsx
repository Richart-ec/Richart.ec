import React from "react";

type V = { x: number; y: number };

/**
 * Pinwheel iris. Blade k is bounded by side k of the aperture polygon, the
 * extension of that edge out to the housing circle, the housing arc, and the
 * extension of edge k-1 back to the aperture. The blades tile the annulus.
 */
const bladeGeometry = (cx: number, cy: number, r: number, n: number, rot: number, R: number) => {
  const V: V[] = Array.from({ length: n }, (_, k) => {
    const a = rot + (2 * Math.PI * k) / n;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const hit = (A: V, d: V): V => {
    const mx = A.x - cx;
    const my = A.y - cy;
    const b = mx * d.x + my * d.y;
    const c = mx * mx + my * my - R * R;
    const tt = -b + Math.sqrt(Math.max(0, b * b - c));
    return { x: A.x + tt * d.x, y: A.y + tt * d.y };
  };
  const P: V[] = V.map((Vk, k) => {
    const Vn = V[(k + 1) % n];
    const len = Math.hypot(Vn.x - Vk.x, Vn.y - Vk.y) || 1;
    return hit(Vn, { x: (Vn.x - Vk.x) / len, y: (Vn.y - Vk.y) / len });
  });
  return V.map((Vk, k) => {
    const Vn = V[(k + 1) % n];
    const Pk = P[k];
    const Pp = P[(k - 1 + n) % n];
    const f = (p: V) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    return {
      d: `M ${f(Vk)} L ${f(Vn)} L ${f(Pk)} A ${R} ${R} 0 0 0 ${f(Pp)} Z`,
      edge: `M ${f(Vk)} L ${f(Pk)}`,
      // gradient from this blade's leading edge (light) to the previous edge (dark)
      g1: { x: (Vn.x + Pk.x) / 2, y: (Vn.y + Pk.y) / 2 },
      g2: { x: (Vk.x + Pp.x) / 2, y: (Vk.y + Pp.y) / 2 },
    };
  });
};

export const Iris: React.FC<{
  readonly width: number;
  readonly height: number;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly n: number;
  readonly rot: number;
  readonly R: number;
  /** 0 = cool coated interior (16-50 mm), 1 = warm G Master light */
  readonly warm: number;
  /** intensity of the light seen through the aperture (0..1) */
  readonly glow: number;
  readonly id: string;
}> = ({ width, height, cx, cy, r, n, rot, R, warm, glow, id }) => {
  const open = r >= R - 1;
  const blades = open ? [] : bladeGeometry(cx, cy, Math.max(0.5, r), n, rot, R);
  // light seen through the aperture, never wider than ~620 px
  const ir = Math.min(Math.max(r * 1.15, 110), 620);
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * warm);
  const core = `rgb(${lerp(140, 255)},${lerp(190, 186)},${lerp(235, 128)})`;
  const mid = `rgb(${lerp(40, 242)},${lerp(92, 85)},${lerp(160, 41)})`;
  const a = (0.3 + 0.6 * warm) * glow;
  // every stop of the same colour only changes opacity: no non-premultiplied
  // colour fringes where the alpha ramps (that was the blue ring)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }} aria-hidden>
      <defs>
        <radialGradient id={`${id}-core`} cx={cx} cy={cy} r={ir * 0.42} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={core} stopOpacity={a * 0.9} />
          <stop offset="55%" stopColor={core} stopOpacity={a * 0.25} />
          <stop offset="100%" stopColor={core} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-in`} cx={cx} cy={cy} r={ir} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={mid} stopOpacity={a * 0.75} />
          <stop offset="30%" stopColor={mid} stopOpacity={a * 0.42} />
          <stop offset="62%" stopColor={mid} stopOpacity={a * 0.12} />
          <stop offset="82%" stopColor={mid} stopOpacity={0} />
          <stop offset="91%" stopColor={mid} stopOpacity={0.09 * glow} />
          <stop offset="100%" stopColor={mid} stopOpacity={0} />
        </radialGradient>
        {blades.map((b, k) => (
          <linearGradient
            key={k}
            id={`${id}-b${k}`}
            gradientUnits="userSpaceOnUse"
            x1={b.g1.x}
            y1={b.g1.y}
            x2={b.g2.x}
            y2={b.g2.y}
          >
            <stop offset="0%" stopColor="#3A3A40" />
            <stop offset="45%" stopColor="#1B1B1F" />
            <stop offset="100%" stopColor="#09090A" />
          </linearGradient>
        ))}
      </defs>
      <rect x={0} y={0} width={width} height={height} fill="#030304" />
      <circle cx={cx} cy={cy} r={ir} fill={`url(#${id}-in)`} />
      <circle cx={cx} cy={cy} r={ir * 0.42} fill={`url(#${id}-core)`} />
      {blades.map((b, k) => (
        <path key={k} d={b.d} fill={`url(#${id}-b${k})`} />
      ))}
      {blades.map((b, k) => (
        <path key={`e${k}`} d={b.edge} stroke="#8C8C95" strokeOpacity={0.5} strokeWidth={1.6} fill="none" />
      ))}
    </svg>
  );
};

/** Focal-plane shutter curtain: metal slats with lit edges. */
export const ShutterCurtain: React.FC<{ readonly width: number; readonly height: number; readonly slats?: number }> = ({
  width,
  height,
  slats = 6,
}) => {
  const h = height / slats;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }} aria-hidden>
      <defs>
        <linearGradient id="slat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#56565E" />
          <stop offset="10%" stopColor="#2A2A30" />
          <stop offset="100%" stopColor="#141417" />
        </linearGradient>
      </defs>
      {Array.from({ length: slats }).map((_, i) => (
        <g key={i}>
          <rect x={0} y={i * h} width={width} height={h + 1} fill="url(#slat)" />
          <rect x={0} y={i * h} width={width} height={3} fill="#B4B4BE" opacity={0.7} />
        </g>
      ))}
    </svg>
  );
};
