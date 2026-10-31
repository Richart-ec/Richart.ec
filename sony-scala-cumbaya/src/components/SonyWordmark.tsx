import React from "react";
import { interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { SONY_LETTERS, SONY_VIEWBOX } from "../lib/sonyLogoPaths";
import { Motion, MotionKey } from "../lib/Motion";
import { EASE } from "../lib/ease";

type Sweep = { readonly start: number; readonly dur: number; readonly bloom?: number };

type Props = {
  readonly width: number;
  readonly at: readonly number[];
  readonly dur: number;
  /** slide: letters slide in from the right; drop: letters fall in from above */
  readonly mode: "slide" | "drop";
  /** fill before the first shine passes */
  readonly revealColor?: string;
  readonly shine?: Sweep;
  /** extra shine passes that only add the glint/bloom (letters already white) */
  readonly accents?: readonly Sweep[];
  /** per-letter exit keys (index-aware) */
  readonly exitFor?: (i: number) => readonly MotionKey[];
  /** frame of a soft light pulse around the whole mark (the musical hit) */
  readonly pulseAt?: number;
};

const VB = `${SONY_VIEWBOX.x} ${SONY_VIEWBOX.y} ${SONY_VIEWBOX.width} ${SONY_VIEWBOX.height}`;

const bandPos = (frame: number, s: Sweep) =>
  interpolate(frame, [s.start, s.start + s.dur], [-25, 125], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });

const ShinePass: React.FC<{ readonly width: number; readonly height: number; readonly sweep: Sweep }> = ({
  width,
  height,
  sweep,
}) => {
  const frame = useCurrentFrame();
  if (frame < sweep.start - 1 || frame > sweep.start + sweep.dur + 1) return null;
  const p = bandPos(frame, sweep);
  const band = `linear-gradient(105deg, transparent ${p - 7}%, #000 ${p - 1}%, #000 ${p + 1}%, transparent ${p + 7}%)`;
  const letters = (
    <svg viewBox={VB} width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      {SONY_LETTERS.map((l) => (
        <path key={l.id} d={l.d} fill="#FFFFFF" />
      ))}
    </svg>
  );
  return (
    <>
      {/* bloom: the band, blurred so the glint spills past the glyph edges */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: band,
          WebkitMaskImage: band,
          filter: `blur(${height * 0.1}px)`,
          mixBlendMode: "screen",
          opacity: sweep.bloom ?? 0.45,
        }}
      >
        {letters}
      </div>
      <div style={{ position: "absolute", inset: 0, maskImage: band, WebkitMaskImage: band, mixBlendMode: "screen" }}>
        {letters}
      </div>
    </>
  );
};

export const SonyWordmark: React.FC<Props> = ({
  width,
  at,
  dur,
  mode,
  revealColor = "#8E8E94",
  shine,
  accents = [],
  exitFor,
  pulseAt,
}) => {
  const frame = useCurrentFrame();
  const height = (width * SONY_VIEWBOX.height) / SONY_VIEWBOX.width;
  const pulse =
    pulseAt === undefined
      ? 0
      : interpolate(frame, [pulseAt - 1, pulseAt + 2, pulseAt + 28], [0, 0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.soft,
        });

  return (
    <div style={{ position: "relative", width, height }}>
      {pulse > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, filter: `blur(${height * 0.32}px)`, opacity: pulse, mixBlendMode: "screen" }}>
          <svg viewBox={VB} width={width} height={height} style={{ display: "block", overflow: "visible" }}>
            {SONY_LETTERS.map((l) => (
              <path key={l.id} d={l.d} fill="#FFFFFF" />
            ))}
          </svg>
        </div>
      ) : null}
      {SONY_LETTERS.map((l, i) => {
        const cx = ((l.minX + l.maxX) / 2 - SONY_VIEWBOX.x) / SONY_VIEWBOX.width;
        // the letter turns white exactly when the shine band passes its centre
        const pass = shine ? shine.start + shine.dur * (0.1 + 0.8 * cx) : at[i] + dur;
        const fill = shine
          ? interpolateColors(frame, [pass - 2, pass + 3], [revealColor, "#FFFFFF"])
          : interpolateColors(frame, [at[i] + dur * 0.3, at[i] + dur], [revealColor, "#FFFFFF"]);
        const from =
          mode === "slide"
            ? { x: width * 0.07, blur: height * 0.22, opacity: 0 }
            : { y: -height * 0.55, scale: 1.18, blur: height * 0.24, opacity: 0 };
        const keys: MotionKey[] = [
          { at: at[i], dur, x: 0, y: 0, scale: 1, blur: 0, opacity: 1, ease: "out" },
          ...(exitFor ? exitFor(i) : []),
        ];
        return (
          <Motion
            key={l.id}
            box={{ left: 0, top: 0, w: width, h: height }}
            origin={`${cx * 100}% 55%`}
            from={from}
            keys={keys}
            zoomRadius={height}
          >
            <svg viewBox={VB} width={width} height={height} style={{ display: "block", overflow: "visible" }}>
              <path d={l.d} fill={fill} />
            </svg>
          </Motion>
        );
      })}
      {shine ? <ShinePass width={width} height={height} sweep={shine} /> : null}
      {accents.map((a, i) => (
        <ShinePass key={i} width={width} height={height} sweep={a} />
      ))}
    </div>
  );
};
