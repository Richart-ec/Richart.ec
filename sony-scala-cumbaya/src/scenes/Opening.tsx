import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import cues from "../timeline/cues.json";
import { Motion, MotionKey } from "../lib/Motion";
import { SonyWordmark } from "../components/SonyWordmark";
import { WordLine } from "../components/Type";
import { LightPool } from "../components/Atmosphere";
import { EASE } from "../lib/ease";

const O = cues.opening;
const LOGO_W = 560;
const LOGO_H = (LOGO_W * 88.03) / 500;
// Same curve and window as the kit's entrance (offset one screen): a real pan.
const WHIP: MotionKey = { at: 0, dur: O.exitDur, x: -1300, ease: "whip" };

/** 0–2.6 s: SONY letters one by one, shine, logo rises, question below, whip-pan left. */
export const Opening: React.FC<{ readonly t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame() + t0; // global frame for the light
  const t = (f: number) => f - t0;
  const whip = (i: number): MotionKey => ({ ...WHIP, at: t(O.exit[i]) });

  // a faint neutral light under the logo, gone with the whip
  const light = interpolate(frame, [0, 20, O.exit[0], O.exit[0] + 8], [0, 0.55, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.soft,
  });

  return (
    <AbsoluteFill>
      <LightPool cx={540} cy={820} rx={760} ry={520} rgb={[150, 160, 175]} intensity={light * 0.5} core={0.12} />

      {/* SONY: group rises, then leaves with the whip */}
      <Motion
        box={{ left: (1080 - LOGO_W) / 2, top: 820 - LOGO_H / 2, w: LOGO_W, h: LOGO_H }}
        keys={[
          { at: t(O.rise.start), dur: O.rise.dur, y: -100, ease: "inOut" },
          whip(0),
        ]}
      >
        <SonyWordmark
          width={LOGO_W}
          at={O.letters.map(t)}
          dur={O.letterDur}
          mode="slide"
          shine={{ start: t(O.shine.start), dur: O.shine.dur }}
        />
      </Motion>

      {/* ¿Estás / empezando? — each line has its own whip exit */}
      <Motion box={{ left: 0, top: 880, w: 1080, h: 120 }} keys={[whip(1)]}>
        <WordLine size={104} weight={300} dur={O.wordDur} words={[{ text: "¿Estás", at: t(O.words[0]) }]} />
      </Motion>
      <Motion box={{ left: 0, top: 996, w: 1080, h: 120 }} keys={[whip(2)]}>
        <WordLine size={104} weight={300} dur={O.wordDur} words={[{ text: "empezando?", at: t(O.words[1]) }]} />
      </Motion>
    </AbsoluteFill>
  );
};
