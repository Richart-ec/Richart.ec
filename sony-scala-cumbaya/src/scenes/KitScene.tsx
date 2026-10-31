import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import cues from "../timeline/cues.json";
import meta from "../lib/productMeta.json";
import { C } from "../lib/brand";
import { EASE } from "../lib/ease";
import { Motion, MotionKey } from "../lib/Motion";
import { Product } from "../components/Product";
import { WordLine } from "../components/Type";
import { AlphaGlyph, LevelBar, Small } from "../components/UI";
import { Bokeh, LightPool } from "../components/Atmosphere";

const K = cues.kit;
const KIT = meta["a6400-kit"];
const KW = 900;
const KS = KW / KIT.width;
const KH = KIT.height * KS;
const KLEFT = (1080 - KW) / 2;
const KTOP = 1000 - KH / 2;
/** optical axis of the E PZ 16-50 mm on screen (push origin, iris centre) */
export const LENS = { x: KLEFT + KIT.lensCenter.x * KS, y: KTOP + KIT.lensCenter.y * KS };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const KitScene: React.FC<{ readonly t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame() + t0;
  const t = (f: number) => f - t0;

  const pool =
    interpolate(frame, [70, 96], [0, 1], { ...clamp, easing: EASE.soft }) *
    interpolate(frame, [K.push.start, K.push.start + 18], [1, 0], { ...clamp, easing: EASE.soft });

  const wordExit = (i: number): MotionKey[] => [
    { at: t(K.exit.headline + i), dur: 8, y: -80, opacity: 0, blur: 12, ease: "in" },
  ];

  return (
    <AbsoluteFill>
      {/* camera: everything that flies into the lens */}
      <Motion
        box={{ left: 0, top: 0, w: 1080, h: 1920 }}
        origin={`${LENS.x}px ${LENS.y}px`}
        zoomRadius={210}
        keys={[{ at: t(K.push.start), dur: K.push.dur, scale: 9, ease: "in" }]}
      >
        <LightPool cx={LENS.x - 60} cy={LENS.y - 10} rx={720} ry={560} rgb={[52, 112, 196]} intensity={pool * 0.95} core={0.18} />
        <Bokeh rgb={[120, 170, 235]} intensity={pool * 0.9} seed="kit" />
        <Motion
          box={{ left: KLEFT, top: KTOP, w: KW, h: KH }}
          from={{ x: 1300, scale: 0.97, blur: 9 }}
          keys={[
            { at: t(K.whipIn.start), dur: K.whipIn.dur, x: 0, scale: 1, ease: "whip" },
            // rack focus: hunt, then snap sharp on the beat (AF beep)
            { at: t(80), dur: 5, blur: 3.5, ease: "inOut" },
            { at: t(85), dur: 2, blur: 6.5, ease: "inOut" },
            { at: t(87), dur: K.focusSnap - 87, blur: 0, ease: "out" },
          ]}
        >
          <Product src={KIT.file} width={KW} height={KH} sweep={{ start: t(K.shine), dur: 16 }} />
        </Motion>
      </Motion>

      {/* level 1/2 */}
      <Motion
        box={{ left: 0, top: 262, w: 1080, h: 40 }}
        keys={[{ at: t(K.exit.bar), dur: 8, x: -80, opacity: 0, blur: 8, ease: "in" }]}
      >
        <LevelBar level={1} start={t(K.bar.start)} dur={K.bar.dur} />
      </Motion>

      {/* Escoge el kit / ganador* */}
      <div style={{ position: "absolute", left: 0, top: 352, width: 1080 }}>
        <WordLine
          size={100}
          weight={300}
          dur={K.wordDur}
          words={[
            { text: "Escoge", at: t(K.headline[0]), after: wordExit(0) },
            { text: "el", at: t(K.headline[1]), after: wordExit(1) },
            { text: "kit", at: t(K.headline[2]), after: wordExit(2) },
          ]}
        />
      </div>
      <div style={{ position: "absolute", left: 0, top: 466, width: 1080 }}>
        <WordLine
          size={100}
          weight={300}
          dur={K.wordDur}
          words={[
            {
              text: (
                <>
                  ganador<span style={{ fontSize: "0.5em", verticalAlign: "0.9em", marginLeft: 4, color: C.border }}>*</span>
                </>
              ),
              at: t(K.headline[3]),
              after: wordExit(3),
            },
          ]}
        />
      </div>

      {/* α6400 / + E PZ 16-50 mm */}
      <div style={{ position: "absolute", left: 0, top: 1296, width: 1080 }}>
        <WordLine
          size={104}
          weight={400}
          dur={10}
          words={[
            {
              text: (
                <>
                  <AlphaGlyph fontSize={104} />
                  6400
                </>
              ),
              at: t(K.name),
              after: [{ at: t(K.exit.names), dur: 8, y: 70, opacity: 0, blur: 12, ease: "in" }],
            },
          ]}
        />
      </div>
      <div style={{ position: "absolute", left: 0, top: 1432, width: 1080 }}>
        <WordLine
          size={46}
          weight={300}
          color={C.border}
          dur={10}
          words={[
            {
              text: (
                <>
                  + E PZ 16-50 <Small>mm</Small>
                </>
              ),
              at: t(K.sub),
              after: [{ at: t(K.exit.names + 1), dur: 8, y: 60, opacity: 0, blur: 10, ease: "in" }],
            },
          ]}
        />
      </div>

      {/* footnote for the best-seller claim */}
      <div style={{ position: "absolute", left: 0, top: 1748, width: 1080 }}>
        <WordLine
          size={24}
          weight={400}
          color={C.secondary}
          dur={10}
          blur={4}
          words={[
            {
              text: "*N.º 1 en ventas en la categoría Cámaras de store.sony.com.ec, al 31/10/2026.",
              at: t(K.footnote),
              after: [{ at: t(K.exit.footnote), dur: 8, opacity: 0, ease: "in" }],
            },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
