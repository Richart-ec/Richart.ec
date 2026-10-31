import { loadFont } from "@remotion/google-fonts/Roboto";

// Roboto stands in for Sony's proprietary SST (see references/BRAND-NOTES.md).
export const { fontFamily: ROBOTO } = loadFont("normal", {
  weights: ["300", "400", "500", "700"],
  subsets: ["latin", "latin-ext"],
});

// Measured on store.sony.com.ec (computed styles + VTEX theme tokens), see BRAND-NOTES.md
export const C = {
  black: "#000000",
  white: "#FFFFFF",
  title: "#2F353D",
  body: "#3F3F40",
  secondary: "#83838F",
  secondaryDark: "#54545F",
  border: "#CACBCC",
  action: "#F25529", // bg-action-primary
  bannerBlue: "#2D75C7", // banner CTA button
  link: "#4572ED",
  gMaster: "#CD4902",
  alpha: "#E94E09",
  scala: "#69133A",
} as const;

export const W = 1080;
export const H = 1920;
