import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../styles";

type Props = { durationInFrames: number };

export const TitleCard: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wordmark spring-in
  const wordmark = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.8 },
  });
  const wordmarkScale = interpolate(wordmark, [0, 1], [0.92, 1]);
  const wordmarkOp = interpolate(wordmark, [0, 1], [0, 1]);

  // Tagline fades in slightly later
  const tag = spring({
    frame: frame - 14,
    fps,
    config: { damping: 22, stiffness: 100, mass: 0.9 },
  });
  const tagY = interpolate(tag, [0, 1], [12, 0]);
  const tagOp = interpolate(tag, [0, 1], [0, 1]);

  // Underline draws in (width 0 -> full)
  const underline = spring({
    frame: frame - 30,
    fps,
    config: { damping: 22, stiffness: 80, mass: 1 },
  });
  const underlineW = interpolate(underline, [0, 1], [0, 1]);

  // Outro fade
  const outOp = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bgDeep,
        alignItems: "center",
        justifyContent: "center",
        opacity: outOp,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: wordmarkOp,
            transform: `scale(${wordmarkScale})`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 200,
              fontWeight: 600,
              letterSpacing: -6,
              color: colors.text,
              lineHeight: 1,
            }}
          >
            peek
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -14,
              height: 4,
              borderRadius: 2,
              background: colors.accent,
              transform: `scaleX(${underlineW})`,
              transformOrigin: "left center",
              boxShadow: `0 0 22px ${colors.accentGlow}`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 32,
            color: colors.textDim,
            opacity: tagOp,
            transform: `translateY(${tagY}px)`,
            letterSpacing: 0.2,
          }}
        >
          Cmd-K for your terminal scrollback.
        </div>
      </div>
    </AbsoluteFill>
  );
};
