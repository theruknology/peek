import React from "react";
import {
  AbsoluteFill,
  Easing,
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

  // Wordmark: blur-in + scale w/ deep spring
  const wordmark = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 90, mass: 1.1 },
  });
  const wordmarkOp = interpolate(wordmark, [0, 1], [0, 1]);
  const wordmarkScale = interpolate(wordmark, [0, 1], [1.08, 1]);
  const wordmarkBlur = interpolate(wordmark, [0, 1], [22, 0]);
  const wordmarkY = interpolate(wordmark, [0, 1], [16, 0]);

  // Per-character cascade for "peek"
  const chars = "peek".split("");

  // Tagline reveal — clip-path wipe driven by spring
  const tag = spring({
    frame: frame - 18,
    fps,
    config: { damping: 26, stiffness: 90, mass: 1 },
  });
  const tagClip = interpolate(tag, [0, 1], [100, 0]);
  const tagOp = interpolate(tag, [0, 1], [0, 1]);
  const tagY = interpolate(tag, [0, 1], [10, 0]);

  // Underline — width grows w/ ease, then breathes
  const underline = spring({
    frame: frame - 32,
    fps,
    config: { damping: 30, stiffness: 70, mass: 1.1 },
  });
  const underlineW = interpolate(underline, [0, 1], [0, 1]);
  const underlineGlow = 0.4 + Math.sin((frame / 22) * Math.PI) * 0.25;

  // Background radial accent that drifts
  const driftX = interpolate(frame, [0, durationInFrames], [-10, 10], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const driftY = interpolate(frame, [0, durationInFrames], [-6, 6], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });

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
        overflow: "hidden",
      }}
    >
      {/* Soft drifting radial accent in background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(60% 50% at ${50 + driftX}% ${50 + driftY}%, ${colors.accentDim}, transparent 70%)`,
          filter: "blur(40px)",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: wordmarkOp,
            transform: `translateY(${wordmarkY}px) scale(${wordmarkScale})`,
            filter: `blur(${wordmarkBlur}px)`,
            display: "flex",
            alignItems: "baseline",
          }}
        >
          {chars.map((c, i) => {
            const charSpring = spring({
              frame: frame - 4 - i * 3,
              fps,
              config: { damping: 20, stiffness: 110, mass: 0.9 },
            });
            const charY = interpolate(charSpring, [0, 1], [22, 0]);
            const charOp = interpolate(charSpring, [0, 1], [0, 1]);
            return (
              <span
                key={i}
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 240,
                  fontWeight: 800,
                  letterSpacing: -14,
                  color: colors.text,
                  lineHeight: 1,
                  display: "inline-block",
                  transform: `translateY(${charY}px)`,
                  opacity: charOp,
                }}
              >
                {c}
              </span>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -20,
              height: 5,
              borderRadius: 3,
              background: colors.accent,
              transform: `scaleX(${underlineW})`,
              transformOrigin: "left center",
              boxShadow: `0 0 ${28 * underlineGlow}px ${colors.accentGlow}`,
            }}
          />
        </div>
        <div
          style={{
            overflow: "hidden",
            opacity: tagOp,
            transform: `translateY(${tagY}px)`,
            clipPath: `inset(0 ${tagClip}% 0 0)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontSize: 36,
              fontWeight: 500,
              color: colors.textDim,
              letterSpacing: -0.6,
              whiteSpace: "nowrap",
            }}
          >
            Cmd-K for your terminal scrollback.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
