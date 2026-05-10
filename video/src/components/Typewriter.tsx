import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "../styles";

type Props = {
  text: string;
  /** Frame within the current sequence at which typing begins. */
  startFrame?: number;
  /** Average frames per character (lower = faster). */
  cps?: number;
  /** Show a blinking caret while typing and after. */
  caret?: boolean;
  style?: React.CSSProperties;
  caretColor?: string;
};

// Deterministic pseudo-random in [0,1) from an integer seed.
const rand = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export const Typewriter: React.FC<Props> = ({
  text,
  startFrame = 0,
  cps = 2.2,
  caret = true,
  style,
  caretColor,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);

  // Build cumulative per-char durations with deterministic jitter so the
  // typing has a human cadence (slight slowdowns near punctuation, fast bursts).
  let charsShown = 0;
  let acc = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let dur = cps;
    // Small randomness, deterministic per char index.
    dur *= 0.7 + rand(i + 1) * 0.7;
    if (ch === " ") dur *= 0.6;
    if (ch === "." || ch === "," || ch === "?" || ch === "!") dur *= 2.2;
    acc += dur;
    if (acc <= elapsed) {
      charsShown = i + 1;
    } else {
      break;
    }
  }

  const visible = text.slice(0, charsShown);
  const caretOn = caret && Math.floor(frame / 15) % 2 === 0;
  const done = charsShown >= text.length;

  return (
    <span style={{ whiteSpace: "pre", ...style }}>
      {visible}
      {caret && (
        <span
          style={{
            display: "inline-block",
            width: "0.55em",
            marginLeft: 1,
            background: caretOn ? (caretColor ?? colors.accent) : "transparent",
            color: "transparent",
            borderRadius: 1,
          }}
        >
          {done ? " " : ""}
        </span>
      )}
    </span>
  );
};
