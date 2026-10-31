import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import cues from "../timeline/cues.json";
import meta from "../lib/productMeta.json";
import { C } from "../lib/brand";
import { EASE } from "../lib/ease";
import { Motion, MotionKey } from "../lib/Motion";
import { Product } from "../components/Product";
import { WordLine } from "../components/Type";
import { LevelBar, Small } from "../components/UI";
import { Bokeh, LightPool } from "../components/Atmosphere";
import { GMasterSeal, Leader } from "../components/Callout";

const P = cues.pro;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// a7 V body, upper right
const CAM = meta["a7v-body"];
const CW = 640;
const CS = CW / CAM.width;
const CH = CAM.height * CS;
const CL = 1080 - 80 - CW;
const CT = 420;
const SENSOR = { x: CL + CAM.sensorCenter.x * CS, y: CT + CAM.sensorCenter.y * CS };

// FE 24-70 mm F2.8 GM II, lower left (its G badge faces the seal)
const LENS = meta["sel2470gm2"];
const LH = 600;
const LS = LH / LENS.height;
const LW = LENS.width * LS;
const LL = 90;
const LT = 940;
const BADGE = { x: LL + LENS.gBadge.x * LS, y: LT + LENS.gBadge.y * LS };

const SEAL_W = 390;
const SEAL_L = 590;
const WEIGHT_Y = 1452;
const WEIGHT_DOT = { x: LL + LW * 0.45, y: WEIGHT_Y };

