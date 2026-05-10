import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts, radii } from "../styles";

type Props = {
  label: string;
  /** Frame at which the key is pressed (relative to current sequence). */
  pressFrame?: number;
  /** Frame at which the key appears. */
  appearFrame?: number;
  size?: number;
  width?: number;
  glow?: boolean;
};

export const Key: React.FC<Props> = ({
  label,
  pressFrame,
  appearFrame = 0,
  size = 88,
  width,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Appear with spring scale-in.
  const appear = spring({
    frame: frame - appearFrame,
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.6 },
  });
  const appearScale = interpolate(appear, [0, 1], [0.7, 1]);
  const appearOpacity = interpolate(appear, [0, 1], [0, 1]);

  // Press: depress for ~6 frames, then release.
  let pressY = 0;
  let pressScale = 1;
  let pressGlow = 0;
  if (pressFrame !== undefined) {
    const dp = frame - pressFrame;
    if (dp >= 0 && dp <= 18) {
      const down = interpolate(dp, [0, 4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const up = interpolate(dp, [4, 14], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const env = dp <= 4 ? down : up;
      pressY = env * 6;
      pressScale = 1 - env * 0.04;
      pressGlow = env;
    } else if (dp > 18) {
      pressGlow = 0;
    }
  }

  const w = width ?? size;
  return (
    <div
      style={{
        width: w,
        height: size,
        opacity: appearOpacity,
        transform: `scale(${appearScale * pressScale}) translateY(${pressY}px)`,
        background: `linear-gradient(180deg, ${colors.surfaceHi} 0%, ${colors.surface} 100%)`,
        border: `1px solid ${colors.border}`,
        borderBottom: `2px solid ${colors.border}`,
        borderRadius: radii.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.mono,
        color: colors.text,
        fontSize: Math.round(size * 0.28),
        boxShadow: glow
          ? `0 0 ${24 * pressGlow}px ${pressGlow * 0.85} ${colors.accentGlow}, 0 4px 0 ${colors.bgDeep}`
          : `0 4px 0 ${colors.bgDeep}`,
        transition: "none",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
};
