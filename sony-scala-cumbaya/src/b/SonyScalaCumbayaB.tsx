import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import B from "../timeline/cuesB.json";
import meta from "../lib/productMeta.json";
import { C, ROBOTO } from "../lib/brand";
import { EASE } from "../lib/ease";
import { Motion, MotionKey } from "../lib/Motion";
import { Product } from "../components/Product";
import { Letters, T, WordLine } from "../components/Type";
import { AlphaGlyph, Small } from "../components/UI";
import { Flash, Grain, LightPool, Vignette } from "../components/Atmosphere";
import { SonyWordmark } from "../components/SonyWordmark";
import { PhotoCard, Viewfinder, afPosition } from "./Viewfinder";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const KIT = meta["a6400-kit"];
const CAM = meta["a7v-body"];
const LENS = meta["sel2470gm2"];
type AfKey = [number, number, number];

const big = (size: number, weight: 300 | 400 | 500 | 700 = 700): React.CSSProperties => ({
  fontFamily: ROBOTO,
  fontSize: size,
  fontWeight: weight,
  color: "#FFFFFF",
  letterSpacing: "-0.015em",
  lineHeight: 1,
  whiteSpace: "pre",
});

/** One giant word that slams in (scale + rack focus + zoom/motion blur). */
const Slam: React.FC<{
  readonly text: string;
  readonly at: number;
  readonly top: number;
  readonly size: number;
  readonly exit: readonly MotionKey[];
  readonly color?: string;
}> = ({ text, at, top, size, exit, color = "#FFFFFF" }) => (
  <Motion
    box={{ left: 0, top, w: 1080, h: size * 1.2 }}
    from={{ scale: 1.7, blur: 22, opacity: 0 }}
    keys={[{ at, dur: 6, scale: 1, blur: 0, opacity: 1, ease: "out" }, ...exit]}
    zoomRadius={420}
  >
    <div style={{ display: "flex", justifyContent: "center", ...big(size), color }}>{text}</div>
  </Motion>
);

