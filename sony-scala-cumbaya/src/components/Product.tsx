import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE } from "../lib/ease";

/**
 * Product cut-out with an optional specular sweep. The sweep is a brightened
 * copy of the same PNG revealed through a moving gradient mask, so the glint
 * is confined to the product's own alpha.
 */
export const Product: React.FC<{
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly sweep?: { readonly start: number; readonly dur: number; readonly strength?: number };
}> = ({ src, width, height, sweep }) => {
  const frame = useCurrentFrame();
  const file = staticFile(src);
  let glint: React.ReactNode = null;
  if (sweep && frame >= sweep.start - 1 && frame <= sweep.start + sweep.dur + 1) {
    const p = interpolate(frame, [sweep.start, sweep.start + sweep.dur], [-30, 130], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.inOut,
    });
    const band = `linear-gradient(112deg, transparent ${p - 14}%, #000 ${p - 2}%, #000 ${p + 2}%, transparent ${p + 14}%)`;
    glint = (
      <Img
        src={file}
        style={{
          position: "absolute",
          inset: 0,
          width,
          height,
          filter: "brightness(3.2) contrast(1.15) saturate(0.6)",
          maskImage: band,
          WebkitMaskImage: band,
          mixBlendMode: "screen",
          opacity: sweep.strength ?? 0.42,
        }}
      />
    );
  }
  return (
    <div style={{ position: "relative", width, height }}>
      <Img src={file} style={{ position: "absolute", inset: 0, width, height }} />
      {glint}
    </div>
  );
};