/** 8–12.5 s: a7 V + 33 MP, 24-70 GM II + G MASTER + 695 g, level 2/2, names. */
export const ProScene: React.FC<{ readonly t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame() + t0;
  const t = (f: number) => f - t0;
  // staggered exits that are all gone by the flash peak (frame 372)
  const exit = (d = 0): MotionKey => ({ at: t(P.exit + d * 0.5), dur: 7, opacity: 0, blur: 14, scale: 1.04, ease: "in" });

  const warm =
    interpolate(frame, [P.camIn.start - 4, P.camIn.start + 18], [0, 1], { ...clamp, easing: EASE.soft }) *
    interpolate(frame, [P.exit, P.exit + 10], [1, 0], { ...clamp, easing: EASE.soft });
  const lensLight = interpolate(frame, [P.lensIn.start, P.lensIn.start + 16], [0, 1], { ...clamp, easing: EASE.soft });

  return (
    <AbsoluteFill>
      <LightPool cx={SENSOR.x - 40} cy={SENSOR.y - 20} rx={620} ry={460} rgb={[242, 85, 41]} intensity={warm * 0.85} core={0.16} />
      <LightPool cx={LL + LW * 0.5} cy={LT + LH * 0.5} rx={440} ry={560} rgb={[205, 73, 2]} intensity={warm * lensLight * 0.75} core={0.1} />
      <Bokeh rgb={[255, 170, 110]} intensity={warm * 0.85} seed="pro" />

      {/* a7 V rises (producto que sube) and snaps into focus */}
      <Motion
        box={{ left: CL, top: CT, w: CW, h: CH }}
        from={{ y: 980, blur: 6 }}
        keys={[
          { at: t(P.camIn.start), dur: P.camIn.dur, y: 0, ease: "out" },
          { at: t(P.camIn.start + P.camIn.dur - 4), dur: P.camFocus - (P.camIn.start + P.camIn.dur - 4), blur: 0, ease: "out" },
          exit(0),
        ]}
      >
        <Product src={CAM.file} width={CW} height={CH} sweep={{ start: t(P.camFocus + 2), dur: 16, strength: 0.34 }} />
      </Motion>

      {/* 24-70 GM II slides in from the left */}
      <Motion
        box={{ left: LL, top: LT, w: LW, h: LH }}
        from={{ x: -760, blur: 5 }}
        keys={[{ at: t(P.lensIn.start), dur: P.lensIn.dur, x: 0, blur: 0, ease: "out" }, exit(1)]}
      >
        <Product src={LENS.file} width={LW} height={LH} sweep={{ start: t(P.lensIn.start + P.lensIn.dur), dur: 16, strength: 0.3 }} />
      </Motion>

      {/* callout 1: dot on the sensor, line out to the left, 33 MP full-frame */}
      <Leader
        points={[SENSOR, { x: 100, y: SENSOR.y }]}
        dotAt={t(P.callout1.dot)}
        lineAt={t(P.callout1.line)}
        lineDur={P.callout1.lineDur}
        exitAt={t(P.exit)}
      />
      <Motion box={{ left: 96, top: SENSOR.y - 122, w: 400, h: 110 }} keys={[exit(0)]}>
        <WordLine
          size={96}
          weight={500}
          dur={10}
          style={{ justifyContent: "flex-start" }}
          words={[
            {
              text: (
                <>
                  33<Small k={0.5}> MP</Small>
                </>
              ),
              at: t(P.callout1.label),
            },
          ]}
        />
      </Motion>
      <Motion box={{ left: 96, top: SENSOR.y + 16, w: 400, h: 60 }} keys={[exit(1)]}>
        <WordLine
          size={40}
          weight={300}
          color={C.border}
          dur={10}
          style={{ justifyContent: "flex-start" }}
          words={[{ text: "full-frame", at: t(P.callout1.label + 2) }]}
        />
      </Motion>

      {/* G badge -> G MASTER seal */}
      <Leader
        points={[{ x: BADGE.x + 16, y: BADGE.y }, { x: SEAL_L - 18, y: BADGE.y }]}
        dotAt={t(P.seal.line)}
        lineAt={t(P.seal.line)}
        lineDur={P.seal.lineDur}
        exitAt={t(P.exit)}
        showDot={false}
      />
      <Motion
        box={{ left: SEAL_L, top: BADGE.y - (SEAL_W * 94.03) / 373.652 / 2, w: SEAL_W, h: (SEAL_W * 94.03) / 373.652 }}
        keys={[exit(1)]}
      >
        <GMasterSeal width={SEAL_W} wipeAt={t(P.seal.wipe)} wipeDur={P.seal.wipeDur} glintAt={t(P.seal.glint)} />
      </Motion>

      {/* callout 2: 695 g */}
      <Leader
        points={[WEIGHT_DOT, { x: 980, y: WEIGHT_Y }]}
        dotAt={t(P.callout2.dot)}
        lineAt={t(P.callout2.line)}
        lineDur={P.callout2.lineDur}
        exitAt={t(P.exit)}
      />
      <Motion box={{ left: SEAL_L - 6, top: WEIGHT_Y - 122, w: 420, h: 110 }} keys={[exit(2)]}>
        <WordLine
          size={96}
          weight={500}
          dur={10}
          style={{ justifyContent: "flex-start" }}
          words={[
            {
              text: (
                <>
                  695<Small k={0.5}> g</Small>
                </>
              ),
              at: t(P.callout2.label),
            },
          ]}
        />
      </Motion>

      {/* level 2/2 */}
      <Motion box={{ left: 0, top: 262, w: 1080, h: 40 }} keys={[exit(0)]}>
        <LevelBar level={2} start={t(P.bar.start)} dur={P.bar.dur} />
      </Motion>

      {/* α7 V / + 24-70 mm GM II */}
      <Motion box={{ left: 0, top: 1606, w: 1080, h: 110 }} keys={[exit(2)]}>
        <WordLine
          size={100}
          dur={10}
          words={[
            {
              text: (
                <Img
                  src={staticFile("brand/a7v-logotype-white.png")}
                  style={{ height: 92, width: (92 * 446) / 152, display: "block" }}
                />
              ),
              at: t(P.name),
            },
          ]}
        />
      </Motion>
      <Motion box={{ left: 0, top: 1726, w: 1080, h: 60 }} keys={[exit(3)]}>
        <WordLine
          size={46}
          weight={300}
          color={C.border}
          dur={10}
          words={[
            {
              text: (
                <>
                  + 24-70 <Small>mm</Small> <Small>GM II</Small>
                </>
              ),
              at: t(P.sub),
            },
          ]}
        />
      </Motion>
    </AbsoluteFill>
  );
};
