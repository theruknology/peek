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

type Pillar = {
  glyph: React.ReactNode;
  title: string;
  subtitle: string;
};

const PILLARS: Pillar[] = [
  {
    glyph: <LockGlyph />,
    title: "100% local",
    subtitle: "no cloud · no API key",
  },
  {
    glyph: <BoltGlyph />,
    title: "200ms queries",
    subtitle: "sqlite + local embeddings",
  },
  {
    glyph: <BinaryGlyph />,
    title: "single binary",
    subtitle: "rust + ratatui",
  },
];

export const Pillars: React.FC<Props> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOut = interpolate(
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
        opacity: fadeOut,
      }}
    >
      <div style={{ display: "flex", gap: 64 }}>
        {PILLARS.map((p, i) => (
          <PillarCard key={i} index={i} pillar={p} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const PillarCard: React.FC<{
  index: number;
  pillar: Pillar;
  frame: number;
  fps: number;
}> = ({ index, pillar, frame, fps }) => {
  const appear = spring({
    frame: frame - index * 9,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.95 },
  });
  const op = interpolate(appear, [0, 1], [0, 1]);
  const ty = interpolate(appear, [0, 1], [40, 0]);
  const sc = interpolate(appear, [0, 1], [0.92, 1]);
  const blur = interpolate(appear, [0, 1], [10, 0]);

  // Subtle "breathing" on glyph
  const breathe = Math.sin(((frame - index * 8) / 30) * Math.PI) * 0.5 + 0.5;
  const glow = 0.4 + breathe * 0.3;

  return (
    <div
      style={{
        width: 360,
        padding: "44px 32px",
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        opacity: op,
        transform: `translateY(${ty}px) scale(${sc})`,
        filter: `blur(${blur}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: radii.md,
          background: colors.surfaceHi,
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.accent,
          boxShadow: `0 0 ${24 * glow}px ${colors.accentGlow}`,
        }}
      >
        {pillar.glyph}
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 34,
          fontWeight: 700,
          color: colors.text,
          letterSpacing: -0.8,
        }}
      >
        {pillar.title}
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 17,
          fontWeight: 400,
          color: colors.textDim,
          letterSpacing: -0.2,
        }}
      >
        {pillar.subtitle}
      </div>
    </div>
  );
};

function LockGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="16" r="1.4" fill="currentColor" />
    </svg>
  );
}

function BoltGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BinaryGlyph() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 9h2v6H7zM12 9h2M13 9v6M12 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
