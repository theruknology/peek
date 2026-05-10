// Single source of truth for color + font tokens.
// Restrained palette: near-black bg, white text, one accent.

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

const inter = loadInter();
const jb = loadJetBrains();

export const colors = {
  bg: "#0a0a0a",
  bgDeep: "#000000",
  surface: "#111114",
  surfaceHi: "#16161b",
  border: "#23232b",
  text: "#f5f5f7",
  textDim: "#9a9aa3",
  textFaint: "#5a5a63",
  accent: "#a78bfa", // electric purple — chosen accent
  accentDim: "rgba(167, 139, 250, 0.18)",
  accentGlow: "rgba(167, 139, 250, 0.55)",
  red: "#ff5f57",
  yellow: "#febc2e",
  green: "#28c840",
} as const;

export const fonts = {
  // Inter for all UI / labels / wordmark — tighter, more modern
  sans: `${inter.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`,
  // JetBrains Mono only for terminal output + code
  mono: `${jb.fontFamily}, "SF Mono", Menlo, Consolas, monospace`,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;
