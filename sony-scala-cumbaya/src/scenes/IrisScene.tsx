import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import cues from "../timeline/cues.json";
import { EASE } from "../lib/ease";
import { Motion, MotionKey } from "../lib/Motion";
import { Iris, ShutterCurtain } from "../components/Iris";
import { WordLine } from "../components/Type";
import { LENS } from "./KitScene";

const I = cues.iris;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const R_HOUSING = 1500;
const R_OPEN = 1260;

/** Aperture radius over time (global frames). */
const apertureRadius = (f: number) => {
  if (f < I.close.start) return R_OPEN;
  if (f < I.close.start + I.close.dur)
    return interpolate(f, [I.close.start, I.close.start + I.close.dur], [R_OPEN, 3], { ...clamp, easing: EASE.inOut });
  if (f < I.reopen.start) return 3;
  if (f < I.openFull.start)
    return interpolate(f, [I.reopen.start, I.reopen.start + I.reopen.dur, I.openFull.start], [3, 380, 405], {
      ...clamp,
      easing: EASE.out,
    });
  return interpolate(f, [I.openFull.start, I.openFull.start + I.openFull.dur], [405, R_HOUSING], {
    ...clamp,
    easing: EASE.in,
  });
};

/** Inside the 16-50 mm: the 7-blade iris closes, the shutter fires, the
 * 11-blade G Master iris opens on warm light; at the drop the words shoot up. */
export const IrisScene: React.FC<{ readonly t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame() + t0;
  const t = (f: number) => f - t0;

  const r = apertureRadius(frame);
  const n = frame < I.swap ? 7 : 11;
  const closedness = 1 - Math.min(1, r / R_OPEN);
  const rot = -0.35 - closedness * 0.95 + (n === 11 ? 0.12 : 0);
  const warm = interpolate(frame, [I.swap, I.reopen.start + 10], [0, 1], { ...clamp, easing: EASE.soft });
  // light through the aperture: lens glass first, then G Master warmth, gone as it opens fully
  const glow = interpolate(frame, [I.openFull.start, I.openFull.start + I.openFull.dur], [1, 0], {
    ...clamp,
    easing: EASE.soft,
  });
  const appear = interpolate(frame, [I.in, I.in + 12], [0, 1], { ...clamp, easing: EASE.soft });
  const leave = interpolate(frame, [I.openFull.start + 2, I.openFull.start + I.openFull.dur], [1, 0], {
    ...clamp,
    easing: EASE.soft,
  });
  // the question sits on the optical axis, so the aperture closes between its two lines
  const textLeft = LENS.x - 540;
  const textTop = LENS.y - 114;

  const wordOut = (i: number): MotionKey[] => [
    { at: t(I.wordsOut[i]), dur: I.wordsOutDur, y: -1500, ease: "in" },
  ];

  return (
    <AbsoluteFill>
      {/* lens interior + iris; slow breathing push keeps it alive */}
      <Motion
        box={{ left: 0, top: 0, w: 1080, h: 1920 }}
        origin={`${LENS.x}px ${LENS.y}px`}
        from={{ scale: 1.06 }}
        keys={[{ at: t(I.in), dur: I.openFull.start - I.in, scale: 1, ease: "soft" }]}
        mb={0}
        style={{ opacity: appear * leave }}
      >
        <Iris width={1080} height={1920} cx={LENS.x} cy={LENS.y} r={r} n={n} rot={rot} R={R_HOUSING} warm={warm} glow={glow} id="iris" />
      </Motion>

      {/* focal-plane shutter: one curtain covers, the swap happens, it clears */}
      <Motion
        box={{ left: 0, top: 0, w: 1080, h: 1920 }}
        from={{ y: -1920 }}
        keys={[
          { at: t(I.shutter.start), dur: I.shutter.dur / 2, y: 0, ease: "in" },
          { at: t(I.shutter.start + I.shutter.dur / 2), dur: I.shutter.dur / 2, y: 1920, ease: "out" },
        ]}
        mb={0.6}
      >
        <ShutterCurtain width={1080} height={1920} />
      </Motion>

      {/* ¿Quieres / dar el salto? */}
      <div style={{ position: "absolute", left: textLeft, top: textTop, width: 1080 }}>
        <WordLine size={100} weight={300} dur={I.wordDur} words={[{ text: "¿Quieres", at: t(I.words[0]), exit: wordOut(0) }]} />
      </div>
      <div style={{ position: "absolute", left: textLeft, top: textTop + 114, width: 1080 }}>
        <WordLine
          size={100}
          weight={300}
          dur={I.wordDur}
          words={[
            { text: "dar", at: t(I.words[1]), exit: wordOut(1) },
            { text: "el", at: t(I.words[2]), exit: wordOut(2) },
            { text: "salto?", at: t(I.words[3]), exit: wordOut(3) },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
