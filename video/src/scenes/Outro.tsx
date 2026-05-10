import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts, radii } from "../styles";

type Props = { durationInFrames: number };

export const Outro: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const star = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110, mass: 0.7 },
  });
  const starOp = interpolate(star, [0, 1], [0, 1]);
  const starScale = interpolate(star, [0, 1], [0.6, 1]);

  const repo = spring({
    frame: frame - 14,
    fps,
    config: { damping: 22, stiffness: 100, mass: 0.9 },
  });
  const repoOp = interpolate(repo, [0, 1], [0, 1]);
  const repoY = interpolate(repo, [0, 1], [10, 0]);

  const installAppear = spring({
    frame: frame - 36,
    fps,
    config: { damping: 22, stiffness: 100, mass: 0.9 },
  });
  const installOp = interpolate(installAppear, [0, 1], [0, 1]);
  const installY = interpolate(installAppear, [0, 1], [10, 0]);

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
        gap: 36,
        opacity: fade,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          opacity: starOp,
          transform: `scale(${starScale})`,
        }}
      >
        <Star />
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 84,
            color: colors.text,
            letterSpacing: -2,
            fontWeight: 500,
          }}
        >
          peek
        </div>
      </div>

      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: 32,
          color: colors.textDim,
          opacity: repoOp,
          transform: `translateY(${repoY}px)`,
        }}
      >
        github.com/<span style={{ color: colors.accent }}>your-user</span>/peek
      </div>

      <div
        style={{
          display: "flex",
          gap: 18,
          opacity: installOp,
          transform: `translateY(${installY}px)`,
        }}
      >
        <Pill>brew install your-user/peek/peek</Pill>
        <Pill>cargo install peek</Pill>
      </div>
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: fonts.mono,
      fontSize: 20,
      color: colors.text,
      padding: "12px 22px",
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radii.md,
    }}
  >
    <span style={{ color: colors.accent, marginRight: 8 }}>$</span>
    {children}
  </div>
);

const Star: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2.5l2.95 6.32 6.95.66-5.25 4.7 1.55 6.82L12 17.6l-6.2 3.4 1.55-6.82-5.25-4.7 6.95-.66L12 2.5z"
      fill={colors.accent}
      stroke={colors.accent}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
