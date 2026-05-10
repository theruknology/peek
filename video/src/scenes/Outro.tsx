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

export const Outro: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Star: deep spring + spin entrance
  const starSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.9 },
  });
  const starOp = interpolate(starSpring, [0, 1], [0, 1]);
  const starScale = interpolate(starSpring, [0, 1], [0.4, 1]);
  const starRot = interpolate(starSpring, [0, 1], [-90, 0]);

  // Star pulse
  const pulse = Math.sin((frame / 26) * Math.PI) * 0.12;
  const starPulseScale = 1 + pulse;
  const starGlow = 0.5 + Math.sin((frame / 26) * Math.PI) * 0.3;

  // Wordmark
  const word = spring({
    frame: frame - 8,
    fps,
    config: { damping: 22, stiffness: 95, mass: 1 },
  });
  const wordOp = interpolate(word, [0, 1], [0, 1]);
  const wordY = interpolate(word, [0, 1], [14, 0]);
  const wordBlur = interpolate(word, [0, 1], [10, 0]);

  // Repo URL: clip wipe + fade
  const repo = spring({
    frame: frame - 22,
    fps,
    config: { damping: 26, stiffness: 90, mass: 1 },
  });
  const repoClip = interpolate(repo, [0, 1], [100, 0]);
  const repoOp = interpolate(repo, [0, 1], [0, 1]);
  const repoY = interpolate(repo, [0, 1], [10, 0]);

  // Underline draw under URL
  const repoUnderline = spring({
    frame: frame - 38,
    fps,
    config: { damping: 30, stiffness: 70, mass: 1 },
  });
  const repoUnderlineW = interpolate(repoUnderline, [0, 1], [0, 1]);

  // Background drift
  const driftY = interpolate(frame, [0, durationInFrames], [-8, 8], {
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });

  // Final fade-to-black
  const fade = interpolate(
    frame,
    [durationInFrames - 50, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bgDeep,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 48,
        opacity: fade,
        overflow: "hidden",
      }}
    >
      {/* Drifting accent radial */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(50% 40% at 50% ${50 + driftY}%, ${colors.accentDim}, transparent 70%)`,
          filter: "blur(50px)",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 28,
          opacity: starOp,
          transform: `translateY(${wordY}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            transform: `scale(${starScale * starPulseScale}) rotate(${starRot}deg)`,
            filter: `drop-shadow(0 0 ${28 * starGlow}px ${colors.accentGlow})`,
          }}
        >
          <Star />
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 132,
            fontWeight: 800,
            letterSpacing: -7,
            color: colors.text,
            lineHeight: 1,
            opacity: wordOp,
            filter: `blur(${wordBlur}px)`,
          }}
        >
          peek
        </div>
      </div>

      <div
        style={{
          position: "relative",
          opacity: repoOp,
          transform: `translateY(${repoY}px)`,
          zIndex: 1,
        }}
      >
        <div
          style={{
            overflow: "hidden",
            clipPath: `inset(0 ${repoClip}% 0 0)`,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 42,
              fontWeight: 500,
              color: colors.textDim,
              letterSpacing: -0.8,
              whiteSpace: "nowrap",
            }}
          >
            github.com/<span style={{ color: colors.text }}>theruknology</span>
            <span style={{ color: colors.textFaint }}>/</span>
            <span style={{ color: colors.accent }}>peek</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -8,
            height: 3,
            borderRadius: 2,
            background: colors.accent,
            transform: `scaleX(${repoUnderlineW})`,
            transformOrigin: "left center",
            boxShadow: `0 0 18px ${colors.accentGlow}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Star: React.FC = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.5l2.95 6.32 6.95.66-5.25 4.7 1.55 6.82L12 17.6l-6.2 3.4 1.55-6.82-5.25-4.7 6.95-.66L12 2.5z"
      fill={colors.accent}
      stroke={colors.accent}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