// ---------------------------------------------------------------- 1 · hook (0–45)
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const H = B.hook;
  const af = afPosition(frame, H.af as unknown as AfKey[], { x: 540, y: 960 });
  const vf = interpolate(frame, [0, 1, 2, 3], [0, 1, 0.55, 1], clamp);
  return (
    <AbsoluteFill>
      <LightPool cx={540} cy={960} rx={700} ry={700} rgb={[140, 150, 165]} intensity={0.35} core={0.05} />
      <Slam text="ENFOCA." at={H.words[0]} top={866} size={188} exit={[{ at: H.wordExit, dur: 4, scale: 0.86, opacity: 0, blur: 12, ease: "in" }]} />
      <Slam text="DISPARA." at={H.words[1]} top={866} size={188} exit={[{ at: H.shutter, dur: 2, opacity: 0, ease: "in" }]} />
      <Viewfinder
        opacity={vf * interpolate(frame, [H.shutter, H.shutter + 2], [1, 0], clamp)}
        af={{
          x: af.x,
          y: af.y,
          // small tracking square; on focus it snaps to the subject (the word)
          w: interpolate(frame, [H.afLock - 3, H.afLock + 2], [104, 860], { ...clamp, easing: EASE.out }),
          h: interpolate(frame, [H.afLock - 3, H.afLock + 2], [104, 230], { ...clamp, easing: EASE.out }),
          pulse: interpolate(frame, [H.afLock, H.afLock + 2, H.afLock + 10], [0, 1, 0], clamp),
          visible: frame >= 2 && frame < H.shutter,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2 · 30 fps burst (45–122)
const SHOTS = [
  { src: KIT.file, w: KIT.width, h: KIT.height, tint: "#1d4d8c", fit: 0.86 },
  { src: CAM.file, w: CAM.width, h: CAM.height, tint: "#8a3410", fit: 0.82 },
  { src: LENS.file, w: LENS.width, h: LENS.height, tint: "#6b2306", fit: 0.6 },
];
const CARD_W = 560;
const CARD_H = 700;

const Card: React.FC<{ readonly i: number }> = ({ i }) => {
  const R = B.burst;
  const at = R.start + i;
  const p = SHOTS[i % 3];
  const dx = (random(`dx${i}`) - 0.5) * 120;
  const dy = (random(`dy${i}`) - 0.5) * 90;
  const rot = (random(`r${i}`) - 0.5) * 16;
  const inner = CARD_W - 28;
  const pw = inner * p.fit;
  const ph = Math.min((pw * p.h) / p.w, (CARD_H - 28) * 0.8);
  const pw2 = (ph * p.w) / p.h;
  return (
    <Motion
      box={{ left: 540 - CARD_W / 2, top: 1050 - CARD_H / 2, w: CARD_W, h: CARD_H }}
      from={{ scale: 1.35, opacity: 0, blur: 8, x: dx * 4, y: dy * 4 + 200, rotate: rot * 2.5 }}
      keys={[
        { at, dur: 5, scale: 1, opacity: 1, blur: 0, x: dx, y: dy, rotate: rot, ease: "out" },
        { at: R.exit + (i % 6) * 0.5, dur: 7, y: -2100, rotate: rot * 3, ease: "in" },
      ]}
    >
      <PhotoCard w={CARD_W} h={CARD_H} tint={p.tint}>
        <Img src={staticFile(p.src)} style={{ width: pw2, height: ph }} />
      </PhotoCard>
    </Motion>
  );
};

const Burst: React.FC = () => {
  const frame = useCurrentFrame();
  const R = B.burst;
  const shots = Math.max(0, Math.min(R.count, frame - R.start + 1));
  const fpsIn = interpolate(frame, [R.fpsLabel, R.fpsLabel + 6], [0, 1], { ...clamp, easing: EASE.out });
  const out = interpolate(frame, [R.exit, R.exit + 6], [1, 0], { ...clamp, easing: EASE.in });
  // only the newest ~9 cards are visible on the stack
  const first = Math.max(0, shots - 10);
  return (
    <AbsoluteFill>
      <LightPool cx={540} cy={1050} rx={760} ry={760} rgb={[242, 85, 41]} intensity={0.55 * out} core={0.06} />
      {Array.from({ length: R.count }, (_, i) => i)
        .filter((i) => i >= first || frame >= R.exit)
        .filter((i) => frame >= R.start + i - 1)
        .map((i) => (
          <Card key={i} i={i} />
        ))}
      {/* the counter becomes the claim: 01 … 30 → 30 fps */}
      <div style={{ position: "absolute", left: 0, top: 200, width: 1080, opacity: frame >= R.start ? out : 0, textAlign: "center" }}>
        <div style={{ ...big(40, 400), color: C.border, letterSpacing: "0.18em", opacity: fpsIn, height: 52 }}>HASTA</div>
        <div style={{ ...big(200, 700), fontVariantNumeric: "tabular-nums" }}>
          {String(shots).padStart(2, "0")}
          <span style={{ fontSize: 96, fontWeight: 500, opacity: fpsIn, marginLeft: 18 }}>fps</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 1460, width: 1080, display: "flex", justifyContent: "center", opacity: fpsIn * out }}>
        <Img src={staticFile("brand/a7v-logotype-white.png")} style={{ height: 84, width: (84 * 446) / 152 }} />
      </div>
      <Viewfinder opacity={interpolate(frame, [R.start, R.start + 1, R.exit - 6, R.exit], [0, 1, 1, 0], clamp)} shots={shots} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3 · split: EMPIEZA / AVANZA (120–222)
const Split: React.FC = () => {
  const S = B.split;
  const KW = 720;
  const KH = (KIT.height * KW) / KIT.width;
  const CW = 520;
  const CH = (CAM.height * CW) / CAM.width;
  const LH = 400;
  const LW = (LENS.width * LH) / LENS.height;
  const half = (side: "top" | "bottom"): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    clipPath: side === "top" ? "polygon(0 0, 100% 0, 100% 46%, 0 54%)" : "polygon(0 54%, 100% 46%, 100% 100%, 0 100%)",
  });
  return (
    <AbsoluteFill>
      <Motion
        box={{ left: 0, top: 0, w: 1080, h: 1920 }}
        from={{ x: -1200 }}
        keys={[
          { at: S.in, dur: S.inDur, x: 0, ease: "whip" },
          { at: S.exit, dur: 9, y: -1300, ease: "in" },
        ]}
      >
        <div style={{ ...half("top"), background: "radial-gradient(ellipse 80% 60% at 50% 30%, #12345f 0%, #050a12 70%)" }}>
          <div style={{ position: "absolute", left: 0, top: 150, width: 1080 }}>
            <WordLine size={150} weight={700} dur={8} words={[{ text: "EMPIEZA", at: S.top }]} />
          </div>
          <div style={{ position: "absolute", left: (1080 - KW) / 2, top: 345 }}>
            <Product src={KIT.file} width={KW} height={KH} sweep={{ start: S.top + 10, dur: 16 }} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 735, width: 1080 }}>
            <WordLine
              size={84}
              weight={500}
              dur={8}
              words={[
                {
                  text: (
                    <>
                      <AlphaGlyph fontSize={84} />
                      6400
                    </>
                  ),
                  at: S.top + 4,
                },
              ]}
            />
          </div>
        </div>
        <Motion box={{ left: 0, top: 838, w: 1080, h: 60 }} from={{ scale: 0.6, opacity: 0 }} keys={[{ at: S.badge, dur: 7, scale: 1, opacity: 1, ease: "back" }]}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                ...big(30, 700),
                letterSpacing: "0.12em",
                background: C.bannerBlue,
                padding: "12px 24px 10px",
                borderRadius: 4,
                rotate: "-2.3deg",
              }}
            >
              N.º 1 EN VENTAS*
            </div>
          </div>
        </Motion>
      </Motion>

      <Motion
        box={{ left: 0, top: 0, w: 1080, h: 1920 }}
        from={{ x: 1200 }}
        keys={[
          { at: S.in + 3, dur: S.inDur, x: 0, ease: "whip" },
          { at: S.exit + 1, dur: 9, y: 1300, ease: "in" },
        ]}
      >
        <div style={{ ...half("bottom"), background: "radial-gradient(ellipse 80% 60% at 50% 72%, #5c2108 0%, #120604 70%)" }}>
          <div style={{ position: "absolute", left: 0, top: 1060, width: 1080 }}>
            <WordLine size={150} weight={700} dur={8} words={[{ text: "AVANZA", at: S.bottom }]} />
          </div>
          <div style={{ position: "absolute", left: 90, top: 1290 }}>
            <Product src={CAM.file} width={CW} height={CH} sweep={{ start: S.bottom + 10, dur: 16 }} />
          </div>
          <div style={{ position: "absolute", left: 1080 - 90 - LW, top: 1250 }}>
            <Product src={LENS.file} width={LW} height={LH} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 1680, width: 1080 }}>
            <WordLine
              size={50}
              weight={400}
              color="#E6E6EA"
              dur={8}
              words={[
                {
                  text: (
                    <>
                      α7 V · 33 <Small>MP</Small> · G Master
                    </>
                  ),
                  at: S.bottom + 6,
                },
              ]}
            />
          </div>
          <div style={{ position: "absolute", left: 0, top: 1780, width: 1080 }}>
            <WordLine
              size={22}
              weight={400}
              color={C.secondary}
              dur={8}
              blur={3}
              words={[{ text: "*Cámara n.º 1 en ventas en store.sony.com.ec (categoría Cámaras), al 31/10/2026.", at: S.footnote }]}
            />
          </div>
        </div>
      </Motion>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4 · kinetic slams (222–306)
