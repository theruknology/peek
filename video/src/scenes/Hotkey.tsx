import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";
import { Key } from "../components/Key";

type Props = { durationInFrames: number };

export const Hotkey: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Label fade-in
  const label = spring({
    frame: frame - 4,
    fps,
    config: { damping: 22, stiffness: 100, mass: 0.9 },
  });
  const labelOp = interpolate(label, [0, 1], [0, 1]);
  const labelY = interpolate(label, [0, 1], [10, 0]);

  // Press both keys together at frame ~58 (about 2s into 3s)
  const pressFrame = 58;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bgDeep,
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeOut,
        flexDirection: "column",
        gap: 56,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 28,
          color: colors.textDim,
          opacity: labelOp,
          transform: `translateY(${labelY}px)`,
          letterSpacing: 0.4,
        }}
      >
        inside tmux, press
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Key label="prefix" appearFrame={6} pressFrame={pressFrame} width={170} size={96} />
        <Plus />
        <Key label="Ctrl" appearFrame={14} pressFrame={pressFrame} width={130} size={96} />
        <Plus />
        <Key label="K" appearFrame={22} pressFrame={pressFrame} width={96} size={96} />
      </div>

      <Caption frame={frame} />
    </AbsoluteFill>
  );
};

const Plus: React.FC = () => (
  <div
    style={{
      fontFamily: fonts.mono,
      fontSize: 44,
      color: colors.textFaint,
      lineHeight: 1,
    }}
  >
    +
  </div>
);

const Caption: React.FC<{ frame: number }> = ({ frame }) => {
  const op = interpolate(frame, [62, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        fontSize: 22,
        color: colors.accent,
        opacity: op,
        letterSpacing: 0.3,
      }}
    >
      open peek
    </div>
  );
};
