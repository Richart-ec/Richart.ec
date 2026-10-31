import { Easing } from "remotion";

// Cubic-bezier presets. Every movement in the spot uses one of these.
export const EASE = {
  // fast start, long soft landing: entrances
  out: Easing.bezier(0.16, 1, 0.3, 1),
  // slow start, violent end: exits / whip pans
  in: Easing.bezier(0.7, 0, 0.84, 0),
  // symmetric, for camera-like moves
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  // whip: almost no time spent at the extremes
  whip: Easing.bezier(0.83, 0, 0.17, 1),
  // gentle, for light and slow drifts
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  // slight overshoot for small UI accents
  back: Easing.bezier(0.34, 1.4, 0.64, 1),
  linear: (t: number) => t,
} as const;

export type EaseName = keyof typeof EASE;

// Use instead of Infinity in interpolate ranges.
export const FOREVER = 100000;