const Kinetic: React.FC = () => {
  const frame = useCurrentFrame();
  const K = B.kinetic;
  // short decaying camera shake on every slam
  let sx = 0;
  let sy = 0;
  K.words.forEach((w, i) => {
    const d = frame - w;
    if (d >= 0 && d < 8) {
      const a = 14 * Math.exp(-d / 2.5);
      sx += Math.sin(d * 2.7 + i) * a;
      sy += Math.cos(d * 3.1 + i) * a;
    }
  });
  const strobe = (at: number, rgb: string) => {
    const o = interpolate(frame, [at, at + 1, at + 7], [0, 0.3, 0], clamp);
    return o > 0.001 ? <AbsoluteFill style={{ background: rgb, opacity: o }} /> : null;
  };
  const out = (i: number): MotionKey[] => [{ at: K.exit + i, dur: 8, y: -1500, ease: "in" }];
  return (
    <AbsoluteFill>
      {strobe(K.words[0], C.bannerBlue)}
      {strobe(K.words[1], C.action)}
      {strobe(K.words[2], "#FFFFFF")}
      <AbsoluteFill style={{ translate: `${sx}px ${sy}px` }}>
        <Slam text="PRUÉBALAS" at={K.words[0]} top={650} size={172} exit={out(0)} />
        <Slam text="EN TUS" at={K.words[1]} top={850} size={172} exit={out(1)} color={C.action} />
        <Slam text="MANOS." at={K.words[2]} top={1050} size={172} exit={out(2)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5 · end card through the viewfinder (300–450)
const End: React.FC = () => {
  const frame = useCurrentFrame();
  const E = B.end;
  const af = afPosition(frame, E.af as unknown as AfKey[], { x: 540, y: 540 });
  const vf = interpolate(frame, [E.in, E.in + 6, E.shutter, E.shutter + 1], [0, 1, 1, 0], clamp);
  const SCALA_H = 300;
  const SCALA_W = (SCALA_H * 326) / 472;
  const light = interpolate(frame, [E.in, E.in + 20], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <LightPool cx={540} cy={640} rx={760} ry={560} rgb={[150, 160, 176]} intensity={light * 0.4} core={0.08} />
      <LightPool cx={540} cy={1210} rx={420} ry={360} rgb={[105, 19, 58]} intensity={light * 0.7} core={0.05} />
      <div style={{ position: "absolute", left: (1080 - 420) / 2, top: 300 }}>
        <SonyWordmark width={420} at={E.sonyLetters} dur={12} mode="drop" revealColor="#DCDCE0" shine={{ start: E.shutter + 2, dur: 18, bloom: 0.8 }} pulseAt={E.shutter} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 500, width: 1080 }}>
        <WordLine size={72} weight={400} color="#E8E8EC" dur={9} words={[{ text: "Sony", at: E.store }, { text: "Store", at: E.store + 2 }]} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 596, width: 1080 }}>
        <Letters text="Scala Shopping" size={118} weight={700} start={E.scala} stagger={0.6} dur={7} tracking={-0.01} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 760, width: 1080, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16 }}>
        <Motion box={{ left: 0, top: 0, w: 44, h: 64 }} style={{ position: "relative" }} from={{ y: -180, opacity: 0 }} keys={[{ at: E.pin, dur: 7, y: 0, opacity: 1, ease: "in" }, { at: E.pin + 7, dur: 2, y: -16, ease: "out" }, { at: E.pin + 9, dur: 2, y: 0, ease: "in" }]}>
          <svg width={44} height={64} viewBox="0 0 24 35" aria-hidden style={{ display: "block" }}>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 8.6 12 23 12 23s12-14.4 12-23C24 5.37 18.63 0 12 0z" fill={C.action} />
            <circle cx={12} cy={11.6} r={4.4} fill="#000000" />
          </svg>
        </Motion>
        <Motion from={{ y: 50, opacity: 0, blur: 8 }} keys={[{ at: E.pin + 2, dur: 9, y: 0, opacity: 1, blur: 0 }]} style={{ display: "inline-block" }}>
          <T size={66} weight={500} dur={0}>
            Cumbayá
          </T>
        </Motion>
      </div>
      <div style={{ position: "absolute", left: 0, top: 870, width: 1080 }}>
        <WordLine size={40} weight={400} color={C.border} dur={9} words={[{ text: "Segunda planta alta · Local L321", at: E.address }]} />
      </div>
      <Motion box={{ left: (1080 - SCALA_W) / 2, top: 1210 - SCALA_H / 2, w: SCALA_W, h: SCALA_H }} from={{ y: 160, opacity: 0, blur: 10 }} keys={[{ at: E.logo, dur: 14, y: 0, opacity: 1, blur: 0 }]}>
        <Img src={staticFile("brand/scala-shopping.png")} style={{ width: SCALA_W, height: SCALA_H, display: "block" }} />
      </Motion>
      <Viewfinder
        opacity={vf}
        af={{
          x: af.x,
          y: af.y,
          // tracks the information line by line, then snaps to the Scala Shopping sign
          w: interpolate(frame, [E.afLock - 4, E.afLock + 2], [110, 270], { ...clamp, easing: EASE.out }),
          h: interpolate(frame, [E.afLock - 4, E.afLock + 2], [110, 360], { ...clamp, easing: EASE.out }),
          pulse: interpolate(frame, [E.afLock, E.afLock + 2, E.afLock + 10], [0, 1, 0], clamp),
          visible: frame >= E.af[0][0] - 2,
        }}
      />
    </AbsoluteFill>
  );
};

