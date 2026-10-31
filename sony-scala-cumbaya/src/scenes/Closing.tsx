import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import cues from "../timeline/cues.json";
import { EASE } from "../lib/ease";
import { Mask, Motion } from "../lib/Motion";
import { SonyWordmark } from "../components/SonyWordmark";
import { Letters, T, WordLine } from "../components/Type";
import { LightPool } from "../components/Atmosphere";

const K = cues.closing;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const LOGO_W = 520;
const LOGO_H = (LOGO_W * 88.03) / 500;
const SCALA_H = 270;
const SCALA_W = (SCALA_H * 326) / 472;

const Pin: React.FC<{ readonly size: number }> = ({ size }) => (
  <svg width={size * 0.68} height={size} viewBox="0 0 24 35" aria-hidden style={{ display: "block", overflow: "visible" }}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 8.6 12 23 12 23s12-14.4 12-23C24 5.37 18.63 0 12 0z" fill="#FFFFFF" />
    <circle cx={12} cy={11.6} r={4.4} fill="#000000" />
  </svg>
);

/** 12.3–15 s: everything is born from the flash, each element with its own move. */
export const Closing: React.FC<{ readonly t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame() + t0;
  const t = (f: number) => f - t0;
  const light = interpolate(frame, [K.flash, K.flash + 24], [0, 1], { ...clamp, easing: EASE.soft });
  const shadow = interpolate(frame, [K.pin.start + 4, K.pin.start + 7, K.pin.start + K.pin.dur], [0, 1, 1], clamp);

  return (
    <AbsoluteFill>
      <LightPool cx={540} cy={700} rx={700} ry={520} rgb={[160, 168, 182]} intensity={light * 0.42} core={0.1} />
      <LightPool cx={540} cy={1370} rx={360} ry={300} rgb={[105, 19, 58]} intensity={light * 0.55} core={0.05} />

      {/* SONY: letters drop in one by one; accent shine on the hit (13.0 s) */}
      <div style={{ position: "absolute", left: (1080 - LOGO_W) / 2, top: 600 - LOGO_H / 2 }}>
        <SonyWordmark
          width={LOGO_W}
          at={K.sonyLetters.map(t)}
          dur={K.sonyLetterDur}
          mode="drop"
          revealColor="#DCDCE0"
          shine={{ start: t(K.accent - 3), dur: 18, bloom: 0.8 }}
          pulseAt={t(K.accent)}
        />
      </div>

      {/* Visítanos en */}
      <div style={{ position: "absolute", left: 0, top: 798, width: 1080 }}>
        <WordLine
          size={62}
          weight={300}
          color="#D9D9DE"
          dur={K.wordDur}
          words={[
            { text: "Visítanos", at: t(K.words[0]) },
            { text: "en", at: t(K.words[1]) },
          ]}
        />
      </div>

      {/* Scala Shopping, letter by letter */}
      <div style={{ position: "absolute", left: 0, top: 880, width: 1080 }}>
        <Letters
          text="Scala Shopping"
          size={112}
          weight={500}
          start={t(K.scalaStart)}
          stagger={K.scalaStagger}
          dur={K.scalaDur}
          tracking={-0.005}
        />
      </div>

      {/* pin drops onto Cumbayá */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 1040,
          width: 1080,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 16,
        }}
      >
        <div style={{ position: "relative", width: 40, height: 58 }}>
          <div
            style={{
              position: "absolute",
              left: 2,
              top: 56,
              width: 36,
              height: 8,
              borderRadius: "50%",
              background: "radial-gradient(closest-side, rgba(255,255,255,0.35), rgba(255,255,255,0))",
              opacity: shadow,
            }}
          />
          <Motion
            box={{ left: 0, top: 0, w: 40, h: 58 }}
            origin="50% 100%"
            from={{ y: -170, opacity: 0, blur: 4 }}
            keys={[
              { at: t(K.pin.start), dur: 7, y: 0, opacity: 1, blur: 0, ease: "in" },
              { at: t(K.pin.start + 7), dur: 2, y: -16, scale: 1, ease: "out" },
              { at: t(K.pin.start + 9), dur: 2, y: 0, ease: "in" },
            ]}
          >
            <Pin size={58} />
          </Motion>
        </div>
        <Mask padTop={20} padBottom={22}>
          <Motion from={{ y: 70, blur: 8, opacity: 0 }} keys={[{ at: t(K.place), dur: K.wordDur, y: 0, blur: 0, opacity: 1 }]}>
            <T size={58} weight={400} dur={0}>
              Cumbayá
            </T>
          </Motion>
        </Mask>
      </div>

      {/* Scala Shopping logo rises */}
      <Motion
        box={{ left: (1080 - SCALA_W) / 2, top: 1262, w: SCALA_W, h: SCALA_H }}
        from={{ y: 140, opacity: 0, blur: 10 }}
        keys={[{ at: t(K.logo.start), dur: K.logo.dur, y: 0, opacity: 1, blur: 0, ease: "out" }]}
      >
        <Img src={staticFile("brand/scala-shopping.png")} style={{ width: SCALA_W, height: SCALA_H, display: "block" }} />
      </Motion>
    </AbsoluteFill>
  );
};
