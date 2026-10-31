import React from "react";
import { ROBOTO, C } from "../lib/brand";
import { Mask, Motion, MotionKey } from "../lib/Motion";
import { EaseName } from "../lib/ease";

export type WordSpec = {
  readonly text: React.ReactNode;
  readonly at: number;
  /** extra keys after the entrance, inside the mask (exits behind the line) */
  readonly after?: readonly MotionKey[];
  /** keys applied outside the mask (free-flying exits across the frame) */
  readonly exit?: readonly MotionKey[];
  readonly style?: React.CSSProperties;
};

type TypeProps = {
  readonly size: number;
  readonly weight?: 300 | 400 | 500 | 700;
  readonly color?: string;
  readonly tracking?: number; // em
  readonly dur: number;
  readonly ease?: EaseName;
  /** how far below the hard line the word starts, in em */
  readonly rise?: number;
  /** focus blur at the start of the entrance, screen px */
  readonly blur?: number;
  readonly upper?: boolean;
  readonly style?: React.CSSProperties;
};

const baseText = (p: TypeProps): React.CSSProperties => ({
  fontFamily: ROBOTO,
  fontSize: p.size,
  fontWeight: p.weight ?? 300,
  color: p.color ?? C.white,
  letterSpacing: `${p.tracking ?? 0}em`,
  lineHeight: 1.08,
  whiteSpace: "pre",
  textTransform: p.upper ? "uppercase" : undefined,
  fontKerning: "normal",
});

/**
 * A line of words. Each word has its own hard-line mask and its own entrance
 * (rise + rack focus + directional motion blur) and optional own exit.
 */
export const WordLine: React.FC<TypeProps & { readonly words: readonly WordSpec[]; readonly gap?: number }> = (props) => {
  const { words, size, dur, ease = "out", rise = 1.05, blur = 10, gap = 0.26 } = props;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: size * gap, ...props.style }}>
      {words.map((w, i) => (
        <Motion key={i} keys={w.exit ?? []} style={{ display: "inline-block" }}>
          <Mask padTop={size * 0.3} padBottom={size * 0.32} padX={size * 0.12}>
            <Motion
              from={{ y: size * rise * 1.08, blur, opacity: 0.0 }}
              keys={[{ at: w.at, dur, y: 0, blur: 0, opacity: 1, ease }, ...(w.after ?? [])]}
              style={{ display: "inline-block" }}
            >
              <span style={{ ...baseText(props), ...w.style }}>{w.text}</span>
            </Motion>
          </Mask>
        </Motion>
      ))}
    </div>
  );
};

/**
 * Letter-by-letter reveal (each glyph has its own mask and motion).
 */
export const Letters: React.FC<
  TypeProps & { readonly text: string; readonly start: number; readonly stagger: number }
> = (props) => {
  const { text, start, stagger, size, dur, ease = "out", rise = 0.9, blur = 8 } = props;
  const chars = Array.from(text);
  let n = 0;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", ...props.style }}>
      {chars.map((ch, i) => {
        if (ch === " ") {
          return <span key={i} style={{ ...baseText(props), width: size * 0.26 }}> </span>;
        }
        const at = start + n * stagger;
        n++;
        return (
          <Mask key={i} padTop={size * 0.3} padBottom={size * 0.3}>
            <Motion
              from={{ y: size * rise, blur, opacity: 0 }}
              keys={[{ at, dur, y: 0, blur: 0, opacity: 1, ease }]}
              style={{ display: "inline-block" }}
            >
              <span style={baseText(props)}>{ch}</span>
            </Motion>
          </Mask>
        );
      })}
    </div>
  );
};

/** Static text helper with the brand font. */
export const T: React.FC<TypeProps & { readonly children: React.ReactNode }> = (props) => (
  <span style={{ ...baseText(props), ...props.style }}>{props.children}</span>
);