export const SonyScalaCumbayaB: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Sequence name="B1 · Visor: ENFOCA / DISPARA" durationInFrames={48}>
        <Hook />
      </Sequence>
      <Sequence name="B2 · Ráfaga 30 fps" from={44} durationInFrames={86}>
        <OffsetFrame from={44}>
          <Burst />
        </OffsetFrame>
      </Sequence>
      <Sequence name="B3 · Empieza / Avanza" from={118} durationInFrames={110}>
        <OffsetFrame from={118}>
          <Split />
        </OffsetFrame>
      </Sequence>
      <Sequence name="B4 · Pruébalas en tus manos" from={222} durationInFrames={90}>
        <OffsetFrame from={222}>
          <Kinetic />
        </OffsetFrame>
      </Sequence>
      <Sequence name="B5 · Sony Store Scala Shopping" from={298} durationInFrames={152}>
        <OffsetFrame from={298}>
          <End />
        </OffsetFrame>
      </Sequence>

      <Flash at={B.hook.shutter} />
      <Flash at={B.end.shutter} />
      <Vignette strength={0.55} />
      <Grain />
      <Audio name="Mezcla B (música + SFX)" src={staticFile("audio/sony-scala-mix-b.wav")} />
    </AbsoluteFill>
  );
};

/**
 * Scenes in option B are written in global frames (same numbers as cuesB.json).
 * Sequence shifts useCurrentFrame(), so this wrapper shifts it back.
 */
const OffsetFrame: React.FC<{ readonly from: number; readonly children: React.ReactNode }> = ({ from, children }) => (
  <Sequence from={-from} layout="none">
    {children}
  </Sequence>
);
