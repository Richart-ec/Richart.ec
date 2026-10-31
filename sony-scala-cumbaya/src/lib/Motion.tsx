import React, { createContext, useContext, useId } from "react";
import { useCurrentFrame } from "remotion";
import { EASE, EaseName } from "./ease";

/**
 * Motion: every element in the spot is driven by keyframes
 *   { at, dur, x, y, scale, blur, opacity, rotate, ease }
 * evaluated with Easing.bezier presets (never CSS transitions).
 *
 * Motion blur: the state is also evaluated at frame ± 0.25 (a 180° shutter).
 * The displacement over that exposure becomes a directional Gaussian blur
 * (different stdDeviation in x and y) applied with ONE feGaussianBlur layer.
 * Focus blur (rack focus) is added in quadrature. Blur values are in screen
 * pixels and converted to local pixels using the accumulated parent scale.
 */

export type MotionState = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  blur: number;
  opacity: number;
};

export type MotionKey = Partial<MotionState> & {
  at: number;
  dur: number;
  ease?: EaseName;
};

const REST: MotionState = { x: 0, y: 0, scale: 1, rotate: 0, blur: 0, opacity: 1 };

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const evalMotion = (
  from: Partial<MotionState> | undefined,
  keys: readonly MotionKey[],
  f: number,
): MotionState => {
  let s: MotionState = { ...REST, ...from };
  for (const k of keys) {
    if (f <= k.at) break;
    const p = k.dur <= 0 ? 1 : Math.min(1, (f - k.at) / k.dur);
    const e = EASE[k.ease ?? "out"](p);
    s = {
      x: mix(s.x, k.x ?? s.x, e),
      y: mix(s.y, k.y ?? s.y, e),
      scale: mix(s.scale, k.scale ?? s.scale, e),
      rotate: mix(s.rotate, k.rotate ?? s.rotate, e),
      blur: mix(s.blur, k.blur ?? s.blur, e),
      opacity: mix(s.opacity, k.opacity ?? s.opacity, e),
    };
    if (p < 1) break;
  }
  return {
    ...s,
    opacity: Math.min(1, Math.max(0, s.opacity)),
    blur: Math.max(0, s.blur),
    scale: Math.max(0.0001, s.scale),
  };
};

const ScaleCtx = createContext(1);
export const useParentScale = () => useContext(ScaleCtx);

type Box = { left: number; top: number; w: number; h: number };

export type MotionProps = {
  readonly from?: Partial<MotionState>;
  readonly keys: readonly MotionKey[];
  /** absolute box in parent px; omit to take part in normal layout */
  readonly box?: Box;
  readonly origin?: string;
  /** radius (local px) used to turn scale velocity into zoom blur */
  readonly zoomRadius?: number;
  /** multiplier for the velocity part of the blur */
  readonly mb?: number;
  readonly style?: React.CSSProperties;
  readonly children?: React.ReactNode;
};

export const Motion: React.FC<MotionProps> = ({
  from,
  keys,
  box,
  origin = "50% 50%",
  zoomRadius,
  mb = 1,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const parentScale = useParentScale();
  const rawId = useId();
  const id = `mb${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const s = evalMotion(from, keys, frame);
  const a = evalMotion(from, keys, frame - 0.25);
  const b = evalMotion(from, keys, frame + 0.25);

  const total = parentScale * s.scale;
  const radius = zoomRadius ?? (box ? Math.max(box.w, box.h) / 2 : 300);
  const dx = Math.abs(b.x - a.x) * parentScale;
  const dy = Math.abs(b.y - a.y) * parentScale;
  const dz = Math.abs(b.scale - a.scale) * parentScale * radius;
  const k = 0.3 * mb;
  const sxScreen = Math.sqrt(s.blur ** 2 + (k * dx) ** 2 + (k * dz) ** 2);
  const syScreen = Math.sqrt(s.blur ** 2 + (k * dy) ** 2 + (k * dz) ** 2);
  const sx = sxScreen / total;
  const sy = syScreen / total;
  const hasBlur = (sx > 0.12 || sy > 0.12) && s.opacity > 0.001;

  const w = box?.w ?? 600;
  const h = box?.h ?? 200;
  const padX = Math.min(4, (3 * sx + 4) / w);
  const padY = Math.min(4, (3 * sy + 4) / h);

  const positional: React.CSSProperties = box
    ? { position: "absolute", left: box.left, top: box.top, width: box.w, height: box.h }
    : { position: "relative" };

  return (
    <ScaleCtx.Provider value={total}>
      <div
        style={{
          ...positional,
          translate: `${s.x}px ${s.y}px`,
          scale: s.scale,
          rotate: `${s.rotate}deg`,
          transformOrigin: origin,
          opacity: s.opacity,
          visibility: s.opacity <= 0.001 ? "hidden" : "visible",
          filter: hasBlur ? `url(#${id})` : undefined,
          ...style,
        }}
      >
        {hasBlur ? (
          <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
            <defs>
              <filter
                id={id}
                x={`${-padX * 100}%`}
                y={`${-padY * 100}%`}
                width={`${(1 + 2 * padX) * 100}%`}
                height={`${(1 + 2 * padY) * 100}%`}
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur stdDeviation={`${sx.toFixed(3)} ${sy.toFixed(3)}`} />
              </filter>
            </defs>
          </svg>
        ) : null}
        {children}
      </div>
    </ScaleCtx.Provider>
  );
};

/**
 * Hard-line mask: content rises from behind the bottom edge of an
 * overflow-hidden box. Padding keeps accents and descenders inside.
 */
export const Mask: React.FC<{
  readonly padTop?: number;
  readonly padBottom?: number;
  readonly padX?: number;
  readonly style?: React.CSSProperties;
  readonly children: React.ReactNode;
}> = ({ padTop = 0, padBottom = 0, padX = 0, style, children }) => (
  <div
    style={{
      display: "inline-block",
      overflow: "hidden",
      paddingTop: padTop,
      paddingBottom: padBottom,
      paddingLeft: padX,
      paddingRight: padX,
      marginTop: -padTop,
      marginBottom: -padBottom,
      marginLeft: -padX,
      marginRight: -padX,
      verticalAlign: "top",
      ...style,
    }}
  >
    {children}
  </div>
);
